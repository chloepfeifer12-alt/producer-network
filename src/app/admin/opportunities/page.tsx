"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Gavel, Search } from "lucide-react";
import type { Database, Opportunity, OpportunityStatus } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { LEADS_LABEL } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { OrgLogo } from "@/components/brand/org-logo";
import { KindBadge, OppStatusBadge } from "@/components/domain/badges";
import { PermissionNotice, userName } from "@/components/admin/admin-kit";
import { FlagList, Highlight, ModerationPolicyCard } from "@/components/admin/moderation";
import { effectiveFlags, OpportunityReviewDialog } from "@/components/admin/opportunity-review";
import { compensationLabel } from "@/lib/utils/format";
import { relativeDay } from "@/lib/utils/dates";

type TabKey = "pending" | "changes" | "rejected" | "published" | "all";
const TAB_STATUS: Record<Exclude<TabKey, "all">, OpportunityStatus> = {
  pending: "pending_review",
  changes: "changes_requested",
  rejected: "rejected",
  published: "published",
};
const TAB_FOR_STATUS: Partial<Record<OpportunityStatus, TabKey>> = {
  pending_review: "pending",
  changes_requested: "changes",
  rejected: "rejected",
  published: "published",
};

export default function AdminOpportunitiesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ModerationQueue />
    </Suspense>
  );
}

function ModerationQueue() {
  const db = useDb();
  const user = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();

  const initialReview = params.get("review");
  const [reviewId, setReviewId] = useState<string | null>(initialReview);
  const [tab, setTab] = useState<TabKey>(() => {
    const t = params.get("tab") as TabKey | null;
    if (t && ["pending", "changes", "rejected", "published", "all"].includes(t)) return t;
    const o = initialReview ? db.opportunities.find((x) => x.id === initialReview) : undefined;
    return (o && TAB_FOR_STATUS[o.status]) ?? (o ? "all" : "pending");
  });
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const c = { pending: 0, changes: 0, rejected: 0, published: 0, all: db.opportunities.length } as Record<TabKey, number>;
    for (const o of db.opportunities) {
      const t = TAB_FOR_STATUS[o.status];
      if (t) c[t] += 1;
    }
    return c;
  }, [db]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const orgName = (id: string) => db.organizations.find((o) => o.id === id)?.name ?? "";
    return db.opportunities
      .filter((o) => tab === "all" || o.status === TAB_STATUS[tab])
      .filter((o) => !term || `${o.title} ${orgName(o.orgId)}`.toLowerCase().includes(term))
      .map((o) => ({ o, ...effectiveFlags(o) }))
      .sort((a, b) => (tab === "published" ? b.flags.length - a.flags.length : 0) || b.o.updatedAt.localeCompare(a.o.updatedAt));
  }, [db, tab, q]);

  const reviewing = reviewId ? db.opportunities.find((o) => o.id === reviewId) : undefined;
  const velorum = db.opportunities.find((o) => o.id === "opp_velorum_flagged");

  const closeReview = () => {
    setReviewId(null);
    if (params.get("review")) router.replace("/admin/opportunities", { scroll: false });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety"
        title="Listing moderation"
        description="Listings flagged by the automated pre-screen — or submitted by organizations awaiting approval — wait here for a human decision. Published listings can be spot-checked and unpublished."
      />
      <PermissionNotice user={user} permission="admin:moderate_content" what="the moderation queue" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {velorum && velorum.status === "pending_review" && (
            <Notice tone="demo" title="Walkthrough" className="mb-4">
              The seeded Velorum listing was flagged for income claims, guarantee language and undisclosed lead costs.{" "}
              <button type="button" className="font-medium underline underline-offset-2" onClick={() => setReviewId(velorum.id)}>Open its review</button>{" "}
              to see highlighted phrases, then request changes or reject with a reason code. Its organization is still pending, so approval is blocked until the{" "}
              <Link href={`/admin/organizations/${velorum.orgId}`} className="font-medium underline underline-offset-2">organization review</Link> is complete.
            </Notice>
          )}

          <Card>
            <div className="flex flex-col gap-3 px-5 pt-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
              <Tabs<TabKey>
                className="lg:border-b-0"
                value={tab}
                onChange={setTab}
                items={[
                  { value: "pending", label: "Needs review", count: counts.pending },
                  { value: "changes", label: "Changes requested", count: counts.changes },
                  { value: "rejected", label: "Rejected", count: counts.rejected },
                  { value: "published", label: "Published (spot-check)", count: counts.published },
                  { value: "all", label: "All", count: counts.all },
                ]}
              />
              <div className="relative pb-3 lg:w-56">
                <Search className="pointer-events-none absolute left-3 top-[11px] h-4 w-4 text-ink-4" />
                <Input aria-label="Search listings" placeholder="Search title or organization" className="h-9 pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>

            <div className="border-t border-line">
              {rows.length === 0 ? (
                <div className="p-5 sm:p-6">
                  <EmptyState
                    compact
                    icon={<Gavel className="h-5 w-5" />}
                    title={q ? "No listings match your search" : tab === "pending" ? "The review queue is clear" : "No listings in this state"}
                    description={tab === "pending" && !q ? "New submissions flagged by the pre-screen will appear here." : undefined}
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {rows.map(({ o, flags, liveOnly }) => (
                    <QueueItem key={o.id} db={db} o={o} flags={flags} liveOnly={liveOnly} onReview={() => setReviewId(o.id)} />
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <ModerationPolicyCard />
          <p className="px-1 text-xs leading-relaxed text-ink-4">
            Decisions notify the organization and are written to the <Link href="/admin/audit" className="text-navy-600 hover:text-navy">audit log</Link>. Reviewer: {userName(db, user?.id ?? "")}.
          </p>
        </aside>
      </div>

      {reviewing && <OpportunityReviewDialog key={reviewing.id} opp={reviewing} user={user} onClose={closeReview} />}
    </div>
  );
}

function QueueItem({ db, o, flags, liveOnly, onReview }: { db: Database; o: Opportunity; flags: ReturnType<typeof effectiveFlags>["flags"]; liveOnly: number; onReview: () => void }) {
  const org = db.organizations.find((x) => x.id === o.orgId);
  const extra = flags.map((f) => f.excerpt ?? "").filter(Boolean);
  return (
    <li className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          {org && <OrgLogo brand={org.brand} name={org.name} size={36} className="mt-0.5" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-3">
              {org ? <Link href={`/admin/organizations/${org.id}`} className="hover:text-navy">{org.name}</Link> : "Unknown organization"}
              <span aria-hidden>·</span>
              <span>updated {relativeDay(o.updatedAt).toLowerCase()}</span>
              {org && org.listingStatus !== "approved" && <Badge tone="gold">Org {org.listingStatus.replace("_", " ")}</Badge>}
            </div>
            <h3 className="mt-0.5 text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
              <Highlight text={o.title} extra={extra} />
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <KindBadge kind={o.kind} />
              <OppStatusBadge status={o.status} />
              {flags.length > 0 && <Badge tone="danger">{flags.length} flag{flags.length === 1 ? "" : "s"}{liveOnly ? ` · ${liveOnly} from re-screen` : ""}</Badge>}
            </div>

            <div className="mt-3 grid gap-3 text-[13px] md:grid-cols-2">
              <div className="rounded-lg bg-subtle/70 p-2.5">
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">Compensation as disclosed</div>
                <div className="mt-0.5 font-medium text-ink">{compensationLabel(o.compensation)}</div>
                <div className="mt-0.5 line-clamp-2 text-ink-3">{o.compensation.notes ? <Highlight text={o.compensation.notes} extra={extra} /> : <em className="text-danger">Not described</em>}</div>
              </div>
              <div className="rounded-lg bg-subtle/70 p-2.5">
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">Leads</div>
                <div className="mt-0.5 font-medium text-ink">{LEADS_LABEL[o.leads]}</div>
                <div className="mt-0.5 line-clamp-2 text-ink-3">{o.leadsNotes || <em className={o.leads === "available_at_cost" ? "text-danger" : undefined}>{o.leads === "available_at_cost" ? "No cost disclosure" : "No notes"}</em>}</div>
              </div>
            </div>

            {flags.length > 0 && <FlagList flags={flags} className="mt-3" />}
            {o.moderation?.reviewerNote && o.status !== "pending_review" && (
              <p className="mt-3 text-xs text-ink-3"><span className="font-medium text-ink-2">Reviewer note:</span> {o.moderation.reviewerNote}</p>
            )}
          </div>
        </div>
        <Button variant={o.status === "pending_review" ? "primary" : "secondary"} size="sm" onClick={onReview} className="self-start">
          {o.status === "pending_review" ? "Review" : o.status === "published" ? "Spot-check" : "Open"} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}
