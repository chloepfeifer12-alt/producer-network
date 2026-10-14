"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { EmptyState, DemoTag } from "@/components/ui/feedback";
import { OrgLogo } from "@/components/brand/org-logo";
import { ListingStatusBadge } from "@/components/domain/badges";
import { PermissionNotice, TableShell, Td, Th } from "@/components/admin/admin-kit";
import { formatDate } from "@/lib/utils/dates";

type TabKey = "pending" | "changes_requested" | "approved" | "closed" | "all";

const MATCH: Record<TabKey, (o: Organization) => boolean> = {
  pending: (o) => o.listingStatus === "pending",
  changes_requested: (o) => o.listingStatus === "changes_requested",
  approved: (o) => o.listingStatus === "approved",
  closed: (o) => o.listingStatus === "rejected" || o.listingStatus === "suspended",
  all: () => true,
};

export default function AdminOrganizationsPage() {
  const db = useDb();
  const user = useCurrentUser();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    const m = new Map<string, { listings: number; live: number; reports: number; seats: number }>();
    for (const o of db.organizations) {
      m.set(o.id, {
        listings: db.opportunities.filter((x) => x.orgId === o.id).length,
        live: db.opportunities.filter((x) => x.orgId === o.id && x.status === "published").length,
        reports: db.reports.filter((r) => r.status === "open" && r.targetType === "organization" && r.targetId === o.id).length,
        seats: db.users.filter((u) => u.orgId === o.id).length,
      });
    }
    return m;
  }, [db]);

  const counts = useMemo(() => Object.fromEntries((Object.keys(MATCH) as TabKey[]).map((k) => [k, db.organizations.filter(MATCH[k]).length])) as Record<TabKey, number>, [db]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.organizations
      .filter(MATCH[tab])
      .filter((o) => !term || [o.name, o.hqCity, o.hqState, ORG_CATEGORY_LABEL[o.category]].some((t) => t.toLowerCase().includes(term)))
      .sort((a, b) => (tab === "approved" || tab === "all" ? a.name.localeCompare(b.name) : b.createdAt.localeCompare(a.createdAt)));
  }, [db, tab, q]);

  const planName = (id: string) => db.plans.find((p) => p.id === id)?.name ?? id;

  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety"
        title="Organizations"
        description="Review applications to join the directory and manage approved organizations. Approval makes a profile public and lets its team publish listings."
        actions={<DemoTag>All organizations are fictional</DemoTag>}
      />
      <PermissionNotice user={user} permission="admin:manage_organizations" what="organization applications" />

      <Card>
        <div className="flex flex-col gap-4 px-5 pt-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <Tabs<TabKey>
            className="lg:border-b-0"
            value={tab}
            onChange={setTab}
            items={[
              { value: "pending", label: "Pending", count: counts.pending },
              { value: "changes_requested", label: "Changes requested", count: counts.changes_requested },
              { value: "approved", label: "Approved", count: counts.approved },
              { value: "closed", label: "Rejected / suspended", count: counts.closed },
              { value: "all", label: "All", count: counts.all },
            ]}
          />
          <div className="relative pb-3 lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-[11px] h-4 w-4 text-ink-4" />
            <Input aria-label="Search organizations" placeholder="Search name or location" className="h-9 pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-line p-5 sm:p-6">
            <EmptyState
              compact
              icon={<Building2 className="h-5 w-5" />}
              title={q ? "No organizations match your search" : tab === "pending" ? "No applications awaiting review" : "Nothing here"}
              description={tab === "pending" && !q ? "New organization applications will appear here for approval." : undefined}
            />
          </div>
        ) : (
          <TableShell minWidth={860} className="border-t border-line">
            <thead>
              <tr>
                <Th>Organization</Th>
                <Th>Category</Th>
                <Th>Headquarters</Th>
                <Th>Plan</Th>
                <Th className="text-right">Listings</Th>
                <Th>Created</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const s = stats.get(o.id)!;
                return (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition hover:bg-subtle/50"
                    onClick={() => router.push(`/admin/organizations/${o.id}`)}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <OrgLogo brand={o.brand} name={o.name} size={34} />
                        <div className="min-w-0">
                          <Link href={`/admin/organizations/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-ink hover:text-navy hover:underline underline-offset-4">
                            {o.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-ink-3">
                            <span>{s.seats} team account{s.seats === 1 ? "" : "s"}</span>
                            {s.reports > 0 && <Badge tone="danger">{s.reports} open report{s.reports === 1 ? "" : "s"}</Badge>}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>{ORG_CATEGORY_LABEL[o.category]}</Td>
                    <Td className="whitespace-nowrap">{o.hqCity}, {o.hqState}</Td>
                    <Td>{planName(o.plan)}</Td>
                    <Td className="text-right tabular-nums">
                      {s.live}<span className="text-ink-4"> / {s.listings}</span>
                    </Td>
                    <Td className="whitespace-nowrap">{formatDate(o.createdAt)}</Td>
                    <Td><ListingStatusBadge status={o.listingStatus} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
        <p className="px-5 py-3 text-xs text-ink-4 sm:px-6">Listings column shows published / total. Select a row to open the review page.</p>
      </Card>
    </div>
  );
}
