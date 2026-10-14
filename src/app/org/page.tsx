"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, Briefcase, Building2, CalendarClock, ChevronRight, Eye, FileText, Inbox, Pencil, Plus, Sparkles, UserCheck, Video, Phone, MapPin,
} from "lucide-react";
import type { Application } from "@/lib/data/types";
import { ORG_CATEGORY_LABEL, STAGE_LABEL, STAGE_ORDER } from "@/lib/data/taxonomy";
import { orgAnalytics } from "@/lib/services/analytics";
import { applicationsForOrg } from "@/lib/services/applications";
import { opportunitiesForOrg } from "@/lib/services/opportunities";
import { can, ROLE_LABEL } from "@/lib/auth/permissions";
import { OrgScope, OrgStatusNotice, type OrgContext } from "@/components/org/org-scope";
import { orgActivityFeed, personName } from "@/components/org/org-utils";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DemoTag, EmptyState } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";
import { ListingStatusBadge, OppStatusBadge } from "@/components/domain/badges";
import { formatDate, formatDateTime, relativeDay } from "@/lib/utils/dates";
import { compactNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function OrgDashboardPage() {
  return <OrgScope>{(ctx) => <Dashboard {...ctx} />}</OrgScope>;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const FORMAT_ICON = { video: Video, phone: Phone, in_person: MapPin } as const;

function Dashboard({ db, user, org }: OrgContext) {
  const stats = useMemo(() => orgAnalytics(db, org.id), [db, org.id]);
  const apps = useMemo(() => applicationsForOrg(db, org.id), [db, org.id]);
  const opps = useMemo(() => opportunitiesForOrg(db, org.id), [db, org.id]);
  const feed = useMemo(() => orgActivityFeed(db, org.id, 8), [db, org.id]);
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const active = opps.filter((o) => o.status === "published").length;
  const interested = stats.byStage.new + stats.byStage.under_review;
  const upcoming = apps
    .filter((a): a is Application & { interview: NonNullable<Application["interview"]> } => !!a.interview && a.interview.at >= nowIso && !["hired", "closed"].includes(a.stage))
    .sort((a, b) => a.interview.at.localeCompare(b.interview.at));
  const attention = opps.filter((o) => ["draft", "pending_review", "changes_requested", "rejected"].includes(o.status));
  const firstName = user.name.split(" ")[0];
  const canEditProfile = can(user, "org:edit_profile");

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <OrgLogo brand={org.brand} name={org.name} size={56} className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <div className="eyebrow mb-1.5 flex flex-wrap items-center gap-2">
              <span className="truncate">{org.name}</span>
              <span aria-hidden className="text-ink-4">·</span>
              <span>{ORG_CATEGORY_LABEL[org.category]}</span>
            </div>
            <h1 className="font-display text-[32px] leading-[1.1] text-ink sm:text-[38px]">
              {greeting()}, {firstName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
              <ListingStatusBadge status={org.listingStatus} />
              <span>{ROLE_LABEL(user)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/organizations/${org.slug}`} variant="secondary" size="sm"><Eye className="h-4 w-4" /> Public profile</ButtonLink>
          <ButtonLink href="/org/opportunities/new" variant="accent" size="sm"><Plus className="h-4 w-4" /> New opportunity</ButtonLink>
        </div>
      </div>

      <OrgStatusNotice org={org} className="mb-6" />

      <section aria-labelledby="kpi-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="kpi-heading" className="text-[15px] font-semibold tracking-[-0.01em]">At a glance</h2>
          <DemoTag>Demonstration data</DemoTag>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Active opportunities" value={active} sub={`${opps.length} total listings`} />
          <Stat label="Listing views" value={compactNumber(stats.listingViews)} sub="Lifetime, all listings" />
          <Stat label="Profile views" value={compactNumber(stats.profileViews)} sub="Public org profile" />
          <Stat label="Applications" value={stats.applications} sub="Excludes withdrawn" />
          <Stat label="Interested candidates" value={interested} sub="New + under review" />
          <Stat label="Upcoming interviews" value={upcoming.length} sub="Scheduled ahead" />
        </div>
      </section>

      <Card className="mb-8">
        <CardHeader
          title="Recruiting pipeline"
          description="Candidates at each stage. Select a stage to open it in the pipeline."
          action={<ButtonLink href="/org/pipeline" variant="ghost" size="sm">Open pipeline <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>}
        />
        <div className="px-5 pb-5 pt-4 sm:px-6">
          <ol className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {STAGE_ORDER.map((s, i) => {
              const n = stats.byStage[s];
              return (
                <li key={s} className="min-w-[132px] flex-1">
                  <Link
                    href={`/org/pipeline?stage=${s}`}
                    className={cn(
                      "group flex h-full flex-col justify-between rounded-xl border px-3.5 py-3 transition hover:border-navy-200 hover:bg-navy-50/50",
                      n > 0 && (s === "new" || s === "under_review") ? "border-navy-100 bg-navy-50/40" : "border-line bg-subtle/40",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-[12px] text-ink-3">
                      <span className="truncate">{STAGE_LABEL[s]}</span>
                      {i < STAGE_ORDER.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-4 transition group-hover:translate-x-0.5" />}
                    </span>
                    <span className={cn("mt-2 text-[24px] font-semibold tabular-nums tracking-[-0.03em]", n ? "text-ink" : "text-ink-4")}>{n}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Upcoming interviews" description="Times shown in UTC. No calendar invites are sent in the prototype." />
            <div className="px-5 pb-5 pt-4 sm:px-6">
              {upcoming.length === 0 ? (
                <EmptyState compact icon={<CalendarClock className="h-5 w-5" strokeWidth={1.75} />} title="No interviews scheduled" description="Schedule interviews from a candidate's application page." />
              ) : (
                <ul className="divide-y divide-line">
                  {upcoming.slice(0, 5).map((a) => {
                    const profile = db.profiles.find((p) => p.userId === a.applicantId);
                    const opp = db.opportunities.find((o) => o.id === a.opportunityId);
                    const Icon = FORMAT_ICON[a.interview.format];
                    return (
                      <li key={a.id}>
                        <Link href={`/org/applications/${a.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-subtle">
                          <Avatar name={personName(db, a.applicantId)} tone={profile?.avatarTone ?? 0} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-ink">{personName(db, a.applicantId)}</div>
                            <div className="truncate text-xs text-ink-3">{opp?.title}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[13px] font-medium text-ink">{relativeDay(a.interview.at)}</div>
                            <div className="flex items-center justify-end gap-1 text-xs text-ink-3"><Icon className="h-3 w-3" />{formatDateTime(a.interview.at)}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent activity" description="Application updates and changes made by your team." />
            <div className="px-5 pb-5 pt-4 sm:px-6">
              {feed.length === 0 ? (
                <EmptyState compact icon={<Activity className="h-5 w-5" strokeWidth={1.75} />} title="No activity yet" description="Applications, listing changes and team actions will appear here." />
              ) : (
                <ol className="relative space-y-0.5">
                  {feed.map((f) => (
                    <li key={f.id}>
                      <Link href={f.href ?? "/org"} className="-mx-2 flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-subtle">
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", f.kind === "application" ? "bg-navy" : f.kind === "listing" ? "bg-gold" : "bg-ink-4")} aria-hidden />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] text-ink">{f.title}</div>
                          <div className="mt-0.5 truncate text-xs text-ink-3">
                            {f.detail ? `${f.detail} · ` : ""}
                            {personName(db, f.actorId)}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-ink-4">{relativeDay(f.at)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick actions" />
            <div className="space-y-1 px-3 pb-3 pt-3">
              <QuickAction href="/org/opportunities/new" icon={<Briefcase className="h-4 w-4" />} title="Create opportunity" body="Draft a listing with a live compliance pre-check." />
              <QuickAction href="/org/pipeline?stage=new" icon={<Inbox className="h-4 w-4" />} title="Review new applications" body={stats.byStage.new ? `${stats.byStage.new} waiting in New Application` : "You're caught up"} />
              <QuickAction href="/org/profile" icon={canEditProfile ? <Pencil className="h-4 w-4" /> : <Building2 className="h-4 w-4" />} title={canEditProfile ? "Edit public profile" : "View public profile settings"} body={canEditProfile ? "Training, culture, leadership and more." : "Admins can edit the profile."} />
              <QuickAction href="/org/talent" icon={<Sparkles className="h-4 w-4" />} title="Discover talent" body="Members who opted into recruiter contact." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Listing status" description="Drafts and listings waiting on review or changes." action={<Link href="/org/opportunities" className="text-xs font-medium text-navy-600 hover:text-navy">All listings</Link>} />
            <div className="px-5 pb-5 pt-4 sm:px-6">
              {attention.length === 0 ? (
                <EmptyState compact icon={<UserCheck className="h-5 w-5" strokeWidth={1.75} />} title="Nothing pending" description="Every listing is live or archived." />
              ) : (
                <ul className="space-y-3">
                  {attention.slice(0, 5).map((o) => (
                    <li key={o.id}>
                      <Link href={`/org/opportunities/${o.id}`} className="block rounded-xl border border-line px-3.5 py-3 transition hover:border-line-strong hover:bg-subtle/50">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 text-[13.5px] font-medium leading-snug text-ink">{o.title}</span>
                          <OppStatusBadge status={o.status} />
                        </div>
                        {o.moderation?.reviewerNote ? (
                          <p className="mt-2 border-l-2 border-warning/40 pl-2.5 text-xs leading-relaxed text-ink-2">{o.moderation.reviewerNote}</p>
                        ) : (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-3"><FileText className="h-3 w-3" />Updated {formatDate(o.updatedAt)}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-subtle">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy ring-1 ring-inset ring-navy-100">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-3">{body}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
