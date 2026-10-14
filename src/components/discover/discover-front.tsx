"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Columns3, Compass } from "lucide-react";
import type { LineSlug, OrgCategory, Organization, Sector } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import {
  ORG_COLLECTIONS,
  activeSponsored,
  approvedOrganizations,
  collectionOrgs,
  orgOpenOpportunities,
  type OrgCollection,
} from "@/lib/services/organizations";
import { scoreOrganization } from "@/lib/services/fit";
import { INSURANCE_LINES, LINES_BY_SECTOR, ORG_CATEGORY_DESCRIPTION, ORG_CATEGORY_LABEL, SECTOR_LABEL, US_STATES, lineName } from "@/lib/data/taxonomy";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Kicker, SectionHead } from "@/components/editorial";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { WhatWhereSearch } from "@/components/discovery/filter-ui";
import { cn } from "@/lib/utils/cn";
import { DiscoverOrgCard } from "./discover-org-card";
import { FollowButton } from "./follow-button";
import { CompareTray, useCompareSelection } from "./compare-tray";
import { LEAD_SHORT, collectionHref, employmentLong, similarOrganizations } from "./org-facts";

const WHERE_OPTIONS = [{ value: "", label: "Anywhere in the US" }, ...US_STATES.map((s) => ({ value: s.code, label: s.name }))];
const CATEGORY_ORDER = Object.keys(ORG_CATEGORY_LABEL) as OrgCategory[];

/** Turn a free-text query into the closest directory search (specialty → category → keyword). */
function directoryHref(what: string, where: string) {
  const q = what.trim();
  const lc = q.toLowerCase();
  const p = new URLSearchParams();
  const line = lc.length >= 3 ? INSURANCE_LINES.find((l) => l.shortName.toLowerCase() === lc || l.name.toLowerCase() === lc || l.name.toLowerCase().startsWith(lc)) : undefined;
  const cat = lc.length >= 2 ? CATEGORY_ORDER.find((c) => ORG_CATEGORY_LABEL[c].toLowerCase() === lc) : undefined;
  if (line) p.set("lines", line.slug);
  else if (cat) p.set("cat", cat);
  else if (q) p.set("q", q);
  if (where) p.set("state", where);
  const qs = p.toString();
  return qs ? `/organizations?${qs}` : "/organizations";
}

function weekIndex() {
  return Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
}

export function DiscoverFront() {
  const db = useDb();
  const user = useCurrentUser();
  const router = useRouter();
  const compare = useCompareSelection();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");

  const orgs = useMemo(() => approvedOrganizations(db).slice().sort((a, b) => a.name.localeCompare(b.name)), [db]);
  const openCounts = useMemo(() => new Map(orgs.map((o) => [o.id, orgOpenOpportunities(db, o.id).length])), [db, orgs]);
  const sponsored = useMemo(() => {
    const seen = new Set<string>();
    return activeSponsored(db, "directory_top").filter((s) => (seen.has(s.org.id) ? false : (seen.add(s.org.id), true)));
  }, [db]);

  /* Editor's pick: chosen on substance (training, mentorship, culture), rotating weekly. Never a paid placement. */
  const featured = useMemo(() => {
    const paid = new Set(sponsored.map((s) => s.org.id));
    const pool = orgs.filter((o) => !paid.has(o.id) && o.trainingPrograms.length > 0 && o.mentorship.available && o.culture.values.length >= 2);
    return pool.length ? pool[weekIndex() % pool.length]! : orgs[0];
  }, [orgs, sponsored]);

  const coverStrip = useMemo(() => {
    const prefer: OrgCategory[] = ["independent_agency", "imo", "ria", "carrier_recruiting", "wholesale_broker"];
    const out: Organization[] = [];
    for (const c of prefer) {
      const o = orgs.find((x) => x.category === c && x.id !== featured?.id);
      if (o) out.push(o);
      if (out.length === 3) break;
    }
    return out;
  }, [orgs, featured]);

  const collections = useMemo(() => ORG_COLLECTIONS.map((c) => ({ c, items: collectionOrgs(db, c) })).filter((x) => x.items.length >= 2), [db]);

  const categoryCounts = useMemo(() => {
    const m = new Map<OrgCategory, number>();
    orgs.forEach((o) => m.set(o.category, (m.get(o.category) ?? 0) + 1));
    return m;
  }, [orgs]);
  const lineCounts = useMemo(() => {
    const m = new Map<LineSlug, number>();
    orgs.forEach((o) => o.lines.forEach((l) => m.set(l, (m.get(l) ?? 0) + 1)));
    return m;
  }, [orgs]);

  /* ----- personalization ----- */
  const member = !!user && (user.kind === "producer" || user.kind === "aspiring");
  const personal = useMemo(() => {
    if (!user || !member) return null;
    const followed = db.follows
      .filter((f) => f.userId === user.id)
      .map((f) => orgs.find((o) => o.id === f.targetId))
      .filter((o): o is Organization => !!o);
    const followedIds = new Set(followed.map((o) => o.id));
    const fit = db.fitAnswers[user.id];
    const picks: { org: Organization; reason: string; kind: "fit" | "follow" | "profile" }[] = [];
    const taken = new Set<string>();
    const push = (org: Organization, reason: string, kind: "fit" | "follow" | "profile") => {
      if (taken.has(org.id) || followedIds.has(org.id)) return;
      taken.add(org.id);
      picks.push({ org, reason, kind });
    };
    if (fit) {
      orgs
        .map((o) => scoreOrganization(db, o, fit))
        .filter((r) => r.score >= 52)
        .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
        .slice(0, 4)
        .forEach((r) => push(r.item, `Matches your Industry Fit · ${r.reasons[0]?.text ?? r.label}`, "fit"));
    }
    for (const f of followed.slice(0, 2)) similarOrganizations(db, f, 2).forEach((o) => push(o, `Because you follow ${f.name}`, "follow"));
    if (picks.length < 3) {
      const profile = db.profiles.find((p) => p.userId === user.id);
      const focus = profile?.specialties.length ? profile.specialties : profile?.aspiring?.targetLines ?? [];
      for (const o of orgs) {
        const l = o.lines.find((x) => focus.includes(x));
        if (l) push(o, `Matches your ${lineName(l, true)} focus`, "profile");
        if (picks.length >= 3) break;
      }
    }
    return { followed, fit: !!fit, picks: picks.slice(0, 3), firstName: user.name.split(" ")[0] };
  }, [db, user, member, orgs]);

  const actively = orgs.filter((o) => o.recruitingStatus === "actively_recruiting").length;
  const withTraining = orgs.filter((o) => o.trainingPrograms.length > 0).length;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <Container className="pb-14 pt-10 sm:pb-20 sm:pt-14">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="animate-rise lg:col-span-7">
              <Kicker>Discover · The company directory</Kicker>
              <h1 className="mt-7 font-display text-[42px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[64px]">
                Exceptional companies,
                <br className="hidden sm:block" /> <span className="italic text-ink-3">closely edited.</span>
              </h1>
              <p className="mt-6 max-w-[58ch] text-[16.5px] leading-relaxed text-ink-2">
                Agencies, IMOs and FMOs, carrier career programs, advisory firms and bank programs — profiled on what matters to a career: how they train,
                who mentors, where leads come from, and whether you&apos;d be employed or independent.
              </p>
              <div className="mt-8">
                <WhatWhereSearch
                  what={what}
                  onWhat={setWhat}
                  where={where}
                  onWhere={setWhere}
                  whereOptions={WHERE_OPTIONS}
                  onSubmit={() => router.push(directoryHref(what, where))}
                  whatLabel="Company, specialty or city"
                  whatPlaceholder="Company, specialty or city"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 text-[13px] text-ink-3">
                <span className="mr-1.5">Try</span>
                {[
                  { label: "Commercial", href: "/organizations?lines=commercial" },
                  { label: "Medicare", href: "/organizations?lines=medicare" },
                  { label: "Remote-friendly", href: "/organizations?arr=remote" },
                  { label: "Wealth management", href: "/organizations?lines=wealth-management" },
                ].map((s, i) => (
                  <span key={s.href} className="inline-flex items-center">
                    {i > 0 && <span className="mx-1.5 text-ink-4" aria-hidden>·</span>}
                    <Link href={s.href} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 transition hover:text-ink hover:decoration-ink">
                      {s.label}
                    </Link>
                  </span>
                ))}
              </div>
              <p className="mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px] text-ink-3">
                <span>
                  <span className="font-display text-[20px] text-ink">{orgs.length}</span> reviewed companies
                </span>
                <span>
                  <span className="font-display text-[20px] text-ink">{actively}</span> actively recruiting
                </span>
                <span>
                  <span className="font-display text-[20px] text-ink">{withTraining}</span> with structured training
                </span>
                <span className="text-[11.5px] text-ink-4">Fictional demo data</span>
              </p>
            </div>

            {/* Cover strip: three companies as magazine spines */}
            <div className="hidden lg:col-span-5 lg:block" aria-label="A few companies in the directory">
              <div className="grid h-full grid-cols-3 gap-3 pl-6">
                {coverStrip.map((o, i) => (
                  <Link
                    key={o.id}
                    href={`/organizations/${o.slug}`}
                    className={cn("group relative flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-line shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift", i === 1 && "mt-10", i === 2 && "mt-4")}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <CoverArt seed={o.id} variant={variantFor(o.id)} hue={o.brand.color} ground={o.brand.tint} className="transition-transform duration-500 group-hover:scale-[1.04]" />
                    </div>
                    <div className="relative mt-auto bg-surface/95 p-3.5 backdrop-blur">
                      <OrgLogo brand={o.brand} name={o.name} size={30} />
                      <div className="mt-2 text-[13px] font-semibold leading-snug text-ink">{o.name}</div>
                      <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-ink-4">{ORG_CATEGORY_LABEL[o.category]}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- For you ---------- */}
      {personal && (
        <section aria-labelledby="for-you" className="border-b border-line bg-surface/60">
          <Container className="py-14">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <Kicker rule={false} className="text-navy-600">
                  For you
                </Kicker>
                <h2 id="for-you" className="mt-3 font-display text-[30px] leading-[1.08] tracking-[-0.015em] text-ink">
                  Picked for {personal.firstName}
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-3">
                  {personal.fit
                    ? "Ranked by your Industry Fit answers and the companies you follow. Every card says why it's here."
                    : "Based on the companies you follow and the specialties on your profile. Every card says why it's here."}
                </p>
                {!personal.fit && (
                  <Link href="/fit" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
                    <Compass className="h-4 w-4" strokeWidth={1.75} /> Take Your Industry Fit
                  </Link>
                )}
                {personal.followed.length > 0 && (
                  <div className="mt-8">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">You follow</div>
                    <ul className="mt-3 space-y-2">
                      {personal.followed.map((o) => (
                        <li key={o.id}>
                          <Link href={`/organizations/${o.slug}`} className="group flex items-center gap-2.5 text-[13.5px] text-ink-2 hover:text-ink">
                            <OrgLogo brand={o.brand} name={o.name} size={26} />
                            <span className="truncate group-hover:underline group-hover:underline-offset-4">{o.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-9">
                {personal.picks.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {personal.picks.map((p) => (
                      <DiscoverOrgCard
                        key={p.org.id}
                        org={p.org}
                        reason={p.reason}
                        openCount={openCounts.get(p.org.id) ?? 0}
                        compare={{ selected: compare.has(p.org.id), onToggle: () => compare.toggle(p.org.id) }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-start justify-center border-l border-line pl-8">
                    <p className="max-w-md text-[15px] leading-relaxed text-ink-2">
                      Follow a few companies or answer the Industry Fit questions, and this space will fill with companies chosen for you — with the reason
                      shown on each.
                    </p>
                    <ButtonLink href="/fit" variant="secondary" size="sm" className="mt-4">
                      Start Your Industry Fit <ArrowRight className="h-3.5 w-3.5" />
                    </ButtonLink>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ---------- Featured company ---------- */}
      {featured && <FeaturedCompany org={featured} openCount={openCounts.get(featured.id) ?? 0} />}

      {/* ---------- Collections ---------- */}
      <section aria-labelledby="collections" className="border-b border-line">
        <Container className="py-16 sm:py-20">
          <SectionHead
            kicker="Collections"
            title={<span id="collections">Curated by what companies offer</span>}
            dek="Each collection is assembled from the details organizations disclose — training, engagement model, specialties, arrangements. Never from payment."
            size="lg"
            className="mb-12"
          />
          <CollectionsBrowser collections={collections} openCounts={openCounts} compare={compare} />
        </Container>
      </section>

      {/* ---------- Sponsored (paid, separate) ---------- */}
      {sponsored.length > 0 && (
        <section aria-labelledby="sponsored" className="border-b border-gold-200 bg-gold-50/50">
          <Container className="py-12">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
                  <span id="sponsored">Sponsored · Paid placement</span>
                  <span className="h-px flex-1 bg-gold-200" aria-hidden />
                </div>
                <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-2">
                  These organizations paid to appear here. Placement is shown separately and never changes the collections, the editor&apos;s pick or the
                  A–Z directory.
                </p>
                <Link href="/for-organizations#sponsored" className="mt-3 inline-block text-[13px] font-medium text-gold-ink underline-offset-4 hover:underline">
                  How sponsorship works
                </Link>
              </div>
              <div className="grid gap-5 lg:col-span-8">
                {sponsored.map((s) => (
                  <DiscoverOrgCard
                    key={s.placement.id}
                    org={s.org}
                    sponsored
                    orientation="horizontal"
                    openCount={openCounts.get(s.org.id) ?? 0}
                    compare={{ selected: compare.has(s.org.id), onToggle: () => compare.toggle(s.org.id) }}
                  />
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ---------- Browse by type ---------- */}
      <section aria-labelledby="by-type" className="border-b border-line">
        <Container className="py-16 sm:py-20">
          <SectionHead kicker="Browse by type" title={<span id="by-type">Every kind of company in the business</span>} dek="Different organizations mean very different careers. Start with the shape of the company." href="/organizations" linkLabel="Full directory" />
          <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_ORDER.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map((c) => {
              const n = categoryCounts.get(c) ?? 0;
              return (
                <li key={c} className="border-t border-line">
                  <Link href={`/organizations?cat=${c}`} className="group block py-5">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="font-display text-[21px] leading-tight text-ink">{ORG_CATEGORY_LABEL[c]}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] tabular-nums text-ink-4 transition group-hover:text-ink">
                        {n} {n === 1 ? "company" : "companies"}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                    <span className="mt-1.5 block max-w-[46ch] text-[13px] leading-relaxed text-ink-3">{ORG_CATEGORY_DESCRIPTION[c]}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      {/* ---------- Browse by specialty ---------- */}
      <section aria-labelledby="by-specialty" className="border-b border-line bg-surface/60">
        <Container className="py-16 sm:py-20">
          <SectionHead kicker="Browse by specialty" title={<span id="by-specialty">Find the companies working in your corner of the industry</span>} />
          <div className="grid gap-12 lg:grid-cols-12">
            {(Object.keys(LINES_BY_SECTOR) as Sector[]).map((sector) => (
              <div key={sector} className={sector === "insurance" ? "lg:col-span-8" : "lg:col-span-4"}>
                <h3 className="mb-2 font-display text-[22px] text-ink">{SECTOR_LABEL[sector]}</h3>
                <ul className={cn("grid gap-x-8", sector === "insurance" && "sm:grid-cols-2")}>
                  {LINES_BY_SECTOR[sector].map((l) => {
                    const n = lineCounts.get(l.slug) ?? 0;
                    return (
                      <li key={l.slug} className="border-b border-line">
                        {n ? (
                          <Link href={`/organizations?lines=${l.slug}`} className="group flex items-center gap-3 py-3 text-[14px] text-ink-2 hover:text-ink">
                            <LineIcon line={l.slug} className="h-4 w-4 text-ink-4 transition group-hover:text-ink" strokeWidth={1.75} />
                            <span className="flex-1">{l.name}</span>
                            <span className="text-[12px] tabular-nums text-ink-4">{n}</span>
                          </Link>
                        ) : (
                          <span className="flex items-center gap-3 py-3 text-[14px] text-ink-4">
                            <LineIcon line={l.slug} className="h-4 w-4" strokeWidth={1.75} />
                            <span className="flex-1">{l.name}</span>
                            <span className="text-[12px]">Coming soon</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------- Compare + directory ---------- */}
      <section aria-label="Compare and browse" className="pb-10">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-card sm:p-10 lg:col-span-7">
              <Kicker rule={false}>Compare</Kicker>
              <h2 className="mt-3 max-w-md font-display text-[30px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[36px]">Put up to three companies side by side.</h2>
              <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-ink-3">
                Training, lead support, W-2 or 1099, mentorship, compensation approach and open roles — line by line, exactly as each company describes it.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <ButtonLink href={compare.ids.length >= 2 ? `/organizations/compare?ids=${compare.ids.join(",")}` : "/organizations/compare"} variant="accent">
                  <Columns3 className="h-4 w-4" strokeWidth={1.75} />
                  {compare.ids.length >= 2 ? `Compare your ${compare.ids.length} picks` : "Start a comparison"}
                </ButtonLink>
                <span className="text-[13px] text-ink-3">or tap “Compare” on any card</span>
              </div>
              <div className="pointer-events-none absolute right-10 top-10 hidden items-center gap-2 md:flex" aria-hidden>
                {orgs.slice(0, 3).map((o, i) => (
                  <span key={o.id} className="flex items-center gap-2">
                    {i > 0 && <span className="font-display text-[15px] italic text-ink-4">vs</span>}
                    <OrgLogo brand={o.brand} name={o.name} size={40} />
                  </span>
                ))}
              </div>
            </div>
            <Link href="/organizations" className="group flex flex-col justify-between rounded-2xl bg-ink p-7 text-white shadow-card transition hover:bg-[#1e2129] sm:p-10 lg:col-span-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">The full directory</div>
              <div>
                <div className="mt-6 font-display text-[64px] leading-none">{orgs.length}</div>
                <p className="mt-3 max-w-xs text-[14.5px] leading-relaxed text-white/70">Reviewed companies, listed A–Z and filterable by type, specialty, state, model and development.</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium">
                Browse all companies <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </Container>
      </section>

      <CompareTray />
    </>
  );
}

function FeaturedCompany({ org, openCount }: { org: Organization; openCount: number }) {
  const program = org.trainingPrograms[0];
  const value = org.culture.values[0];
  const items = [
    program && { label: "Training program", title: program.name, body: `${program.duration} · ${program.description}` },
    org.mentorship.available && { label: "Mentorship", title: "Mentorship available", body: org.mentorship.description },
    { label: "Lead approach", title: LEAD_SHORT[org.leadProgram.policy], body: org.leadProgram.description },
    value && { label: "Culture", title: value.title, body: value.description },
  ].filter((x): x is { label: string; title: string; body: string } => !!x);

  return (
    <section aria-labelledby="featured" className="border-b border-line" style={{ background: `color-mix(in oklab, ${org.brand.tint} 70%, var(--color-canvas))` }}>
      <Container className="py-16 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <Link href={`/organizations/${org.slug}`} className="group relative block overflow-hidden rounded-2xl shadow-lift lg:col-span-7" aria-label={`Read the ${org.name} profile`}>
            <div className="aspect-[4/3] overflow-hidden">
              <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} className="transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
            </div>
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-surface/95 py-2.5 pl-2.5 pr-4 shadow-card backdrop-blur">
              <OrgLogo brand={org.brand} name={org.name} size={44} />
              <div>
                <div className="text-[13.5px] font-semibold text-ink">{org.name}</div>
                <div className="text-[11.5px] text-ink-3">
                  {org.hqCity}, {org.hqState} · Founded {org.founded}
                </div>
              </div>
            </div>
          </Link>
          <div className="lg:col-span-5 lg:pt-2">
            <Kicker>Featured company · Editor&apos;s pick</Kicker>
            <div className="mt-6 text-[11.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: org.brand.color }}>
              {ORG_CATEGORY_LABEL[org.category]}
            </div>
            <h2 id="featured" className="mt-2 font-display text-[38px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[46px]">
              {org.name}
            </h2>
            <p className="mt-3 font-display text-[19px] italic leading-snug text-ink-2">{org.tagline}</p>
            <dl className="mt-7">
              {items.map((it) => (
                <div key={it.label} className="grid grid-cols-[110px_1fr] gap-4 border-t border-ink/10 py-3.5">
                  <dt className="pt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">{it.label}</dt>
                  <dd>
                    <div className="text-[14px] font-semibold text-ink">{it.title}</div>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{it.body}</p>
                  </dd>
                </div>
              ))}
              <div className="grid grid-cols-[110px_1fr] gap-4 border-y border-ink/10 py-3.5">
                <dt className="pt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">Model</dt>
                <dd className="text-[14px] font-semibold text-ink">{employmentLong(org)}</dd>
              </div>
            </dl>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <ButtonLink href={`/organizations/${org.slug}`}>
                Read the profile <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              {openCount > 0 && (
                <ButtonLink href={`/organizations/${org.slug}#open-roles`} variant="secondary">
                  {openCount} open {openCount === 1 ? "role" : "roles"}
                </ButtonLink>
              )}
              <FollowButton org={org} />
            </div>
            <p className="mt-5 text-[12px] text-ink-4">Chosen by the editors on substance and rotated weekly. Never a paid placement. Fictional company.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CollectionsBrowser({
  collections,
  openCounts,
  compare,
}: {
  collections: { c: OrgCollection; items: Organization[] }[];
  openCounts: Map<string, number>;
  compare: ReturnType<typeof useCompareSelection>;
}) {
  const [activeId, setActiveId] = useState(collections[0]?.c.id ?? "");
  const rail = useRef<HTMLUListElement>(null);
  const active = collections.find((x) => x.c.id === activeId) ?? collections[0];
  if (!active) return null;
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  const select = (id: string) => {
    setActiveId(id);
    rail.current?.scrollTo({ left: 0 });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div role="tablist" aria-label="Collections" aria-orientation="vertical" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:col-span-4 lg:mx-0 lg:block lg:overflow-visible lg:px-0">
        {collections.map(({ c, items }, i) => {
          const on = c.id === active.c.id;
          return (
            <button
              key={c.id}
              id={`col-tab-${c.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="col-panel"
              onClick={() => select(c.id)}
              className={cn(
                "group relative shrink-0 text-left transition duration-200",
                "rounded-full border px-4 py-2 text-[13px] lg:block lg:w-full lg:rounded-none lg:border-0 lg:border-t lg:border-line lg:px-0 lg:py-4",
                on ? "border-ink bg-ink text-white lg:bg-transparent lg:text-ink" : "border-line-strong text-ink-2 hover:text-ink lg:text-ink-3",
              )}
            >
              {on && <span className="absolute -left-4 top-4 hidden h-[calc(100%-2rem)] w-[2px] bg-ink lg:block" aria-hidden />}
              <span className="flex items-baseline gap-4">
                <span className={cn("hidden w-6 shrink-0 font-display text-[14px] tabular-nums lg:inline", on ? "text-ink" : "text-ink-4")}>{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="whitespace-nowrap lg:hidden">{c.title}</span>
                  <span className={cn("hidden font-display text-[22px] leading-[1.15] lg:block", !on && "group-hover:text-ink")}>{c.title}</span>
                  {on && <span className="mt-1.5 hidden text-[13.5px] leading-relaxed text-ink-3 lg:block">{c.dek}</span>}
                </span>
                <span className={cn("hidden shrink-0 text-[12px] tabular-nums lg:inline", on ? "text-ink-2" : "text-ink-4")}>{items.length}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div id="col-panel" role="tabpanel" aria-labelledby={`col-tab-${active.c.id}`} className="min-w-0 lg:col-span-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <p className="max-w-md text-[14px] leading-relaxed text-ink-3 lg:hidden">{active.c.dek}</p>
          <Link href={collectionHref(active.c)} className="group hidden items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink lg:inline-flex">
            See all {active.items.length} in the directory <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={() => scroll(-1)} aria-label="Scroll collection left" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-2 transition hover:border-ink-4 hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Scroll collection right" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-2 transition hover:border-ink-4 hover:text-ink">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ul ref={rail} key={active.c.id} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 animate-fade-in sm:mx-0 sm:px-0" aria-label={`${active.c.title} companies`}>
          {active.items.map((o) => (
            <li key={o.id} className="w-[min(300px,82vw)] shrink-0 snap-start">
              <DiscoverOrgCard org={o} openCount={openCounts.get(o.id) ?? 0} className="h-full" compare={{ selected: compare.has(o.id), onToggle: () => compare.toggle(o.id) }} />
            </li>
          ))}
        </ul>
        <Link href={collectionHref(active.c)} className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink lg:hidden">
          See all {active.items.length} in the directory <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
