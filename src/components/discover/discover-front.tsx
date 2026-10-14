"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import type { LineSlug, OrgCategory, Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ORG_COLLECTIONS, activeSponsored, approvedOrganizations, collectionOrgs, orgOpenOpportunities, type OrgCollection } from "@/lib/services/organizations";
import { scoreOrganization } from "@/lib/services/fit";
import { INSURANCE_LINES, ORG_CATEGORY_LABEL, US_STATES, lineName } from "@/lib/data/taxonomy";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Kicker } from "@/components/editorial";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/page";
import { WhatWhereSearch } from "@/components/discovery/filter-ui";
import { cn } from "@/lib/utils/cn";
import { DiscoverOrgCard, SponsoredLabel, SponsoredRow } from "./discover-org-card";
import { FollowButton } from "./follow-button";
import { CompareTray, useCompareSelection } from "./compare-tray";
import { LEAD_SHORT, collectionHref, employmentShort, similarOrganizations, trainingShort } from "./org-facts";

const WHERE_OPTIONS = [{ value: "", label: "Anywhere in the US" }, ...US_STATES.map((s) => ({ value: s.code, label: s.name }))];
const CATEGORY_ORDER = Object.keys(ORG_CATEGORY_LABEL) as OrgCategory[];
const SUGGESTIONS = [
  { label: "Commercial", href: "/organizations?lines=commercial" },
  { label: "Medicare", href: "/organizations?lines=medicare" },
  { label: "Remote-friendly", href: "/organizations?arr=remote" },
];
const FOR_YOU = "for-you";
/** Short tab labels; the full collection title stays in the panel. */
const TAB_LABEL: Record<string, string> = {
  "new-producers": "New producers",
  salaried: "Salaried programs",
  independent: "Independent",
  specialty: "Specialty",
  financial: "Financial services",
  remote: "Remote-friendly",
};

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

type Compare = ReturnType<typeof useCompareSelection>;
type Personal = { followed: Organization[]; fit: boolean; picks: { org: Organization; reason: string }[]; firstName: string };

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

  const collections = useMemo(() => ORG_COLLECTIONS.map((c) => ({ c, items: collectionOrgs(db, c) })).filter((x) => x.items.length >= 2), [db]);

  const categoryCounts = useMemo(() => {
    const m = new Map<OrgCategory, number>();
    orgs.forEach((o) => m.set(o.category, (m.get(o.category) ?? 0) + 1));
    return m;
  }, [orgs]);
  const topLines = useMemo(() => {
    const m = new Map<LineSlug, number>();
    orgs.forEach((o) => o.lines.forEach((l) => m.set(l, (m.get(l) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [orgs]);

  /* ----- personalization ----- */
  const member = !!user && (user.kind === "producer" || user.kind === "aspiring");
  const personal = useMemo<Personal | null>(() => {
    if (!user || !member) return null;
    const followed = db.follows
      .filter((f) => f.userId === user.id)
      .map((f) => orgs.find((o) => o.id === f.targetId))
      .filter((o): o is Organization => !!o);
    const followedIds = new Set(followed.map((o) => o.id));
    const fit = db.fitAnswers[user.id];
    const picks: { org: Organization; reason: string }[] = [];
    const taken = new Set<string>();
    const push = (org: Organization, reason: string) => {
      if (taken.has(org.id) || followedIds.has(org.id)) return;
      taken.add(org.id);
      picks.push({ org, reason });
    };
    if (fit) {
      orgs
        .map((o) => scoreOrganization(db, o, fit))
        .filter((r) => r.score >= 52)
        .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
        .slice(0, 4)
        .forEach((r) => push(r.item, `Fits your answers · ${r.reasons[0]?.text ?? r.label}`));
    }
    for (const f of followed.slice(0, 2)) similarOrganizations(db, f, 2).forEach((o) => push(o, `Because you follow ${f.name}`));
    if (picks.length < 3) {
      const profile = db.profiles.find((p) => p.userId === user.id);
      const focus = profile?.specialties.length ? profile.specialties : profile?.aspiring?.targetLines ?? [];
      for (const o of orgs) {
        const l = o.lines.find((x) => focus.includes(x));
        if (l) push(o, `Matches your ${lineName(l, true)} focus`);
        if (picks.length >= 3) break;
      }
    }
    return { followed, fit: !!fit, picks: picks.slice(0, 3), firstName: user.name.split(" ")[0]! };
  }, [db, user, member, orgs]);

  return (
    <>
      {/* ---------- 1. Hero: one job — search ---------- */}
      <section className="border-b border-line">
        <Container className="pb-14 pt-10 sm:pb-20 sm:pt-16">
          <div className="max-w-3xl animate-rise">
            <Kicker rule={false}>Discover · Company directory</Kicker>
            <h1 className="mt-5 font-display text-[36px] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[48px]">Find a company worth building a career with.</h1>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-ink-3">Reviewed companies, profiled on training, mentorship, lead support and W-2 or 1099.</p>
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
            <p className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 text-[13px] text-ink-3">
              <span className="mr-1.5">Try</span>
              {SUGGESTIONS.map((s, i) => (
                <span key={s.href} className="inline-flex items-center">
                  {i > 0 && (
                    <span className="mx-1.5 text-ink-4" aria-hidden>
                      ·
                    </span>
                  )}
                  <Link href={s.href} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 transition hover:text-ink hover:decoration-ink">
                    {s.label}
                  </Link>
                </span>
              ))}
              <span className="ml-auto hidden text-[12px] text-ink-4 sm:inline">
                {orgs.length} reviewed companies · Fictional demo data
              </span>
            </p>
          </div>
        </Container>
      </section>

      {/* ---------- 2. Browse: one tabbed block ---------- */}
      <section aria-labelledby="browse" className="border-b border-line">
        <Container className="py-16 sm:py-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <div>
              <Kicker rule={false}>Browse</Kicker>
              <h2 id="browse" className="mt-3 font-display text-[26px] leading-[1.15] tracking-[-0.015em] text-ink sm:text-[30px]">
                Companies, grouped by what they offer
              </h2>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-4">Assembled from what companies disclose. Never from payment.</p>
          </div>
          <BrowseTabs personal={personal} collections={collections} openCounts={openCounts} compare={compare} />

          {sponsored.length > 0 && (
            <div className="mt-14" aria-labelledby="sponsored">
              <SponsoredLabel id="sponsored" note="Shown separately — never changes the collections or the directory." />
              <div className="grid gap-2">
                {sponsored.map((s) => (
                  <SponsoredRow key={s.placement.id} org={s.org} compare={{ selected: compare.has(s.org.id), onToggle: () => compare.toggle(s.org.id) }} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* ---------- 3. Featured company ---------- */}
      {featured && <FeaturedCompany org={featured} openCount={openCounts.get(featured.id) ?? 0} />}

      {/* ---------- 4. Browse by type ---------- */}
      <section aria-labelledby="by-type" className="pb-16">
        <Container className="pt-16 sm:pt-24">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker rule={false}>Browse by type</Kicker>
              <h2 id="by-type" className="mt-3 font-display text-[26px] leading-[1.15] tracking-[-0.015em] text-ink sm:text-[30px]">
                Every kind of company
              </h2>
            </div>
            <Link href="/organizations" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
              All {orgs.length} companies, A–Z <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 sm:gap-x-10 lg:grid-cols-3">
            {CATEGORY_ORDER.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map((c) => (
              <li key={c} className="border-t border-line">
                <Link href={`/organizations?cat=${c}`} className="group flex items-baseline justify-between gap-3 py-3 text-[14px] text-ink-2 hover:text-ink sm:py-3.5 sm:text-[15px]">
                  <span className="group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{ORG_CATEGORY_LABEL[c]}</span>
                  <span className="text-[12.5px] tabular-nums text-ink-4">{categoryCounts.get(c)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-1.5 text-[13px] text-ink-3">
            <span className="mr-1.5 text-ink-4">By specialty</span>
            {topLines.map(([l], i) => (
              <span key={l} className="inline-flex items-center">
                {i > 0 && (
                  <span className="mx-1.5 text-ink-4" aria-hidden>
                    ·
                  </span>
                )}
                <Link href={`/organizations?lines=${l}`} className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                  {lineName(l, true)}
                </Link>
              </span>
            ))}
            <span className="mx-1.5 text-ink-4" aria-hidden>
              ·
            </span>
            <Link href="/organizations" className="text-ink-3 underline-offset-4 hover:text-ink hover:underline">
              More in the directory
            </Link>
          </p>
        </Container>
      </section>

      <CompareTray />
    </>
  );
}

/* ------------------------------------------------------------------ */

function BrowseTabs({
  personal,
  collections,
  openCounts,
  compare,
}: {
  personal: Personal | null;
  collections: { c: OrgCollection; items: Organization[] }[];
  openCounts: Map<string, number>;
  compare: Compare;
}) {
  const tabs = useMemo(
    () => [...(personal ? [{ id: FOR_YOU, title: "For you", count: undefined as number | undefined }] : []), ...collections.map(({ c, items }) => ({ id: c.id, title: TAB_LABEL[c.id] ?? c.title, count: items.length }))],
    [personal, collections],
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Members default to "For you"; visitors to the first collection. Derived so it settles after the session hydrates.
  const activeId = chosen && tabs.some((t) => t.id === chosen) ? chosen : tabs[0]?.id;
  if (!activeId) return null;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === activeId);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length]!;
    setChosen(next.id);
    tabRefs.current[next.id]?.focus();
    e.preventDefault();
  };

  const collection = collections.find((x) => x.c.id === activeId);
  const card = (o: Organization, reason?: string) => (
    <DiscoverOrgCard
      key={o.id}
      org={o}
      reason={reason}
      openCount={openCounts.get(o.id) ?? 0}
      className="h-full"
      compare={{ selected: compare.has(o.id), onToggle: () => compare.toggle(o.id) }}
    />
  );

  return (
    <div>
      <div role="tablist" aria-label="Browse companies" onKeyDown={onKey} className="scrollbar-none -mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const on = t.id === activeId;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={`browse-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="browse-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setChosen(t.id)}
              className={cn(
                "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 pt-1 text-[14px] transition",
                on ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {t.title}
              {t.count != null && <span className={cn("ml-1.5 text-[12px] tabular-nums", on ? "text-ink-3" : "text-ink-4")}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      <div id="browse-panel" role="tabpanel" aria-labelledby={`browse-tab-${activeId}`} key={activeId} className="pt-6 animate-fade-in">
        {activeId === FOR_YOU && personal ? (
          <ForYouPanel personal={personal} card={card} />
        ) : collection ? (
          <>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="max-w-xl text-[14px] leading-relaxed text-ink-3">
                <span className="font-medium text-ink-2">{collection.c.title}.</span> {collection.c.dek}
              </p>
              <SeeAll href={collectionHref(collection.c)} label={`See all ${collection.items.length}`} />
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label={`${collection.c.title} companies`}>
              {collection.items.slice(0, 3).map((o) => (
                <li key={o.id}>{card(o)}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ForYouPanel({ personal, card }: { personal: Personal; card: (o: Organization, reason?: string) => ReactNode }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="max-w-xl text-[14px] leading-relaxed text-ink-3">
          {personal.fit ? "Ranked by your Industry Fit answers and the companies you follow." : "Based on the companies you follow and your profile specialties."}
        </p>
        {!personal.fit && (
          <Link href="/fit" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
            <Compass className="h-4 w-4" strokeWidth={1.75} /> Take Your Industry Fit
          </Link>
        )}
      </div>
      {personal.picks.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {personal.picks.map((p) => (
            <li key={p.org.id}>{card(p.org, p.reason)}</li>
          ))}
        </ul>
      ) : (
        <div className="border-l border-line py-2 pl-6">
          <p className="max-w-md text-[15px] leading-relaxed text-ink-2">Follow a few companies or answer the Industry Fit questions, and companies chosen for you will appear here.</p>
          <ButtonLink href="/fit" variant="secondary" size="sm" className="mt-4">
            Start Your Industry Fit <ArrowRight className="h-3.5 w-3.5" />
          </ButtonLink>
        </div>
      )}
      {personal.followed.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <span className="text-ink-4">You follow</span>
          {personal.followed.map((o) => (
            <Link key={o.id} href={`/organizations/${o.slug}`} className="group inline-flex items-center gap-2 text-ink-2 hover:text-ink">
              <OrgLogo brand={o.brand} name={o.name} size={22} />
              <span className="group-hover:underline group-hover:underline-offset-4">{o.name}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
      {label} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function FeaturedCompany({ org, openCount }: { org: Organization; openCount: number }) {
  const facts = [
    { label: "Training", value: org.trainingPrograms[0]?.name ?? trainingShort(org) },
    { label: "Model", value: employmentShort(org) },
    { label: "Leads", value: LEAD_SHORT[org.leadProgram.policy] },
  ];
  return (
    <section aria-labelledby="featured" className="border-b border-line">
      <Container className="py-16 sm:py-24">
        <Kicker rule={false}>Featured company · Editor&apos;s pick</Kicker>
        <div className="mt-6 grid items-center gap-8 md:grid-cols-12 md:gap-12">
          <Link href={`/organizations/${org.slug}`} className="group block overflow-hidden rounded-2xl border border-line md:col-span-5" aria-label={`Read the ${org.name} profile`} tabIndex={-1}>
            <div className="h-[180px] sm:h-[220px]">
              <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} intensity={0.5} className="transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            </div>
          </Link>
          <div className="min-w-0 md:col-span-7">
            <div className="flex items-center gap-3">
              <OrgLogo brand={org.brand} name={org.name} size={40} />
              <div className="min-w-0">
                <h2 id="featured" className="font-display text-[26px] leading-[1.15] tracking-[-0.015em] text-ink sm:text-[30px]">
                  {org.name}
                </h2>
                <div className="text-[12.5px] text-ink-3">
                  {ORG_CATEGORY_LABEL[org.category]} · {org.hqCity}, {org.hqState}
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">{org.tagline}</p>
            <dl className="mt-5 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-4">
              {facts.map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-4">{f.label}</dt>
                  <dd className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href={`/organizations/${org.slug}`} className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-ink hover:underline hover:underline-offset-4">
                Read the profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              {openCount > 0 && (
                <Link href={`/organizations/${org.slug}#open-roles`} className="text-[13.5px] text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                  {openCount} open {openCount === 1 ? "role" : "roles"}
                </Link>
              )}
              <FollowButton org={org} />
            </div>
            <p className="mt-5 text-[12px] text-ink-4">Chosen on substance and rotated weekly. Never a paid placement.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
