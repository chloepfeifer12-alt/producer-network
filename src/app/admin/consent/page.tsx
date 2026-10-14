"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Lock, Minus, Search, ShieldCheck } from "lucide-react";
import type { ConsentPreferences, ProfileVisibility } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { VISIBILITY_LABEL } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/form";
import { BarList } from "@/components/ui/charts";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { ProgressBar } from "@/components/ui/stat";
import { AuditFeed } from "@/components/admin/audit-feed";
import { TableShell, Td, Th, deniedReason } from "@/components/admin/admin-kit";
import { formatDate } from "@/lib/utils/dates";
import { pct } from "@/lib/utils/format";

type Flag = Exclude<keyof ConsentPreferences, "updatedAt">;
const FLAGS: { key: Flag; label: string; short: string; help: string }[] = [
  { key: "recruiterContact", label: "Recruiter contact opt-in", short: "Recruiter contact", help: "Organizations may reach out without an application." },
  { key: "showInDirectory", label: "Directory visibility", short: "Directory", help: "Appears in the member directory and talent discovery." },
  { key: "showLicenses", label: "License visibility", short: "Licenses", help: "Self-reported licenses visible to signed-in members." },
  { key: "shareNpnOnApply", label: "NPN sharing on apply", short: "NPN on apply", help: "NPN shared only with organizations they apply to." },
];

function FlagCell({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-50 text-success" aria-label={`${label}: on`} title={`${label}: on`}>
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sunken text-ink-4" aria-label={`${label}: off`} title={`${label}: off`}>
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

export default function AdminConsentPage() {
  const db = useDb();
  const user = useCurrentUser();
  const allowed = can(user, "admin:view_consent");
  const [q, setQ] = useState("");

  const members = useMemo(
    () =>
      db.profiles
        .map((p) => ({ p, u: db.users.find((u) => u.id === p.userId) }))
        .filter((x): x is { p: typeof x.p; u: NonNullable<typeof x.u> } => !!x.u)
        .sort((a, b) => b.p.consent.updatedAt.localeCompare(a.p.consent.updatedAt)),
    [db],
  );
  const total = members.length;
  const counts = useMemo(() => Object.fromEntries(FLAGS.map((f) => [f.key, members.filter((m) => m.p.consent[f.key]).length])) as Record<Flag, number>, [members]);
  const visibility = useMemo(
    () => (["public", "members", "private"] as ProfileVisibility[]).map((v) => ({ label: VISIBILITY_LABEL[v], value: members.filter((m) => m.p.visibility === v).length })),
    [members],
  );
  const discoverable = members.filter((m) => m.u.status === "active" && m.p.consent.showInDirectory && m.p.consent.recruiterContact && m.p.visibility !== "private" && m.p.availability !== "not_looking").length;
  const consentEvents = useMemo(() => db.audit.filter((e) => e.action === "member.consent_updated" || e.action === "user.consent_viewed").slice(0, 8), [db]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((m) => !term || m.u.name.toLowerCase().includes(term));
  }, [members, q]);

  if (!allowed) {
    return (
      <div>
        <PageHeader eyebrow="People & access" title="Consent status" />
        <EmptyState icon={<Lock className="h-5 w-5" />} title="Consent settings are restricted" description={deniedReason(user, "admin:view_consent")} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="People & access"
        title="Consent status"
        description="How members have chosen to share their information. Organizations only ever see what these settings — and each application — allow."
      />

      <Notice tone="info" title="You're viewing consent settings, not private profile data" className="mb-8" icon={<ShieldCheck className="h-4 w-4" />}>
        This view exposes each member&apos;s sharing choices only — no NPNs, emails, license numbers or application content. In production, every view of this page would be written to the audit log with the viewer, timestamp and purpose (e.g. support ticket).
      </Notice>

      <section aria-label="Consent totals" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLAGS.map((f) => (
          <div key={f.key} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="text-[13px] text-ink-3">{f.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-ink">{counts[f.key]}</span>
              <span className="text-sm text-ink-3">of {total} · {pct(total ? counts[f.key] / total : 0, 0)}</span>
            </div>
            <ProgressBar value={total ? (counts[f.key] / total) * 100 : 0} className="mt-3" />
            <p className="mt-2 text-xs leading-relaxed text-ink-4">{f.help}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile visibility" description="Who can open a member's profile." />
          <CardBody><BarList items={visibility} valueFormat={(v) => `${v} · ${pct(total ? v / total : 0, 0)}`} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Discoverable by organizations" description="Active, in the directory, opted in to recruiter contact, not private and not marked “not looking”." />
          <CardBody>
            <div className="text-[34px] font-semibold tracking-[-0.03em] tabular-nums">{discoverable}<span className="ml-2 text-base font-normal text-ink-3">of {total} members</span></div>
            <ProgressBar value={total ? (discoverable / total) * 100 : 0} className="mt-3" tone="gold" />
            <p className="mt-3 text-xs leading-relaxed text-ink-3">Talent discovery uses exactly these rules (<code className="font-mono">discoverableCandidates</code>). Everyone else is reachable only if they apply.</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Per-member consent</h2>
            <p className="mt-1 text-[13px] text-ink-3">Sorted by most recently updated.</p>
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
            <Input aria-label="Search members" placeholder="Search members" className="h-9 pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="p-5 sm:p-6"><EmptyState compact title="No members match" /></div>
        ) : (
          <TableShell minWidth={860} className="mt-4 border-t border-line">
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Visibility</Th>
                {FLAGS.map((f) => <Th key={f.key} className="text-center">{f.short}</Th>)}
                <Th>Last updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, u }) => (
                <tr key={p.userId}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} tone={p.avatarTone} size={28} />
                      <div className="min-w-0">
                        <Link href={`/network/members/${u.id}`} className="font-medium text-ink hover:text-navy">{u.name}</Link>
                        <div className="text-xs text-ink-3">{u.kind === "aspiring" ? "Aspiring producer" : "Producer"}{u.status !== "active" ? ` · ${u.status}` : ""}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge tone={p.visibility === "public" ? "success" : p.visibility === "members" ? "navy" : "outline"}>{VISIBILITY_LABEL[p.visibility]}</Badge></Td>
                  {FLAGS.map((f) => <Td key={f.key} className="text-center"><FlagCell on={p.consent[f.key]} label={f.label} /></Td>)}
                  <Td className="whitespace-nowrap">{formatDate(p.consent.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Recent consent activity" description="Member consent changes and support views of consent settings, from the audit log." action={<Link href="/admin/audit" className="text-[13px] text-navy-600 hover:text-navy">Audit log</Link>} />
        <CardBody className="pt-3">
          <AuditFeed events={consentEvents} emptyText="No consent changes recorded yet." />
        </CardBody>
      </Card>
    </div>
  );
}
