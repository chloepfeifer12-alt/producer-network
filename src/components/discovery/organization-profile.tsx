"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, Compass, GraduationCap, Laptop, MapPin, MessageSquareText, Quote, Users } from "lucide-react";
import type { Organization, OrgBrand, User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getOrganizationBySlug, orgOpenOpportunities, recordOrgView } from "@/lib/services/organizations";
import {
  ARRANGEMENT_LABEL,
  ENGAGEMENT_LABEL,
  LEADS_LABEL,
  LINE_BY_SLUG,
  ORG_CATEGORY_DESCRIPTION,
  ORG_CATEGORY_LABEL,
  stateName,
} from "@/lib/data/taxonomy";
import { HydrationGate } from "@/components/layout/guards";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DemoTag, EmptyState, Notice } from "@/components/ui/feedback";
import { Breadcrumbs, Container } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { ListingStatusBadge } from "@/components/domain/badges";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { RecruitingDot } from "@/components/domain/org-card";
import { SaveButton } from "@/components/domain/save-button";
import { pluralize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { DetailSection, FactTile, Unavailable, useActiveSection } from "./detail-ui";
import { ReportLink } from "./report-dialog";
import { ProfileSkeleton } from "./skeletons";

const FOOTPRINT_LABEL: Record<Organization["footprint"], string> = {
  local: "Local",
  regional: "Regional",
  multi_state: "Multi-state",
  national: "National",
};

const FORMAT_LABEL: Record<Organization["trainingPrograms"][number]["format"], string> = {
  virtual: "Virtual",
  in_person: "In person",
  blended: "Blended",
  self_paced: "Self-paced",
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
        secondary={{ href: "/opportunities", label: "Browse opportunities" }}
      />
    );
  }
  return <ProfileView org={org} preview={!approved} />;
}

function ProfileView({ org, preview }: { org: Organization; preview: boolean }) {
  const db = useDb();
  const user = useCurrentUser();
  const [introOpen, setIntroOpen] = useState(false);
  const roles = useMemo(() => orgOpenOpportunities(db, org.id), [db, org.id]);
  const nationwide = org.statesServed.includes("ALL");

  const sections = useMemo(
    () =>
      [
        { id: "about", label: "About" },
        org.leadership.length ? { id: "leadership", label: "Leadership" } : null,
        { id: "specialties", label: "Specialties" },
        { id: "open-roles", label: "Open roles" },
        { id: "training", label: "Training" },
        { id: "mentorship", label: "Mentorship" },
        { id: "lead-program", label: "Lead program" },
        { id: "arrangements", label: "How you'd work" },
        { id: "compensation", label: "Compensation" },
        { id: "states", label: "States served" },
        { id: "culture", label: "Culture" },
      ].filter((s): s is { id: string; label: string } => !!s),
    [org.leadership.length],
  );
  const active = useActiveSection(sections.map((s) => s.id));

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line" style={{ background: org.brand.tint }}>
        <BrandPattern brand={org.brand} id={org.id} />
        <Container className="relative pb-10 pt-8 sm:pb-14">
          <Breadcrumbs items={[{ href: "/organizations", label: "Organizations" }, { label: org.name }]} />
          {preview && (
            <Notice tone="warning" title="Pending approval — not visible publicly" className="mt-6 bg-surface/90">
              <span className="flex flex-wrap items-center gap-2">
                Listing status: <ListingStatusBadge status={org.listingStatus} />
                <span>You&apos;re seeing a preview because you&apos;re on this organization&apos;s team or a platform admin.</span>
              </span>
            </Notice>
          )}
          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
              <OrgLogo brand={org.brand} name={org.name} size={92} className="shadow-lift ring-4 ring-white/70" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: org.brand.color }}>
                    {ORG_CATEGORY_LABEL[org.category]}
                  </span>
                  <DemoTag>Fictional organization</DemoTag>
                </div>
                <h1 className="mt-2 font-display text-[36px] leading-[1.05] text-ink sm:text-[50px]">{org.name}</h1>
                <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-2">{org.tagline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                    {org.hqCity}, {org.hqState}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Compass className="h-4 w-4 opacity-60" strokeWidth={1.75} />
                    {FOOTPRINT_LABEL[org.footprint]} · {nationwide ? "Nationwide" : pluralize(org.statesServed.length, "state")}
                  </span>
                  <RecruitingDot status={org.recruitingStatus} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
              <SaveButton targetId={org.id} type="organization" variant="button" />
              <ButtonLink href="#open-roles" variant="secondary">
                <BriefcaseBusiness className="h-4 w-4" strokeWidth={1.75} />
                View open roles{roles.length ? ` (${roles.length})` : ""}
              </ButtonLink>
              <Button variant="primary" onClick={() => setIntroOpen(true)}>
                <MessageSquareText className="h-4 w-4" strokeWidth={1.75} />
                Contact recruiting
              </Button>
            </div>
          </div>
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

      <Container className="pb-24 pt-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-10">
            {/* About */}
            <DetailSection id="about" title={`About ${org.name}`} className="border-t-0 pt-0">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <FactTile icon={<CalendarDays className="h-3.5 w-3.5" />} label="Founded" value={org.founded} />
                <FactTile icon={<MapPin className="h-3.5 w-3.5" />} label="Headquarters" value={`${org.hqCity}, ${org.hqState}`} />
                <FactTile icon={<Users className="h-3.5 w-3.5" />} label="Team" value={org.teamSize} />
                <FactTile icon={<Compass className="h-3.5 w-3.5" />} label="Footprint" value={FOOTPRINT_LABEL[org.footprint]} />
              </div>
              <div className="prose-pn mt-6 text-[15px] leading-[1.75] text-ink-2">
                {org.about.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <p className="mt-4 text-[13px] text-ink-3">
                <span className="font-medium text-ink-2">{ORG_CATEGORY_LABEL[org.category]}</span> — {ORG_CATEGORY_DESCRIPTION[org.category]}
              </p>
            </DetailSection>

            {/* Leadership */}
            {org.leadership.length > 0 && (
              <DetailSection id="leadership" title="Leadership overview">
                <div className="grid gap-3 sm:grid-cols-2">
                  {org.leadership.map((l, i) => (
                    <div key={l.id} className="flex gap-3.5 rounded-xl border border-line bg-surface p-4">
                      <Avatar name={l.name} tone={i + org.name.length} size={44} />
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-semibold text-ink">{l.name}</div>
                        <div className="text-[12.5px] text-ink-3">{l.title}</div>
                        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{l.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Specialties */}
            <DetailSection id="specialties" title="Insurance & financial services specialties">
              <div className="grid gap-3 sm:grid-cols-2">
                {org.lines.map((l) => {
                  const line = LINE_BY_SLUG[l];
                  return (
                    <Link
                      key={l}
                      href={`/explore/${l}`}
                      className="group flex items-start gap-3.5 rounded-xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-line" style={{ background: org.brand.tint, color: org.brand.color }}>
                        <LineIcon line={l} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-[14px] font-semibold text-ink">
                          {line?.name ?? l}
                          <ArrowUpRight className="h-3.5 w-3.5 text-ink-4 transition group-hover:text-ink" />
                        </span>
                        {line && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{line.summary}</span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </DetailSection>

            {/* Open roles */}
            <DetailSection
              id="open-roles"
              title="Career & contracting opportunities"
              action={
                roles.length > 2 ? (
                  <Link href={`/opportunities?q=${encodeURIComponent(org.name)}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-600 hover:text-navy">
                    Search in marketplace <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : undefined
              }
            >
              {roles.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {roles.map((r) => (
                    <OpportunityCard key={r.id} o={r} compact />
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={<BriefcaseBusiness className="h-5 w-5" strokeWidth={1.75} />}
                  title="No open roles right now"
                  description={`Save ${org.name} to keep it on your radar, or explore similar opportunities in the marketplace.`}
                  action={
                    <ButtonLink href={`/opportunities?lines=${org.lines[0]}`} variant="secondary" size="sm">
                      Explore similar roles
                    </ButtonLink>
                  }
                />
              )}
            </DetailSection>

            {/* Training */}
            <DetailSection id="training" title="Training & development programs">
              {org.trainingAvailable && org.trainingPrograms.length ? (
                <div className="space-y-3">
                  {org.trainingPrograms.map((t) => (
                    <div key={t.id} className="rounded-xl border border-line bg-surface p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
                          <h3 className="text-[15px] font-semibold text-ink">{t.name}</h3>
                        </div>
                        <div className="flex gap-1.5">
                          <Badge tone="outline">{FORMAT_LABEL[t.format]}</Badge>
                          <Badge tone="neutral">{t.duration}</Badge>
                        </div>
                      </div>
                      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{t.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-ink-3">{org.name} hasn&apos;t listed formal training programs. Ask about onboarding during conversations.</p>
              )}
            </DetailSection>

            {/* Mentorship */}
            <DetailSection id="mentorship" title="Mentorship">
              <Badge tone={org.mentorship.available ? "success" : "neutral"}>{org.mentorship.available ? "Mentorship available" : "No formal mentorship listed"}</Badge>
              {org.mentorship.description && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{org.mentorship.description}</p>}
            </DetailSection>

            {/* Lead program */}
            <DetailSection id="lead-program" title="Lead program">
              <Badge tone={org.leadProgram.policy === "provided" ? "success" : org.leadProgram.policy === "available_at_cost" ? "warning" : "neutral"}>{LEADS_LABEL[org.leadProgram.policy]}</Badge>
              {org.leadProgram.description && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{org.leadProgram.description}</p>}
              {org.leadProgram.policy === "available_at_cost" && (
                <Notice tone="warning" className="mt-4">
                  Leads are available at the producer&apos;s own cost. Ask for pricing, minimums and refund terms in writing before you commit.
                </Notice>
              )}
            </DetailSection>

            {/* Arrangements */}
            <DetailSection id="arrangements" title="Work arrangements & engagement types">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface p-5">
                  <h3 className="eyebrow mb-3 flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5" /> Work arrangements
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {org.arrangements.map((a) => (
                      <Badge key={a} tone="neutral">
                        {ARRANGEMENT_LABEL[a]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-5">
                  <h3 className="eyebrow mb-3 flex items-center gap-1.5">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> Engagement types
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {org.engagementTypes.map((e) => (
                      <Badge key={e} tone={e === "w2" ? "navy" : "gold"}>
                        {ENGAGEMENT_LABEL[e]}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
                    W-2 roles are employment; independent contractor relationships are affiliations where you run your own practice.
                  </p>
                </div>
              </div>
            </DetailSection>

            {/* Compensation */}
            <DetailSection id="compensation" title="Compensation approach">
              <Card className="p-5 sm:p-6">
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">As described by the organization</div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">{org.compensationApproach}</p>
              </Card>
              <CompensationDisclaimer className="mt-4" />
            </DetailSection>

            {/* States */}
            <DetailSection id="states" title="States & regions served">
              {nationwide ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
                  <Compass className="h-5 w-5 text-ink-3" strokeWidth={1.75} />
                  <div>
                    <div className="text-[14.5px] font-medium text-ink">Nationwide</div>
                    <div className="text-[12.5px] text-ink-3">Headquartered in {org.hqCity}, {stateName(org.hqState)}. Licensing requirements still apply state by state.</div>
                  </div>
                </div>
              ) : (
                <>
                  <ul className="flex flex-wrap gap-1.5">
                    {org.statesServed.map((s) => (
                      <li key={s} className={cn("rounded-full border px-3 py-1 text-[13px]", s === org.hqState ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2")}>
                        {stateName(s)}
                        {s === org.hqState && <span className="ml-1.5 text-[11px] opacity-75">HQ</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[12.5px] text-ink-3">Licensing requirements vary by state — confirm with the applicable state department of insurance.</p>
                </>
              )}
            </DetailSection>

            {/* Culture */}
            <DetailSection id="culture" title="Culture">
              {org.culture.summary && (
                <figure className="relative rounded-2xl border border-line bg-surface px-6 py-6 sm:px-8">
                  <Quote className="absolute left-5 top-5 h-5 w-5 opacity-30" style={{ color: org.brand.color }} aria-hidden />
                  <blockquote className="pl-8 text-[19px] font-medium leading-snug tracking-[-0.01em] text-ink">{org.culture.summary}</blockquote>
                </figure>
              )}
              {org.culture.values.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {org.culture.values.map((v, i) => (
                    <div key={v.title} className="rounded-xl border border-line bg-surface p-5">
                      <div className="text-[11px] font-semibold tabular-nums tracking-[0.12em]" style={{ color: org.brand.color }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-2 text-[15px] font-semibold text-ink">{v.title}</h3>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-3">{v.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-4">
              <span>Profile details are provided by the organization and reviewed for policy compliance, not independently verified.</span>
              <ReportLink targetType="organization" targetId={org.id} label="Report this organization" />
            </div>
          </div>

          {/* ---------- Sidebar ---------- */}
          <aside aria-label="Recruiting and page navigation">
            <div className="space-y-4 lg:sticky lg:top-24">
              <RecruitmentContactCard org={org} onRequest={() => setIntroOpen(true)} />
              <nav aria-label="On this page" className="hidden rounded-2xl border border-line bg-surface p-4 shadow-card lg:block">
                <div className="eyebrow mb-2 px-2">On this page</div>
                <ul className="space-y-0.5">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={active === s.id ? "location" : undefined}
                        className={cn(
                          "relative flex items-center rounded-lg px-2 py-1.5 text-[13px] transition",
                          active === s.id ? "bg-subtle font-medium text-ink" : "text-ink-3 hover:bg-subtle/70 hover:text-ink",
                        )}
                      >
                        {active === s.id && <span className="absolute -left-[17px] h-4 w-[2px] rounded-full" style={{ background: org.brand.color }} aria-hidden />}
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      </Container>

      {introOpen && <IntroDialog org={org} user={user} hasRoles={roles.length > 0} onClose={() => setIntroOpen(false)} />}
    </>
  );
}

function RecruitmentContactCard({ org, onRequest }: { org: Organization; onRequest: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5" style={{ background: org.brand.color }} aria-hidden />
      <div className="p-5">
        <div className="eyebrow">Recruitment contact</div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={org.recruitingContact.name} tone={org.name.length} size={44} />
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-semibold text-ink">{org.recruitingContact.name}</div>
            <div className="text-[12.5px] leading-snug text-ink-3">{org.recruitingContact.title}</div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-subtle px-3 py-2">
          <RecruitingDot status={org.recruitingStatus} />
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={onRequest}>
          Request an introduction
        </Button>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-4">Fictional contact. No messages leave this prototype.</p>
      </div>
    </Card>
  );
}

function IntroDialog({ org, user, hasRoles, onClose }: { org: Organization; user: User | null; hasRoles: boolean; onClose: () => void }) {
  const ownOrg = user?.kind === "organization" && user.orgId === org.id;
  const member = can(user, "member:apply");
  const goToRoles = () => {
    onClose();
    setTimeout(() => document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  let body: React.ReactNode;
  let footer: React.ReactNode;
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
            : `${org.name} has no open listings right now. Save the organization to keep it on your radar, and explore similar roles in the marketplace.`}
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

/** Subtle geometric hero art derived from the organization's brand mark (no imagery). */
function BrandPattern({ brand, id }: { brand: OrgBrand; id: string }) {
  const pid = `org-hero-${id}`;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id={`${pid}-grid`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.1" fill={brand.color} fillOpacity="0.13" />
        </pattern>
        <linearGradient id={`${pid}-fade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.25" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={`${pid}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${pid}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${pid}-mask)`}>
        <rect width="100%" height="100%" fill={`url(#${pid}-grid)`} />
        <g fill="none" stroke={brand.color} strokeOpacity="0.14" strokeWidth="1.25">
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="92%" cy="115%" r={70 + i * 46} />
          ))}
        </g>
      </g>
      <rect x="0" y="0" width="100%" height="3" fill={brand.color} fillOpacity="0.85" />
    </svg>
  );
}
