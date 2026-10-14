"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChartLine } from "lucide-react";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/data/taxonomy";
import { orgAnalytics } from "@/lib/services/analytics";
import { OrgScope, OrgStatusNotice, type OrgContext } from "@/components/org/org-scope";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader } from "@/components/ui/card";
import { AreaChart, BarList, ColumnChart } from "@/components/ui/charts";
import { DemoTag, EmptyState, Notice } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";
import { OppStatusBadge } from "@/components/domain/badges";
import { compactNumber, pct } from "@/lib/utils/format";

export default function AnalyticsPage() {
  return <OrgScope>{(ctx) => <Analytics {...ctx} />}</OrgScope>;
}

function sum(xs: { value: number }[]) {
  return xs.reduce((s, x) => s + x.value, 0);
}

function Analytics({ db, org }: OrgContext) {
  const a = useMemo(() => orgAnalytics(db, org.id), [db, org.id]);
  const funnel = STAGE_ORDER.map((s) => ({ label: STAGE_LABEL[s], value: a.byStage[s] }));
  const hasData = a.listingViews > 0 || a.applications > 0 || a.profileViews > 0;

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Analytics"
        description="How candidates find and respond to your listings. Totals reconcile with your pipeline and listings."
        actions={<DemoTag>Demonstration data — synthetic</DemoTag>}
      />
      <OrgStatusNotice org={org} className="mb-4" />
      <Notice tone="demo" className="mb-8" title="About these numbers">
        Totals are derived from this prototype&apos;s synthetic data. Daily trend lines are deterministic synthetic distributions of those totals — not real traffic. No tracking is performed.
      </Notice>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Listing views" value={compactNumber(a.listingViews)} sub="Lifetime, all listings" />
        <Stat label="Profile views" value={compactNumber(a.profileViews)} sub="Public org profile" />
        <Stat label="Applications" value={a.applications} sub="Excludes withdrawn" />
        <Stat label="View → apply" value={pct(a.viewToApply)} sub="Applications ÷ listing views" />
        <Stat label="Apply → interview" value={pct(a.applyToInterview, 0)} sub={`${a.reachedInterview} reached interview or later`} />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<ChartLine className="h-5 w-5" strokeWidth={1.75} />}
          title="No activity to chart yet"
          description="Once your listings are published and members start viewing them, trends will appear here."
          action={<Link href="/org/opportunities" className="text-sm font-medium text-navy-600 hover:text-navy">Manage opportunities</Link>}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Listing views" description={`Last 30 days · ${sum(a.viewsSeries).toLocaleString()} views`} />
              <div className="px-3 pb-4 pt-4 sm:px-4"><AreaChart data={a.viewsSeries} label="Daily listing views, last 30 days" /></div>
            </Card>
            <Card>
              <CardHeader title="Applications per day" description={`Last 30 days · ${sum(a.applicationsSeries)} applications`} />
              <div className="px-3 pb-4 pt-4 sm:px-4"><ColumnChart data={a.applicationsSeries} height={200} label="Applications per day, last 30 days" /></div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader title="Profile traffic" description={`Organization profile views · last 30 days · ${sum(a.profileSeries).toLocaleString()} views`} />
              <div className="px-3 pb-4 pt-4 sm:px-4"><AreaChart data={a.profileSeries} label="Daily organization profile views, last 30 days" /></div>
            </Card>
            <Card>
              <CardHeader title="Pipeline by stage" description="Current candidates at each stage (excludes withdrawn)." />
              <div className="px-5 pb-6 pt-5 sm:px-6"><BarList items={funnel} /></div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Opportunity performance" description="Published and archived listings, ranked by views." />
            {a.perOpportunity.length === 0 ? (
              <div className="px-5 pb-5 pt-4 sm:px-6"><EmptyState compact title="No published listings yet" description="Performance appears once a listing has been live." /></div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-y border-line bg-subtle/60 text-xs text-ink-3">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium sm:px-6">Listing</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Views</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Applications</th>
                      <th scope="col" className="px-5 py-3 text-right font-medium sm:px-6">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {a.perOpportunity.map((r) => (
                      <tr key={r.opportunity.id}>
                        <td className="max-w-[320px] truncate px-5 py-3 sm:px-6">
                          <Link href={`/org/opportunities/${r.opportunity.id}`} className="font-medium text-ink hover:underline hover:underline-offset-4">{r.opportunity.title}</Link>
                        </td>
                        <td className="px-4 py-3"><OppStatusBadge status={r.opportunity.status} /></td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.applications}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-ink-2 sm:px-6">{r.views ? pct(r.conversion) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
