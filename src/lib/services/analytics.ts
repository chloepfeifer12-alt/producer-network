/**
 * DEMONSTRATION ANALYTICS.
 * Totals are derived from the shared prototype data (applications, views)
 * so numbers stay internally consistent. Daily trend lines are deterministic
 * synthetic distributions of those totals — not real traffic.
 */
import type { Database, PipelineStage, SeriesPoint } from "@/lib/data/types";
import { STAGE_ORDER } from "@/lib/data/taxonomy";
import { daysAgo } from "@/lib/utils/dates";
import { hashString, seeded } from "@/lib/utils/format";

export function distributeSeries(key: string, total: number, days = 30, trend = 0.35): SeriesPoint[] {
  const rand = seeded(hashString(key) + 7);
  const weights = Array.from({ length: days }, (_, i) => {
    const weekday = new Date(daysAgo(days - 1 - i)).getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.55 : 1;
    return (1 + trend * (i / days)) * weekend * (0.7 + rand() * 0.6);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  return weights.map((w, i) => {
    const target = Math.round(((weights.slice(0, i + 1).reduce((a, b) => a + b, 0)) / sum) * total);
    const value = target - acc;
    acc = target;
    return { date: daysAgo(days - 1 - i), value };
  });
}

export function orgAnalytics(db: Database, orgId: string) {
  const opps = db.opportunities.filter((o) => o.orgId === orgId);
  const apps = db.applications.filter((a) => a.orgId === orgId && !a.withdrawn);
  const listingViews = opps.reduce((s, o) => s + o.views, 0);
  const profileViews = db.orgProfileViews[orgId] ?? 0;
  const byStage = Object.fromEntries(STAGE_ORDER.map((s) => [s, apps.filter((a) => a.stage === s).length])) as Record<PipelineStage, number>;
  const reachedInterview = apps.filter((a) => ["interview", "offer", "hired"].includes(a.stage)).length;
  const hired = byStage.hired;
  const perOpportunity = opps
    .filter((o) => o.status === "published" || o.status === "archived")
    .map((o) => {
      const count = apps.filter((a) => a.opportunityId === o.id).length;
      return { opportunity: o, views: o.views, applications: count, conversion: o.views ? count / o.views : 0 };
    })
    .sort((a, b) => b.views - a.views);
  // Last-30-day windows: ~38% of lifetime listing views, all applications from last 30 days.
  const recentApps = apps.filter((a) => a.submittedAt >= daysAgo(30, 0));
  return {
    listingViews,
    profileViews,
    applications: apps.length,
    byStage,
    reachedInterview,
    hired,
    viewToApply: listingViews ? apps.length / listingViews : 0,
    applyToInterview: apps.length ? reachedInterview / apps.length : 0,
    perOpportunity,
    viewsSeries: distributeSeries(`views-${orgId}`, Math.round(listingViews * 0.38)),
    profileSeries: distributeSeries(`profile-${orgId}`, Math.round(profileViews * 0.3)),
    applicationsSeries: Array.from({ length: 30 }, (_, i) => {
      const day = daysAgo(29 - i, 0);
      const next = daysAgo(28 - i, 0);
      return { date: day, value: recentApps.filter((a) => a.submittedAt >= day && a.submittedAt < next).length };
    }),
  };
}

export function platformAnalytics(db: Database) {
  const members = db.users.filter((u) => u.kind === "producer" || u.kind === "aspiring");
  const published = db.opportunities.filter((o) => o.status === "published").length;
  return {
    members: members.length,
    producers: db.users.filter((u) => u.kind === "producer").length,
    aspiring: db.users.filter((u) => u.kind === "aspiring").length,
    orgUsers: db.users.filter((u) => u.kind === "organization").length,
    organizations: db.organizations.length,
    approvedOrgs: db.organizations.filter((o) => o.listingStatus === "approved").length,
    pendingOrgs: db.organizations.filter((o) => o.listingStatus === "pending").length,
    publishedOpps: published,
    pendingOpps: db.opportunities.filter((o) => o.status === "pending_review").length,
    applications: db.applications.length,
    openReports: db.reports.filter((r) => r.status === "open").length,
    activeSponsored: db.sponsored.filter((s) => s.status === "active").length,
    requestedSponsored: db.sponsored.filter((s) => s.status === "requested").length,
    connections: db.connections.filter((c) => c.status === "accepted").length,
    posts: db.posts.length,
    planMix: db.plans.map((p) => ({ plan: p, count: db.organizations.filter((o) => o.plan === p.id && o.listingStatus === "approved").length })),
    illustrativeMRR: db.organizations
      .filter((o) => o.listingStatus === "approved")
      .reduce((s, o) => s + (db.plans.find((p) => p.id === o.plan)?.priceMonthly ?? 0), 0),
    signupSeries: distributeSeries("signups", 184, 30, 0.6),
    applicationSeries: distributeSeries("platform-apps", 96, 30, 0.4),
  };
}
