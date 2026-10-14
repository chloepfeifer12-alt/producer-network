"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, GraduationCap, Compass, FileCheck2, Handshake, KanbanSquare, LineChart, MessageSquare, Scale, ShieldCheck, Sparkles, UserRoundPen, Users } from "lucide-react";
import type { OpportunityKind, Sector } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { publishedOpportunities } from "@/lib/services/opportunities";
import { activeSponsored, approvedOrganizations, orgOpenOpportunities } from "@/lib/services/organizations";
import { feedPosts } from "@/lib/services/network";
import { INSURANCE_LINES, LINES_BY_SECTOR, SECTOR_LABEL, STAGE_LABEL, STAGE_ORDER, TOPIC_LABEL } from "@/lib/data/taxonomy";
import { Container, SectionHeading } from "@/components/ui/page";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { LineIcon } from "@/components/ui/line-icon";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { OrgCard } from "@/components/domain/org-card";
import { OrgLogo } from "@/components/brand/org-logo";
import { relativeDay, formatEventDate } from "@/lib/utils/dates";

/* ---------------- Featured opportunities ---------------- */

export function FeaturedOpportunities() {
  const db = useDb();
  const [kind, setKind] = useState<"all" | OpportunityKind>("all");
  const list = useMemo(() => {
    const all = publishedOpportunities(db).sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
    return (kind === "all" ? all : all.filter((o) => o.kind === kind)).slice(0, 6);
  }, [db, kind]);
  const orgs = useMemo(() => new Map(db.organizations.map((o) => [o.id, o])), [db]);

  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          eyebrow="Latest jobs"
          title="New this week."
          description="Every listing says whether it's W-2 employment or independent contracting, shows pay only as the employer disclosed it, and states training, leads and licensing support up front."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                ariaLabel="Filter featured opportunities"
                value={kind}
                onChange={setKind}
                items={[
                  { value: "all", label: "All" },
                  { value: "employment", label: "Employment" },
                  { value: "contracting", label: "Contracting" },
                ]}
              />
              <ButtonLink href="/opportunities" variant="secondary" size="sm">See all jobs <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>
            </div>
          }
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => (
            <OpportunityCard key={o.id} o={o} org={orgs.get(o.orgId)} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Explore the industry ---------------- */

export function ExploreLines() {
  const db = useDb();
  const [sector, setSector] = useState<Sector>("insurance");
  const counts = useMemo(() => {
    const pub = publishedOpportunities(db);
    return Object.fromEntries(INSURANCE_LINES.map((l) => [l.slug, pub.filter((o) => o.lines.includes(l.slug)).length]));
  }, [db]);
  const lines = LINES_BY_SECTOR[sector];
  return (
    <section className="border-y border-line bg-surface py-20">
      <Container>
        <SectionHeading
          eyebrow="Browse by career path"
          title="Insurance and financial services, in one place."
          description="Explore each path — what the work looks like, the roles within it, licensing and registration basics, and who's hiring right now."
          action={
            <Segmented
              ariaLabel="Sector"
              value={sector}
              onChange={setSector}
              items={[
                { value: "insurance", label: SECTOR_LABEL.insurance },
                { value: "financial_services", label: SECTOR_LABEL.financial_services },
              ]}
            />
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {lines.map((l) => (
            <Link key={l.slug} href={`/opportunities?lines=${l.slug}`} className="group flex items-center gap-4 rounded-xl border border-line bg-canvas px-4 py-4 transition hover:border-line-strong hover:bg-surface hover:shadow-card">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-navy ring-1 ring-line">
                <LineIcon line={l.slug} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium">{l.name}</span>
                <span className="block text-xs text-ink-3" suppressHydrationWarning>{counts[l.slug]} open {counts[l.slug] === 1 ? "job" : "jobs"}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink-4 opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-4">Categories are a discovery aid, not a legal classification of licenses or registrations. No investment advice is offered on this platform.</p>
          <Link href="/explore" className="text-sm font-medium text-navy-600 hover:text-navy">Learn about each career path →</Link>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- New Producer Portal band ---------------- */

export function PortalBand() {
  const db = useDb();
  const companies = useMemo(() => db.organizations.filter((o) => o.listingStatus === "approved" && o.portal?.participating), [db]);
  return (
    <section className="py-6">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-gold-200 bg-[linear-gradient(120deg,var(--color-gold-50),var(--color-surface)_55%,var(--color-navy-50))] px-6 py-12 sm:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-surface px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-gold-ink">
                <GraduationCap className="h-4 w-4" /> New Producer Portal
              </div>
              <h2 className="font-display text-[32px] leading-[1.1] sm:text-[42px]">Just passed your exam? Meet the companies that train new producers.</h2>
              <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ink-3">A curated room of insurance and financial services companies with real programs for people starting out. Browse their showcases and introduce yourself to several at once — sharing only what you choose.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/launch" size="lg" variant="accent">Enter the portal <ArrowRight className="h-4 w-4" /></ButtonLink>
                <ButtonLink href="/opportunities?exp=newly_licensed" size="lg" variant="secondary">Jobs for newly licensed</ButtonLink>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {companies.slice(0, 6).map((o) => (
                <Link key={o.id} href="/launch" className="flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-surface/90 p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                  <OrgLogo brand={o.brand} name={o.name} size={40} />
                  <span className="line-clamp-2 text-[12px] font-medium leading-snug text-ink-2">{o.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Featured organizations ---------------- */

export function FeaturedOrganizations() {
  const db = useDb();
  const sponsored = useMemo(() => activeSponsored(db, "home_featured"), [db]);
  const organic = useMemo(() => {
    const sponsoredIds = new Set(sponsored.map((s) => s.org.id));
    return approvedOrganizations(db)
      .filter((o) => !sponsoredIds.has(o.id))
      .map((o) => ({ o, n: orgOpenOpportunities(db, o.id).length }))
      .sort((a, b) => b.n - a.n || a.o.name.localeCompare(b.o.name))
      .slice(0, 3);
  }, [db, sponsored]);

  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Companies hiring"
          title="Know the company before you apply."
          description="Agencies, IMOs, FMOs, carriers, advisory firms, broker-dealers and more — with training, mentorship, lead programs and pay approach laid out side by side."
          action={<ButtonLink href="/organizations" variant="secondary" size="sm">Browse companies <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>}
        />
        <div className="grid gap-5 lg:grid-cols-4">
          {sponsored.length > 0 && (
            <div className="rounded-2xl border border-gold-200 bg-gold-50/60 p-3 lg:col-span-1">
              <div className="mb-3 flex items-center justify-between px-2 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">Sponsored</span>
                <Link href="/for-organizations#sponsored" className="text-[11px] text-gold-ink underline-offset-2 hover:underline">What&apos;s this?</Link>
              </div>
              {sponsored.slice(0, 1).map(({ org }) => (
                <OrgCard key={org.id} org={org} sponsored openCount={orgOpenOpportunities(db, org.id).length} />
              ))}
              <p className="px-2 pb-1 pt-3 text-[11px] leading-relaxed text-gold-ink/90">Demonstration sponsor. Paid placements are always labeled and never change organic results.</p>
            </div>
          )}
          <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${sponsored.length ? "lg:col-span-3" : "lg:col-span-4"}`}>
            {organic.map(({ o, n }) => (
              <OrgCard key={o.id} org={o} openCount={n} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- How it works ---------------- */

const STEPS = [
  { icon: UserRoundPen, title: "Build a profile that speaks the industry's language", body: "Specialties, lines of authority, licensed states, work preferences and career interests — with license records clearly marked as self-reported." },
  { icon: Compass, title: "Discover and compare with clarity", body: "Filter by line, state, W-2 or contracting, training, leads and compensation model. Compare organizations side by side before you ever talk to a recruiter." },
  { icon: FileCheck2, title: "Apply on your terms", body: "Choose exactly what each organization sees. Track every application from submission to offer — nothing is shared without your consent." },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading align="center" eyebrow="How it works" title="Three steps to your next chapter." />
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-line bg-surface p-7 shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white"><s.icon className="h-5 w-5" strokeWidth={1.75} /></span>
                <span className="font-display text-4xl text-ink-4/50">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------------- Built for organizations ---------------- */

export function ForOrganizations() {
  const db = useDb();
  const pipeline = useMemo(() => {
    const apps = db.applications.filter((a) => a.orgId === "org_kestrelwood" && !a.withdrawn);
    return STAGE_ORDER.map((s) => ({ stage: s, apps: apps.filter((a) => a.stage === s) }));
  }, [db]);
  const users = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db]);
  const profiles = useMemo(() => new Map(db.profiles.map((p) => [p.userId, p])), [db]);
  const org = db.organizations.find((o) => o.id === "org_kestrelwood");

  const features = [
    { icon: Building2, title: "A profile that recruits for you", body: "Culture, leadership, training, mentorship, lead programs and compensation approach — the answers candidates actually want." },
    { icon: KanbanSquare, title: "A pipeline built for both hiring models", body: "Move W-2 candidates and contracting affiliates through one clear pipeline, with notes, messages and interview scheduling." },
    { icon: Users, title: "Consent-based talent discovery", body: "Reach producers who have opted into recruiter contact. Everyone else stays private until they choose to apply." },
    { icon: LineChart, title: "Analytics that inform, not inflate", body: "Listing views, profile traffic and candidate conversion — the signals that improve your recruiting." },
  ];

  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
      <Container className="relative">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-200">For employers</div>
            <h2 className="font-display text-[34px] leading-[1.1] sm:text-[44px]">Hire producers and advisors who already know the industry.</h2>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-white/65">
              Post jobs and affiliation opportunities, meet newly licensed talent through the New Producer Portal, and manage every candidate through to a hire or affiliation.
            </p>
            <div className="mt-10 grid gap-7 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title}>
                  <f.icon className="h-5 w-5 text-gold-200" strokeWidth={1.6} />
                  <div className="mt-3 text-[15px] font-semibold">{f.title}</div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">{f.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/join/organization" size="lg" variant="secondary" className="border-white">Post a job <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/for-organizations" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">How it works for employers</ButtonLink>
            </div>
          </div>

          {/* Live mini pipeline from demo data */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5" aria-label="Recruiting pipeline preview with demo data">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {org && <OrgLogo brand={org.brand} name={org.name} size={28} />}
                <div>
                  <div className="text-[13px] font-semibold">Recruiting pipeline</div>
                  <div className="text-[11px] text-white/50">{org?.name}</div>
                </div>
              </div>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold-200">Demo data</span>
            </div>
            <div className="scrollbar-none grid auto-cols-[minmax(150px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-1">
              {pipeline.slice(0, 5).map((col) => (
                <div key={col.stage} className="rounded-xl bg-white/[0.04] p-2.5">
                  <div className="mb-2.5 flex items-center justify-between px-1">
                    <span className="truncate text-[11px] font-medium text-white/70">{STAGE_LABEL[col.stage]}</span>
                    <span className="text-[11px] tabular-nums text-white/40">{col.apps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.apps.slice(0, 3).map((a) => {
                      const u = users.get(a.applicantId);
                      const p = profiles.get(a.applicantId);
                      return (
                        <div key={a.id} className="rounded-lg bg-white p-2.5 text-ink shadow-sm">
                          <div className="flex items-center gap-2">
                            <Avatar name={u?.name ?? "Member"} tone={p?.avatarTone} size={22} />
                            <span className="truncate text-[11.5px] font-medium">{u?.name}</span>
                          </div>
                          <div className="mt-1.5 line-clamp-2 text-[10.5px] leading-snug text-ink-3">{p?.headline}</div>
                        </div>
                      );
                    })}
                    {col.apps.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-3 text-center text-[10.5px] text-white/35">Empty</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Community ---------------- */

export function Community() {
  const db = useDb();
  const posts = useMemo(() => feedPosts(db).slice(0, 3), [db]);
  const users = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db]);
  const profiles = useMemo(() => new Map(db.profiles.map((p) => [p.userId, p])), [db]);
  const events = useMemo(() => [...db.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3), [db]);

  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Community & professional growth"
          title="Grow alongside the people who know the work."
          description="Connections, discussion, peer groups, mentorship office hours and events — a professional community focused on careers, not on selling policies."
          action={<ButtonLink href="/community" variant="secondary" size="sm">Explore the community <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>}
        />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            {posts.map((p) => {
              const u = users.get(p.authorId);
              const prof = profiles.get(p.authorId);
              return (
                <article key={p.id} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <Avatar name={u?.name ?? "Member"} tone={prof?.avatarTone} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold">{u?.name}</div>
                      <div className="truncate text-xs text-ink-3">{prof?.headline}</div>
                    </div>
                    <span className="hidden rounded-full bg-subtle px-2.5 py-0.5 text-[11px] text-ink-3 sm:inline">{TOPIC_LABEL[p.topic]}</span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{p.body}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-ink-4">
                    <span>{p.likes.length} appreciations</span>
                    <span>{p.comments.length} comments</span>
                    <span suppressHydrationWarning>{relativeDay(p.createdAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <div className="flex items-center gap-2 text-[13px] font-semibold"><MessageSquare className="h-4 w-4 text-navy" />Professional groups</div>
              <ul className="mt-4 divide-y divide-line">
                {db.groups.slice(0, 4).map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-[13.5px]">{g.name}</span>
                    <span className="shrink-0 text-xs text-ink-4">{g.memberIds.length} members</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <div className="flex items-center gap-2 text-[13px] font-semibold"><Handshake className="h-4 w-4 text-navy" />Upcoming events</div>
              <ul className="mt-4 space-y-4">
                {events.map((e) => {
                  const d = formatEventDate(e.startsAt);
                  return (
                    <li key={e.id} className="flex gap-4" suppressHydrationWarning>
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-subtle">
                        <span className="text-[9.5px] font-semibold tracking-[0.1em] text-ink-3">{d.month}</span>
                        <span className="text-base font-semibold leading-none">{d.day}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium leading-snug">{e.title}</div>
                        <div className="mt-0.5 text-xs text-ink-3">{e.format === "virtual" ? "Virtual" : e.location} · {e.host}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Principles ---------------- */

export function Principles() {
  const items = [
    { icon: Scale, title: "Independent", body: "We are a technology platform — not an insurer, agency or recruiting firm. We don't sell policies or take a cut of commissions." },
    { icon: ShieldCheck, title: "Consent-first", body: "Your profile data reaches an organization only when you apply or opt in. You choose what each one sees." },
    { icon: Sparkles, title: "Honest by design", body: "No income claims, no guarantee language, clearly labeled sponsorship — and every listing is reviewed against published standards." },
  ];
  return (
    <section className="border-t border-line bg-surface py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="flex gap-4">
              <i.icon className="mt-1 h-5 w-5 shrink-0 text-gold" strokeWidth={1.6} />
              <div>
                <div className="font-display text-[22px]">{i.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">{i.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-[linear-gradient(135deg,var(--color-navy-50),var(--color-gold-50))] px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0 grain opacity-60" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-[34px] leading-[1.1] sm:text-[46px]">Your next role in insurance and financial services starts here.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-3">Whether you&apos;re studying for your first exam or leading an agency, build your presence on a network made for this industry.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/join" size="lg">Join the Network <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/join/organization" size="lg" variant="secondary">Post a job</ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
