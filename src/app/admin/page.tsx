"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Flag, Gavel, Megaphone } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { platformAnalytics } from "@/lib/services/analytics";
import { REPORT_REASON_LABEL } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { AreaChart } from "@/components/ui/charts";
import { DemoTag } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { OrgLogo } from "@/components/brand/org-logo";
import { AuditFeed } from "@/components/admin/audit-feed";
import { SURFACE_LABEL } from "@/components/admin/sponsored-preview";
import { compactNumber, moneyExact } from "@/lib/utils/format";
import { formatDate, relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function KpiLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-100 [&>div]:h-full [&>div]:transition [&>div:hover]:border-line-strong">
      {children}
    </Link>
  );
}

function Queue({ title, icon, href, count, empty, children }: { title: string; icon: ReactNode; href: string; count: number; empty: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg ring-1", count ? "bg-gold-50 text-gold-ink ring-gold-200" : "bg-subtle text-ink-4 ring-line")}>{icon}</span>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
          <span className={cn("rounded-full px-1.5 text-[11px] font-medium tabular-nums", count ? "bg-ink text-white" : "bg-sunken text-ink-3")}>{count}</span>
        </div>
        <Link href={href} className="inline-flex items-center gap-1 text-[13px] text-navy-600 hover:text-navy">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex-1 px-5 pb-4 pt-3 sm:px-6">
        {count === 0 ? <p className="py-4 text-[13px] text-ink-3">{empty}</p> : <ul className="divide-y divide-line">{children}</ul>}
      </div>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const db = useDb();
  const user = useCurrentUser();
  const a = useMemo(() => platformAnalytics(db), [db]);

  const pendingOrgs = useMemo(() => db.organizations.filter((o) => o.listingStatus === "pending").sort((x, y) => y.createdAt.localeCompare(x.createdAt)), [db]);
  const flagged = useMemo(() => db.opportunities.filter((o) => o.status === "pending_review").sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)), [db]);
  const openReports = useMemo(() => db.reports.filter((r) => r.status === "open").sort((x, y) => y.createdAt.localeCompare(x.createdAt)), [db]);
  const sponsoredRequests = useMemo(() => db.sponsored.filter((s) => s.status === "requested"), [db]);
  const orgById = (id: string) => db.organizations.find((o) => o.id === id);
  const signups30 = a.signupSeries.reduce((s, p) => s + p.value, 0);
  const totalQueue = pendingOrgs.length + flagged.length + openReports.length + sponsoredRequests.length;

  return (
    <div>
      <PageHeader
        eyebrow="Trust & operations"
        title={`Good to see you, ${user?.name.split(" ")[0] ?? "admin"}`}
        description={totalQueue ? `${totalQueue} item${totalQueue === 1 ? "" : "s"} across the review queues need a decision. Everything you do here is recorded in the audit log.` : "All review queues are clear. Everything you do here is recorded in the audit log."}
        actions={<DemoTag>Synthetic platform</DemoTag>}
      />

      <section aria-label="Platform at a glance" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiLink href="/admin/users"><Stat label="Members" value={compactNumber(a.members)} sub={`${a.producers} producers · ${a.aspiring} aspiring`} /></KpiLink>
        <KpiLink href="/admin/organizations"><Stat label="Organizations" value={a.approvedOrgs} sub={`approved · ${a.pendingOrgs} pending review`} /></KpiLink>
        <KpiLink href="/admin/opportunities?tab=published"><Stat label="Published listings" value={a.publishedOpps} sub={`${a.applications} applications to date`} /></KpiLink>
        <KpiLink href="/admin/opportunities"><Stat label="Awaiting review" value={a.pendingOpps} sub="listings in moderation" className={a.pendingOpps ? "border-gold-200" : undefined} /></KpiLink>
        <KpiLink href="/admin/reports"><Stat label="Open reports" value={a.openReports} sub="member-submitted" className={a.openReports ? "border-gold-200" : undefined} /></KpiLink>
        <KpiLink href="/admin/sponsored"><Stat label="Sponsored placements" value={a.activeSponsored} sub={`active · ${a.requestedSponsored} requested`} /></KpiLink>
        <KpiLink href="/admin/plans">
          <Stat label="Monthly recurring (illustrative)" value={moneyExact(a.illustrativeMRR)} sub="Illustrative — no billing connected" />
        </KpiLink>
        <KpiLink href="/admin/analytics"><Stat label="Connections" value={a.connections} sub={`${a.posts} community posts`} /></KpiLink>
      </section>

      <section aria-labelledby="needs-attention" className="mt-10">
        <h2 id="needs-attention" className="mb-4 font-display text-2xl">Needs attention</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Queue title="Organization applications" icon={<Building2 className="h-4 w-4" />} href="/admin/organizations" count={pendingOrgs.length} empty="No organizations awaiting approval.">
            {pendingOrgs.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/organizations/${o.id}`} className="flex items-center gap-3 py-2.5 hover:text-navy">
                  <OrgLogo brand={o.brand} name={o.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-ink">{o.name}</div>
                    <div className="truncate text-xs text-ink-3">{o.hqCity}, {o.hqState} · submitted {relativeDay(o.createdAt).toLowerCase()}</div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-4" />
                </Link>
              </li>
            ))}
          </Queue>

          <Queue title="Flagged listings" icon={<Gavel className="h-4 w-4" />} href="/admin/opportunities" count={flagged.length} empty="No listings awaiting review.">
            {flagged.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/opportunities?review=${o.id}`} className="block py-2.5 hover:text-navy">
                  <div className="truncate text-[13.5px] font-medium text-ink">{o.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                    <span>{orgById(o.orgId)?.name}</span>
                    <span aria-hidden>·</span>
                    <span className={o.moderation?.flags.length ? "text-danger" : undefined}>{o.moderation?.flags.length ?? 0} pre-screen flag{o.moderation?.flags.length === 1 ? "" : "s"}</span>
                  </div>
                </Link>
              </li>
            ))}
          </Queue>

          <Queue title="Open reports" icon={<Flag className="h-4 w-4" />} href="/admin/reports" count={openReports.length} empty="No open member reports.">
            {openReports.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reports#${r.id}`} className="block py-2.5 hover:text-navy">
                  <div className="truncate text-[13.5px] font-medium text-ink">{REPORT_REASON_LABEL[r.reason]}</div>
                  <div className="mt-0.5 truncate text-xs text-ink-3">{r.targetType} · {relativeDay(r.createdAt)}</div>
                </Link>
              </li>
            ))}
          </Queue>

          <Queue title="Sponsored requests" icon={<Megaphone className="h-4 w-4" />} href="/admin/sponsored" count={sponsoredRequests.length} empty="No sponsored placement requests.">
            {sponsoredRequests.slice(0, 3).map((s) => (
              <li key={s.id}>
                <Link href="/admin/sponsored" className="block py-2.5 hover:text-navy">
                  <div className="truncate text-[13.5px] font-medium text-ink">{orgById(s.orgId)?.name}</div>
                  <div className="mt-0.5 truncate text-xs text-ink-3">{SURFACE_LABEL[s.surface]} · {formatDate(s.startsOn, { month: "short", day: "numeric" })} – {formatDate(s.endsOn, { month: "short", day: "numeric" })}</div>
                </Link>
              </li>
            ))}
          </Queue>
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent audit activity"
            description="Every admin and organization action is recorded."
            action={<ButtonLink href="/admin/audit" variant="ghost" size="sm">Full log</ButtonLink>}
          />
          <CardBody className="pt-3">
            <AuditFeed events={db.audit.slice(0, 7)} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="New member signups" description={`${signups30} in the last 30 days`} action={<DemoTag>Demonstration data</DemoTag>} />
          <CardBody>
            <AreaChart data={a.signupSeries} label="New member signups per day, last 30 days (demonstration data)" height={190} />
            <p className="mt-3 text-xs text-ink-4">Synthetic daily distribution — not real traffic. <Link href="/admin/analytics" className="text-navy-600 hover:text-navy">More analytics</Link></p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
