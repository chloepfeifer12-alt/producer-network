"use client";

import { useMemo, useState } from "react";
import { Lock, ScrollText, Search } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can, ROLE_LABEL } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { AuditActionBadge, auditTarget, deniedReason, profileTone, TableShell, TargetLink, Td, Th, userName } from "@/components/admin/admin-kit";
import { formatDateTime } from "@/lib/utils/dates";

const PREFIXES: { value: string; label: string }[] = [
  { value: "organization.", label: "Organizations" },
  { value: "opportunity.", label: "Listings" },
  { value: "report.", label: "Reports" },
  { value: "sponsored.", label: "Sponsored" },
  { value: "user.", label: "Users" },
  { value: "member.", label: "Member consent" },
  { value: "billing.", label: "Billing (demo)" },
  { value: "plan.", label: "Plans" },
  { value: "application.", label: "Applications" },
  { value: "talent.", label: "Talent outreach" },
];

const PAGE = 40;

export default function AdminAuditPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [actor, setActor] = useState("all");
  const [prefix, setPrefix] = useState("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const actors = useMemo(() => {
    const ids = [...new Set(db.audit.map((e) => e.actorId))];
    return ids.map((id) => ({ id, name: userName(db, id) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [db]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.audit
      .filter((e) => actor === "all" || e.actorId === actor)
      .filter((e) => prefix === "all" || e.action.startsWith(prefix))
      .filter((e) => !term || `${e.action} ${e.detail} ${auditTarget(db, e).label} ${userName(db, e.actorId)}`.toLowerCase().includes(term))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [db, actor, prefix, q]);

  if (!can(user, "admin:view_audit")) {
    return (
      <div>
        <PageHeader eyebrow="People & access" title="Audit log" />
        <EmptyState icon={<Lock className="h-5 w-5" />} title="The audit log is restricted" description={deniedReason(user, "admin:view_audit")} />
      </div>
    );
  }

  const filtered = actor !== "all" || prefix !== "all" || q.trim() !== "";

  return (
    <div>
      <PageHeader
        eyebrow="People & access"
        title="Audit log"
        description="A chronological record of every consequential action — moderation decisions, account changes, consent updates, billing and configuration."
      />
      <Notice tone="info" className="mb-6" icon={<ScrollText className="h-4 w-4" />}>
        In production this log is append-only and tamper-evident (hash-chained, written to write-once storage), retained per policy and exportable for compliance review. Here it lives in this browser&apos;s demo data.
      </Notice>

      <Card>
        <div className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-[minmax(0,1fr)_200px_200px] sm:px-6">
          <Field id="audit-q" label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
              <Input id="audit-q" className="pl-9" placeholder="Action, target or detail" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} />
            </div>
          </Field>
          <Field id="audit-actor" label="Actor">
            <Select id="audit-actor" value={actor} onChange={(e) => { setActor(e.target.value); setLimit(PAGE); }}>
              <option value="all">All actors</option>
              {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field id="audit-prefix" label="Action type">
            <Select id="audit-prefix" value={prefix} onChange={(e) => { setPrefix(e.target.value); setLimit(PAGE); }}>
              <option value="all">All actions</option>
              {PREFIXES.map((p) => <option key={p.value} value={p.value}>{p.label} ({p.value}*)</option>)}
            </Select>
          </Field>
        </div>

        {rows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              compact
              icon={<ScrollText className="h-5 w-5" />}
              title="No matching entries"
              action={filtered ? <Button variant="secondary" size="sm" onClick={() => { setActor("all"); setPrefix("all"); setQ(""); }}>Clear filters</Button> : undefined}
            />
          </div>
        ) : (
          <TableShell minWidth={960}>
            <thead>
              <tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Target</Th><Th>Detail</Th></tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((e) => {
                const u = db.users.find((x) => x.id === e.actorId);
                return (
                  <tr key={e.id} className="align-top">
                    <Td className="whitespace-nowrap align-top text-[12.5px] tabular-nums text-ink-3"><time dateTime={e.at}>{formatDateTime(e.at)}</time></Td>
                    <Td className="align-top">
                      <div className="flex items-center gap-2">
                        <Avatar name={u?.name ?? e.actorId} tone={profileTone(db, e.actorId)} size={24} />
                        <div className="min-w-0">
                          <div className="whitespace-nowrap text-[13px] font-medium text-ink">{u?.name ?? e.actorId}</div>
                          {u && <div className="text-[11px] text-ink-4">{ROLE_LABEL(u)}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td className="align-top"><AuditActionBadge action={e.action} /></Td>
                    <Td className="max-w-[220px] align-top text-[13px]"><TargetLink db={db} event={e} /></Td>
                    <Td className="max-w-[320px] align-top text-[13px] text-ink-3">{e.detail || "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
        <div className="flex items-center justify-between gap-3 px-5 py-3 text-xs text-ink-4 sm:px-6">
          <span>Showing {Math.min(limit, rows.length)} of {rows.length}{filtered ? ` (filtered from ${db.audit.length})` : ""} entries</span>
          {rows.length > limit && <Button variant="secondary" size="xs" onClick={() => setLimit((l) => l + PAGE)}>Show more</Button>}
        </div>
      </Card>
    </div>
  );
}
