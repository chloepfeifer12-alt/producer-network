"use client";

import { useMemo } from "react";
import type { OrgCategory, UserKind } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { platformAnalytics } from "@/lib/services/analytics";
import { LINES_BY_SECTOR, ORG_CATEGORY_LABEL, SECTOR_LABEL, STAGE_LABEL, STAGE_ORDER } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AreaChart, BarList, ColumnChart } from "@/components/ui/charts";
import { DemoTag, Notice } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";

const KIND_LABEL: Record<UserKind, string> = { producer: "Producers", aspiring: "Aspiring producers", organization: "Organization team accounts", admin: "Platform staff" };

export default function AdminAnalyticsPage() {
  const db = useDb();
  const a = useMemo(() => platformAnalytics(db), [db]);

  const byKind = useMemo(() => (Object.keys(KIND_LABEL) as UserKind[]).map((k) => ({ label: KIND_LABEL[k], value: db.users.filter((u) => u.kind === k).length })), [db]);
  const byCategory = useMemo(
    () =>
      (Object.keys(ORG_CATEGORY_LABEL) as OrgCategory[])
        .map((c) => ({ label: ORG_CATEGORY_LABEL[c], value: db.organizations.filter((o) => o.category === c && o.listingStatus === "approved").length }))
        .filter((x) => x.value > 0)
        .sort((x, y) => y.value - x.value),
    [db],
  );
  const published = useMemo(() => db.opportunities.filter((o) => o.status === "published"), [db]);
  const bySector = useMemo(
    () =>
      (Object.keys(LINES_BY_SECTOR) as (keyof typeof LINES_BY_SECTOR)[]).map((sector) => ({
        sector,
        total: published.filter((o) => o.lines.some((l) => LINES_BY_SECTOR[sector].some((x) => x.slug === l))).length,
        items: LINES_BY_SECTOR[sector]
          .map((l) => ({ label: l.name, value: published.filter((o) => o.lines.includes(l.slug)).length }))
          .sort((x, y) => y.value - x.value),
      })),
    [published],
  );
  const byStage = useMemo(() => {
    const live = db.applications.filter((x) => !x.withdrawn);
    return [
      ...STAGE_ORDER.map((s) => ({ label: STAGE_LABEL[s], value: live.filter((x) => x.stage === s).length })),
      { label: "Withdrawn", value: db.applications.length - live.length },
    ];
  }, [db]);

  const signups = a.signupSeries.reduce((s, p) => s + p.value, 0);
  const apps30 = a.applicationSeries.reduce((s, p) => s + p.value, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Platform analytics"
        description="Health of the marketplace at a glance. Totals come from the prototype's shared records; daily trend lines are synthetic distributions."
        actions={<DemoTag>Demonstration data</DemoTag>}
      />
      <Notice tone="demo" className="mb-6">
        All figures are demonstration data generated for this prototype. They do not reflect real traffic, members or organizations.
      </Notice>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Totals">
        <Stat label="Members" value={a.members} sub={`${a.producers} producers · ${a.aspiring} aspiring`} />
        <Stat label="Approved organizations" value={a.approvedOrgs} sub={`${a.organizations} total incl. pending`} />
        <Stat label="Applications" value={a.applications} sub={`${a.publishedOpps} published listings`} />
        <Stat label="Community" value={a.connections} sub={`connections · ${a.posts} posts`} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="New member signups" description={`${signups} in the last 30 days · daily`} action={<DemoTag>Demo</DemoTag>} />
          <CardBody><AreaChart data={a.signupSeries} label="Daily member signups, last 30 days (demonstration data)" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Applications submitted" description={`${apps30} in the last 30 days · daily`} action={<DemoTag>Demo</DemoTag>} />
          <CardBody><ColumnChart data={a.applicationSeries} height={200} label="Daily applications, last 30 days (demonstration data)" /></CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Accounts by type" />
          <CardBody><BarList items={byKind} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Approved organizations by category" />
          <CardBody>{byCategory.length ? <BarList items={byCategory} /> : <p className="text-sm text-ink-3">No approved organizations.</p>}</CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Published listings by category" description="A listing can span several categories, so category counts can exceed the sector total." />
        <CardBody className="grid gap-8 md:grid-cols-2">
          {bySector.map((s) => (
            <div key={s.sector}>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-[13px] font-semibold text-ink">{SECTOR_LABEL[s.sector]}</h3>
                <span className="text-xs text-ink-3">{s.total} listing{s.total === 1 ? "" : "s"}</span>
              </div>
              <BarList items={s.items} />
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Applications by pipeline stage" description="Across all organizations." />
          <CardBody><BarList items={byStage} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Network activity" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              {[
                ["Accepted connections", a.connections],
                ["Pending connection requests", db.connections.filter((c) => c.status === "pending").length],
                ["Community posts", a.posts],
                ["Hidden by moderation", db.posts.filter((p) => p.hidden).length],
                ["Groups", db.groups.length],
                ["Events listed", db.events.length],
              ].map(([label, v]) => (
                <div key={label as string} className="rounded-xl bg-subtle/70 p-3">
                  <dt className="text-xs text-ink-3">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
