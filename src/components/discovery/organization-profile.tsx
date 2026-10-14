"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, GraduationCap, MapPin, MessageSquareText, Users } from "lucide-react";
import type { Article, InsiderSection, Opportunity, Organization, User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { followerCount, getOrganizationBySlug, orgOpenOpportunities, recordOrgView } from "@/lib/services/organizations";
import { ARRANGEMENT_LABEL, ENGAGEMENT_LABEL, KIND_LABEL, LINE_BY_SLUG, ORG_CATEGORY_DESCRIPTION, ORG_CATEGORY_LABEL, RECRUITING_LABEL, stateName } from "@/lib/data/taxonomy";
import { HydrationGate } from "@/components/layout/guards";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Kicker, PullQuote } from "@/components/editorial";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DemoTag, EmptyState, Notice } from "@/components/ui/feedback";
import { Breadcrumbs, Container } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { KindBadge, ListingStatusBadge } from "@/components/domain/badges";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { RecruitingDot } from "@/components/domain/org-card";
import { SaveButton } from "@/components/domain/save-button";
import { DiscoverOrgCard } from "@/components/discover/discover-org-card";
import { FollowButton } from "@/components/discover/follow-button";
import { CompareTray, useCompareSelection } from "@/components/discover/compare-tray";
import {
  FOOTPRINT_LABEL,
  FORMAT_LABEL,
  LEAD_PLAIN,
  LEAD_SHORT,
  employmentLong,
  employmentShort,
  footprintDetail,
  isNationwide,
  similarOrganizations,
  trainingShort,
} from "@/components/discover/org-facts";
import { pluralize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Unavailable, useActiveSection } from "./detail-ui";
import { ReportLink } from "./report-dialog";
import { ProfileSkeleton } from "./skeletons";

const SECTION_LABEL: Record<InsiderSection, string> = {
  insights: "Insights",
  career_guides: "Career guides",
  leadership: "Leadership",
  interviews: "Interviews",
  education: "Education",
  emerging: "Emerging talent",
  events: "Events",
  spotlight: "Spotlight",
};

export function OrganizationProfilePage() {
  return (
    <HydrationGate fallback={<ProfileSkeleton />}>
      <OrganizationProfile />
    </HydrationGate>
  );
}

function OrganizationProfile() {
  const { slug } = useParams<{ slug: string }>();
  const db = useDb();
  const user = useCurrentUser();
  const org = useMemo(() => getOrganizationBySlug(db, decodeURIComponent(slug ?? "")), [db, slug]);
  const approved = org?.listingStatus === "approved";
  const canPreview = !!org && !!user && (user.kind === "admin" || (user.kind === "organization" && user.orgId === org.id));

  const orgId = org && approved ? org.id : undefined;
  useEffect(() => {
    if (orgId) recordOrgView(orgId);
  }, [orgId]);

  if (!org || (!approved && !canPreview)) {
    return (
      <Unavailable
        title="This organization isn't available"
        body="The profile may still be under review, or it's no longer listed in the directory. Explore approved organizations instead."
        backHref="/organizations"
        backLabel="Browse organizations"
        secondary={{ href: "/discover", label: "Discover companies" }}
      />
    );
  }
  return <ProfileView org={org} preview={!approved} />;
}

function ProfileView({ org, preview }: { org: Organization; preview: boolean }) {
  const db = useDb();
  const user = useCurrentUser();
  const compare = useCompareSelection();
  const [introOpen, setIntroOpen] = useState(false);
  const roles = useMemo(() => orgOpenOpportunities(db, org.id), [db, org.id]);
  const followers = useMemo(() => followerCount(db, org.id), [db, org.id]);
  const articles = useMemo(
    () => db.articles.filter((a) => a.relatedOrgIds.includes(org.id)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3),
    [db, org.id],
  );
  const similar = useMemo(() => similarOrganizations(db, org, 3), [db, org]);
  const openCounts = useMemo(() => new Map(similar.map((o) => [o.id, orgOpenOpportunities(db, o.id).length])), [db, similar]);
  const portal = org.portal?.participating ? org.portal : undefined;

  const sections = useMemo(
    () =>
      [
        { id: "about", label: "About" },
        { id: "open-roles", label: "Open roles" },
        portal ? { id: "portal", label: "New Producer Portal" } : null,
        { id: "training", label: "Training & mentorship" },
        { id: "lead-program", label: "Lead program" },
        { id: "how-you-work", label: "How you'd work" },
        { id: "compensation", label: "Compensation" },
        { id: "culture", label: "Culture" },
        org.leadership.length ? { id: "leadership", label: "Leadership" } : null,
        { id: "states", label: "States served" },
        articles.length ? { id: "insider", label: "In The Insider" } : null,
      ].filter((s): s is { id: string; label: string } => !!s),
    [portal, org.leadership.length, articles.length],
  );
  const active = useActiveSection(sections.map((s) => s.id));
  const ground = `color-mix(in oklab, ${org.brand.tint} 62%, var(--color-canvas))`;
  const [lead, ...rest] = org.about.split(/\n{2,}/);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative border-b border-line" style={{ background: ground }}>
        <div className="relative h-[200px] overflow-hidden sm:h-[300px]">
          <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} label={`${org.name} cover art (generated)`} className="animate-fade-in" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24" style={{ background: `linear-gradient(to bottom, transparent, ${ground})` }} aria-hidden />
          <Container className="absolute inset-x-0 top-5">
            <div className="inline-flex rounded-full bg-surface/85 px-3 py-1.5 backdrop-blur">
              <Breadcrumbs items={[{ href: "/discover", label: "Discover" }, { href: "/organizations", label: "Directory" }, { label: org.name }]} className="text-[12.5px]" />
            </div>
          </Container>
        </div>

        <Container className="relative pb-10">
          {preview && (
            <Notice tone="warning" title="Pending approval — not visible publicly" className="relative z-[1] -mt-4 mb-6 bg-surface">
              <span className="flex flex-wrap items-center gap-2">
                Listing status: <ListingStatusBadge status={org.listingStatus} />
                <span>You&apos;re seeing a preview because you&apos;re on this organization&apos;s team or a platform admin.</span>
              </span>
            </Notice>
          )}
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="min-w-0 lg:col-span-8">
              <OrgLogo brand={org.brand} name={org.name} size={104} className={cn("relative shadow-lift", preview ? "" : "-mt-14")} />
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: org.brand.color }}>
                  {ORG_CATEGORY_LABEL[org.category]}
                </span>
                <DemoTag>Fictional</DemoTag>
              </div>
              <h1 className="mt-3 font-display text-[40px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[60px]">{org.name}</h1>
              <p className="mt-4 max-w-[56ch] font-display text-[20px] italic leading-snug text-ink-2 sm:text-[22px]">{org.tagline}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                  {org.hqCity}, {stateName(org.hqState)}
                </span>
                {followers > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                    {pluralize(followers, "member")} following
                  </span>
                )}
                <RecruitingDot status={org.recruitingStatus} />
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <FollowButton org={org} variant="button" />
                <SaveButton targetId={org.id} type="organization" variant="button" />
                <ButtonLink href="#open-roles" variant="secondary">
                  <BriefcaseBusiness className="h-4 w-4" strokeWidth={1.75} />
                  View open roles{roles.length ? ` (${roles.length})` : ""}
                </ButtonLink>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4 lg:flex-nowrap lg:justify-end">
                <Avatar name={org.recruitingContact.name} tone={org.name.length} size={36} />
                <div className="min-w-0 lg:text-right">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{org.recruitingContact.name}</div>
                  <div className="truncate text-[12px] text-ink-3">{org.recruitingContact.title}</div>
                </div>
                <Button variant="accent" size="sm" className="w-full sm:ml-auto sm:w-auto lg:ml-2" onClick={() => setIntroOpen(true)}>
                  <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Contact recruiting
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- At a glance ---------- */}
      <section aria-labelledby="glance" className="border-b border-line bg-surface">
        <Container>
          <h2 id="glance" className="sr-only">
            At a glance
          </h2>
          <dl className="-mx-4 grid grid-cols-2 sm:mx-0 sm:grid-cols-4 lg:grid-cols-8">
            <Glance i={0} label="Founded" value={org.founded} />
            <Glance i={1} label="Team" value={org.teamSize} />
            <Glance i={2} label="Footprint" value={FOOTPRINT_LABEL[org.footprint]} hint={footprintDetail(org)} />
            <Glance i={3} label="Model" value={employmentShort(org)} hint={employmentLong(org)} />
            <Glance i={4} label="Training" value={trainingShort(org)} muted={!org.trainingPrograms.length} />
            <Glance i={5} label="Mentorship" value={org.mentorship.available ? "Available" : "Not listed"} muted={!org.mentorship.available} />
            <Glance i={6} label="Lead approach" value={LEAD_SHORT[org.leadProgram.policy]} />
            <Glance i={7} label="Recruiting" value={RECRUITING_LABEL[org.recruitingStatus]} muted={org.recruitingStatus === "not_recruiting"} />
          </dl>
        </Container>
      </section>

      {/* ---------- Mobile section nav ---------- */}
      <nav aria-label="Profile sections" className="sticky top-16 z-30 border-b border-line bg-canvas/90 backdrop-blur lg:hidden">
        <div className="scrollbar-none flex gap-1 overflow-x-auto px-4 py-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-[12.5px] transition", active === s.id ? "bg-ink text-white" : "text-ink-3 hover:bg-sunken hover:text-ink")}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <Container className="pb-20 pt-14">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="min-w-0 space-y-16 lg:col-span-8">
            {/* About */}
            <Section id="about" kicker="About">
              {lead && <p className="max-w-[60ch] font-display text-[22px] leading-[1.45] text-ink sm:text-[25px]">{lead}</p>}
              {rest.length > 0 && (
                <div className="prose-pn mt-5 max-w-[68ch] text-[15.5px] leading-[1.75] text-ink-2">
                  {rest.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
              <p className="mt-5 max-w-[68ch] text-[13px] leading-relaxed text-ink-3">
                <span className="font-medium text-ink-2">{ORG_CATEGORY_LABEL[org.category]}</span> — {ORG_CATEGORY_DESCRIPTION[org.category]}
              </p>
              {org.culture.summary && (
                <PullQuote className="mt-10" cite={`On culture, as described by ${org.name}`}>
                  {org.culture.summary}
                </PullQuote>
              )}
              <div className="mt-10">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Specialties</h3>
                <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
                  {org.lines.map((l) => {
                    const line = LINE_BY_SLUG[l];
                    return (
                      <li key={l} className="border-b border-line">
                        <Link href={`/explore/${l}`} className="group flex items-start gap-3 py-3.5">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: org.brand.tint, color: org.brand.color }}>
                            <LineIcon line={l} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2 text-[14px] font-semibold text-ink">
                              {line?.name ?? l}
                              <ArrowUpRight className="h-3.5 w-3.5 text-ink-4 transition group-hover:text-ink" />
                            </span>
                            {line && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{line.summary}</span>}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Section>

            {/* Open roles */}
            <Section
              id="open-roles"
              kicker="Open roles"
              title={roles.length ? `${pluralize(roles.length, "open role")} at ${org.name}` : "No open roles right now"}
              action={
                roles.length > 2 ? (
                  <Link href={`/opportunities?q=${encodeURIComponent(org.name)}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-600 hover:text-navy">
                    Search in marketplace <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : undefined
              }
            >
              {roles.length ? <RolesByKind roles={roles} /> : (
                <EmptyState
                  compact
                  icon={<BriefcaseBusiness className="h-5 w-5" strokeWidth={1.75} />}
                  title="Nothing listed at the moment"
                  description={`Follow ${org.name} to hear when new roles open, or explore similar opportunities in the marketplace.`}
                  action={
                    <ButtonLink href={`/opportunities?lines=${org.lines[0]}`} variant="secondary" size="sm">
                      Explore similar roles
                    </ButtonLink>
                  }
                />
              )}
            </Section>

            {/* New Producer Portal */}
            {portal && (
              <section id="portal" aria-labelledby="portal-title" className="scroll-mt-32 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                <div className="h-1" style={{ background: org.brand.color }} aria-hidden />
                <div className="p-6 sm:p-9">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Kicker rule={false} className="text-navy-600">
                      <GraduationCap className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" strokeWidth={2} />
                      New Producer Portal
                    </Kicker>
                    <span className="text-[12px] text-ink-4">Participating company</span>
                  </div>
                  <h2 id="portal-title" className="mt-4 max-w-xl font-display text-[30px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[34px]">
                    {portal.headline}
                  </h2>
                  <div className="mt-7 grid gap-8 md:grid-cols-2">
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Why new producers join</h3>
                      <ol className="mt-3 space-y-2.5">
                        {portal.whyJoin.map((w, i) => (
                          <li key={i} className="flex gap-3 text-[14px] leading-snug text-ink-2">
                            <span className="w-5 shrink-0 font-display text-[15px] tabular-nums text-ink-4">{i + 1}</span>
                            {w}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">The first year</h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{portal.firstYear}</p>
                    </div>
                  </div>
                  <dl className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">Ideal for</dt>
                      <dd className="mt-1.5 text-[13.5px] text-ink-2">{portal.idealFor.join(" · ")}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">Hiring in</dt>
                      <dd className="mt-1.5 text-[13.5px] text-ink-2">{portal.statesHiring.includes("ALL") ? "Nationwide" : portal.statesHiring.map((s) => stateName(s)).join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">Licensing support</dt>
                      <dd className="mt-1.5 text-[13.5px] text-ink-2">{portal.licensingSupport}</dd>
                    </div>
                  </dl>
                  <ButtonLink href="/launch" variant="accent" className="mt-8">
                    Raise your hand in the portal <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </div>
              </section>
            )}

            {/* Training & mentorship */}
            <Section id="training" kicker="Training & development" title={org.trainingPrograms.length ? "How they develop people" : "Training"}>
              {org.trainingAvailable && org.trainingPrograms.length ? (
                <ol className="relative">
                  {org.trainingPrograms.map((t, i) => (
                    <li key={t.id} className="relative grid grid-cols-[40px_1fr] gap-4 pb-8 last:pb-0">
                      {i < org.trainingPrograms.length - 1 && <span className="absolute bottom-0 left-[19px] top-10 w-px bg-line-strong" aria-hidden />}
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-surface font-display text-[16px] tabular-nums text-ink" style={{ color: org.brand.color }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="pt-1.5">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{t.name}</h3>
                          <span className="text-[12.5px] text-ink-3">
                            {FORMAT_LABEL[t.format]} · {t.duration}
                          </span>
                        </div>
                        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-2">{t.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[14.5px] text-ink-3">{org.name} hasn&apos;t listed formal training programs. Ask about onboarding during conversations.</p>
              )}
              <div className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-[160px_1fr]">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Mentorship</h3>
                <div>
                  <div className={cn("text-[15px] font-semibold", org.mentorship.available ? "text-ink" : "text-ink-3")}>
                    {org.mentorship.available ? "Mentorship available" : "No formal mentorship listed"}
                  </div>
                  {org.mentorship.description && <p className="mt-1 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-2">{org.mentorship.description}</p>}
                </div>
              </div>
            </Section>

            {/* Lead program */}
            <Section id="lead-program" kicker="Lead program" title={LEAD_SHORT[org.leadProgram.policy]}>
              <div className="grid gap-6 sm:grid-cols-[1fr_minmax(0,260px)]">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">In their words</div>
                  <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink">{org.leadProgram.description}</p>
                </div>
                <div className="border-l border-line pl-5">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">What this means</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{LEAD_PLAIN[org.leadProgram.policy]}</p>
                </div>
              </div>
              {org.leadProgram.policy === "available_at_cost" && (
                <Notice tone="warning" className="mt-6">
                  Leads are available at the producer&apos;s own cost. Ask for pricing, minimums and refund terms in writing before you commit.
                </Notice>
              )}
            </Section>

            {/* How you'd work */}
            <Section id="how-you-work" kicker="How you'd work" title="Engagement model & arrangements">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Engagement</h3>
                  <ul className="mt-3 space-y-3">
                    {org.engagementTypes.map((e) => (
                      <li key={e}>
                        <Badge tone={e === "w2" ? "navy" : "gold"}>{e === "w2" ? KIND_LABEL.employment : KIND_LABEL.contracting}</Badge>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
                          {e === "w2"
                            ? `${ENGAGEMENT_LABEL.w2}: you'd be an employee of ${org.name}.`
                            : `${ENGAGEMENT_LABEL.independent_contractor} (1099): you'd run your own practice, affiliated with ${org.name}.`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Work arrangements</h3>
                  <ul className="mt-3 divide-y divide-line border-y border-line">
                    {(["remote", "hybrid", "in_person"] as const).map((a) => {
                      const on = org.arrangements.includes(a);
                      return (
                        <li key={a} className="flex items-center justify-between py-2.5 text-[14px]">
                          <span className={on ? "text-ink" : "text-ink-4"}>{ARRANGEMENT_LABEL[a]}</span>
                          <span className={cn("text-[12px]", on ? "font-medium text-success" : "text-ink-4")}>{on ? "Offered" : "Not listed"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </Section>

            {/* Compensation */}
            <Section id="compensation" kicker="Compensation approach">
              <figure className="border-l-2 pl-6" style={{ borderColor: org.brand.color }}>
                <figcaption className="text-[11px] uppercase tracking-[0.1em] text-ink-4">As described by the organization</figcaption>
                <blockquote className="mt-2 max-w-[62ch] font-display text-[20px] leading-[1.5] text-ink">{org.compensationApproach}</blockquote>
              </figure>
              <CompensationDisclaimer className="mt-6 max-w-[68ch]" />
            </Section>

            {/* Culture */}
            <Section id="culture" kicker="Culture" title="What they value">
              {org.culture.values.length > 0 ? (
                <ol className="grid gap-x-10 sm:grid-cols-2">
                  {org.culture.values.map((v, i) => (
                    <li key={v.title} className="border-t border-line py-5">
                      <div className="font-display text-[15px] tabular-nums" style={{ color: org.brand.color }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-1.5 font-display text-[21px] leading-snug text-ink">{v.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{v.description}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[14.5px] text-ink-3">{org.culture.summary || "No culture values listed yet."}</p>
              )}
            </Section>

            {/* Leadership */}
            {org.leadership.length > 0 && (
              <Section id="leadership" kicker="Leadership">
                <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  {org.leadership.map((l, i) => (
                    <li key={l.id} className="flex gap-4">
                      <Avatar name={l.name} tone={i + org.name.length} size={48} />
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-ink">{l.name}</div>
                        <div className="text-[12.5px] text-ink-3">{l.title}</div>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{l.bio}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* States */}
            <Section id="states" kicker="States served" title={isNationwide(org) ? "Nationwide" : `${pluralize(org.statesServed.length, "state")}`}>
              {isNationwide(org) ? (
                <p className="text-[14.5px] leading-relaxed text-ink-2">
                  Headquartered in {org.hqCity}, {stateName(org.hqState)}. Licensing requirements still apply state by state.
                </p>
              ) : (
                <>
                  <ul className="flex flex-wrap gap-1.5">
                    {org.statesServed.map((s) => (
                      <li key={s} className={cn("rounded-full border px-3 py-1 text-[13px]", s === org.hqState ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-2")}>
                        {stateName(s)}
                        {s === org.hqState && <span className="ml-1.5 text-[11px] opacity-75">HQ</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[12.5px] text-ink-3">Licensing requirements vary by state — confirm with the applicable state department of insurance.</p>
                </>
              )}
            </Section>

            {/* Insider */}
            {articles.length > 0 && (
              <Section id="insider" kicker="In The Insider" title={`Coverage mentioning ${org.name}`}>
                <ul className="grid gap-6 sm:grid-cols-2">
                  {articles.map((a) => (
                    <ArticleTeaser key={a.id} a={a} />
                  ))}
                </ul>
              </Section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-4">
              <span>Profile details are provided by the organization and reviewed for policy compliance, not independently verified.</span>
              <ReportLink targetType="organization" targetId={org.id} label="Report this organization" />
            </div>
          </div>

          {/* ---------- Rail ---------- */}
          <aside aria-label="Page navigation and recruiting" className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 space-y-8 pl-6">
              <nav aria-label="On this page">
                <Kicker>On this page</Kicker>
                <ul className="mt-4 space-y-0.5 border-l border-line">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={active === s.id ? "location" : undefined}
                        className={cn("-ml-px block border-l-2 py-1.5 pl-4 text-[13.5px] transition", active === s.id ? "font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink")}
                        style={active === s.id ? { borderColor: org.brand.color } : undefined}
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Recruitment contact</div>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar name={org.recruitingContact.name} tone={org.name.length} size={44} />
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-semibold text-ink">{org.recruitingContact.name}</div>
                    <div className="text-[12.5px] leading-snug text-ink-3">{org.recruitingContact.title}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <RecruitingDot status={org.recruitingStatus} />
                </div>
                <Button variant="secondary" className="mt-4 w-full" onClick={() => setIntroOpen(true)}>
                  Request an introduction
                </Button>
                <button
                  type="button"
                  onClick={() => compare.toggle(org.id)}
                  aria-pressed={compare.has(org.id)}
                  className="mt-2 w-full rounded-lg py-2 text-[13px] font-medium text-ink-3 transition hover:bg-sunken/70 hover:text-ink"
                >
                  {compare.has(org.id) ? "✓ Added to compare" : "+ Add to compare"}
                </button>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-4">Fictional contact. No messages leave this prototype.</p>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* ---------- Similar companies ---------- */}
      {similar.length > 0 && (
        <section aria-labelledby="similar" className="border-t border-line bg-surface/60">
          <Container className="pb-24 pt-14">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Kicker rule={false}>Similar companies</Kicker>
                <h2 id="similar" className="mt-3 font-display text-[30px] leading-tight text-ink">If {org.name} interests you</h2>
                <p className="mt-2 text-[14px] text-ink-3">Chosen by shared specialties, type and engagement model.</p>
              </div>
              <Link href="/discover" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                Back to Discover <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((o) => (
                <DiscoverOrgCard key={o.id} org={o} openCount={openCounts.get(o.id) ?? 0} compare={{ selected: compare.has(o.id), onToggle: () => compare.toggle(o.id) }} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <CompareTray />
      {introOpen && <IntroDialog org={org} user={user} hasRoles={roles.length > 0} onClose={() => setIntroOpen(false)} />}
    </>
  );
}

function Section({ id, kicker, title, action, children }: { id: string; kicker: string; title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32">
      <Kicker>{kicker}</Kicker>
      {title ? (
        <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id={`${id}-title`} className="font-display text-[28px] leading-[1.12] tracking-[-0.015em] text-ink sm:text-[32px]">
            {title}
          </h2>
          {action}
        </div>
      ) : (
        <h2 id={`${id}-title`} className="sr-only">
          {kicker}
        </h2>
      )}
      <div className={title ? "" : "mt-6"}>{children}</div>
    </section>
  );
}

function Glance({ i, label, value, hint, muted }: { i: number; label: string; value: ReactNode; hint?: string; muted?: boolean }) {
  return (
    <div
      className={cn(
        "border-b border-line px-4 py-5 lg:border-b-0",
        i % 2 === 0 ? "border-r" : "border-r-0",
        i % 4 !== 3 ? "sm:border-r" : "sm:border-r-0",
        i !== 7 ? "lg:border-r" : "lg:border-r-0",
        i === 0 && "lg:pl-0",
      )}
    >
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">{label}</dt>
      <dd className={cn("mt-1.5 text-[14px] font-medium leading-snug", muted ? "text-ink-4" : "text-ink")}>{value}</dd>
      {hint && (
        <dd className="mt-0.5 truncate text-[11.5px] text-ink-3" title={hint}>
          {hint}
        </dd>
      )}
    </div>
  );
}

function RolesByKind({ roles }: { roles: Opportunity[] }) {
  const groups = (["employment", "contracting"] as const).map((k) => ({ kind: k, items: roles.filter((r) => r.kind === k) })).filter((g) => g.items.length);
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <div key={g.kind}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <KindBadge kind={g.kind} />
            <span className="text-[13px] text-ink-3">
              {g.kind === "employment" ? "You'd be an employee (W-2)." : "You'd be an independent contractor (1099) running your own practice."}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {g.items.map((r) => (
              <OpportunityCard key={r.id} o={r} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticleTeaser({ a }: { a: Article }) {
  return (
    <li className="group relative">
      <div className="aspect-[16/9] overflow-hidden rounded-xl border border-line">
        <CoverArt seed={a.id} variant={a.art.variant} hue={a.art.hue} ground={a.art.ground} className="transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">
        {SECTION_LABEL[a.section]} · {a.readMinutes} min read
      </div>
      <h3 className="mt-1.5 font-display text-[20px] leading-snug text-ink">
        <Link href={`/insider/${a.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
          {a.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-3">{a.dek}</p>
      <p className="mt-2 text-[11.5px] text-ink-4">Fictional editorial · demo</p>
    </li>
  );
}

function IntroDialog({ org, user, hasRoles, onClose }: { org: Organization; user: User | null; hasRoles: boolean; onClose: () => void }) {
  const ownOrg = user?.kind === "organization" && user.orgId === org.id;
  const member = can(user, "member:apply");
  const goToRoles = () => {
    onClose();
    setTimeout(() => document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  let body: ReactNode;
  let footer: ReactNode;
  if (!user) {
    body = (
      <p>
        Introductions are available to member accounts. This prototype uses fictional personas instead of real sign-in — choose a producer persona to
        explore the member experience.
      </p>
    );
    footer = (
      <>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <ButtonLink href="/join?step=persona">
          Choose a demo role <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </>
    );
  } else if (ownOrg) {
    body = (
      <>
        <p>
          This is how members see your recruiting contact, <span className="font-medium text-ink">{org.recruitingContact.name}</span>. In production,
          introduction requests would arrive in your recruiting workspace.
        </p>
        <p className="mt-3 text-ink-3">You can update the contact shown here from your organization&apos;s public profile settings.</p>
      </>
    );
    footer = (
      <>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <ButtonLink href="/org/profile">
          Edit public profile <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </>
    );
  } else if (!member) {
    body = (
      <p>
        Introduction requests are a member feature for producers and aspiring producers. You&apos;re viewing as {user.name}; switch to a member persona to
        try it.
      </p>
    );
    footer = (
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    );
  } else {
    body = (
      <>
        <p>
          In this prototype, introduction requests aren&apos;t sent — nothing leaves your browser, and{" "}
          <span className="font-medium text-ink">{org.recruitingContact.name}</span> is a fictional contact.
        </p>
        <p className="mt-3">
          {hasRoles
            ? `The most direct way to start a conversation with ${org.name} is to apply to one of their open listings. You choose exactly what to share, and you can follow every step from your workspace.`
            : `${org.name} has no open listings right now. Follow or save the organization to keep it on your radar, and explore similar roles in the marketplace.`}
        </p>
      </>
    );
    footer = hasRoles ? (
      <>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="accent" onClick={goToRoles}>
          See open roles <ArrowRight className="h-4 w-4" />
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <ButtonLink href={`/opportunities?lines=${org.lines[0]}`} variant="accent">
          Explore similar roles <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </>
    );
  }

  return (
    <Dialog open onClose={onClose} title={`Contact ${org.name}`} description={`${org.recruitingContact.name} · ${org.recruitingContact.title}`} size="md" footer={footer}>
      <div className="flex gap-4">
        <OrgLogo brand={org.brand} name={org.name} size={40} />
        <div className="min-w-0 text-sm leading-relaxed text-ink-2">{body}</div>
      </div>
    </Dialog>
  );
}
