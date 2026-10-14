"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import { useDb, useHydrated } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { articlesByDate, coverStory, SECTION_LABEL } from "@/lib/services/insider";
import { ORG_COLLECTIONS, collectionOrgs, orgOpenOpportunities } from "@/lib/services/organizations";
import { mentors } from "@/lib/services/network";
import { publishedOpportunities } from "@/lib/services/opportunities";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Kicker, SectionHead } from "@/components/editorial";
import { KindBadge } from "@/components/domain/badges";
import { ORG_CATEGORY_LABEL, lineName } from "@/lib/data/taxonomy";
import { compensationLabel } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";

const wrap = "mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8";

const DESTINATIONS = [
  { href: "/network", name: "The Network", line: "Your headquarters: people, conversations and what's new in your corner of the industry." },
  { href: "/discover", name: "Discover", line: "An editorial directory of agencies, IMOs, FMOs, carriers and advisory firms worth knowing." },
  { href: "/opportunities", name: "Opportunities", line: "W-2 roles and 1099 affiliations, described honestly and matched transparently." },
  { href: "/people", name: "People", line: "Professional portfolios, mentors and the colleagues who make the work better." },
  { href: "/insider", name: "The Insider", line: "Guides, interviews and ideas for every stage of an insurance career." },
];

export function FrontPage() {
  const db = useDb();
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const router = useRouter();

  // Members land on their Network headquarters.
  useEffect(() => {
    if (hydrated && user && (user.kind === "producer" || user.kind === "aspiring")) router.replace("/network");
  }, [hydrated, user, router]);

  const cover = useMemo(() => coverStory(db), [db]);
  const stories = useMemo(() => articlesByDate(db).filter((a) => a.id !== cover?.id).slice(0, 4), [db, cover]);
  const collections = useMemo(() => {
    // Each collection leads with a different company so the band never repeats itself.
    const used = new Set<string>();
    return ORG_COLLECTIONS.slice(0, 3)
      .map((c) => {
        const list = collectionOrgs(db, c);
        const lead = list.find((o) => !used.has(o.id)) ?? list[0];
        if (lead) used.add(lead.id);
        return { c, orgs: lead ? [lead, ...list.filter((o) => o.id !== lead.id)] : list };
      })
      .filter((x) => x.orgs.length > 0);
  }, [db]);
  const people = useMemo(() => mentors(db).slice(0, 4), [db]);
  const users = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db]);
  const orgs = useMemo(() => new Map(db.organizations.map((o) => [o.id, o])), [db]);
  const opps = useMemo(() => {
    const all = publishedOpportunities(db).sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
    const w2 = all.find((o) => o.kind === "employment");
    const ic = all.find((o) => o.kind === "contracting");
    const rest = all.filter((o) => o !== w2 && o !== ic).slice(0, 2);
    return [w2, ic, ...rest].filter(Boolean) as typeof all;
  }, [db]);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="border-b border-line">
        <div className={`${wrap} grid gap-12 pb-16 pt-14 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-20`}>
          <div className="lg:col-span-6 xl:col-span-7">
            <Kicker className="mb-8 max-w-sm">The professional home of insurance</Kicker>
            <h1 className="font-display text-[46px] leading-[0.98] tracking-[-0.03em] text-ink sm:text-[68px] xl:text-[80px]">
              An industry network first.
              <span className="block text-ink-4">A career marketplace second.</span>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Producer Network is where insurance and financial services professionals build reputations, find the organizations worth joining and meet the people who make the work better — with opportunities when you&apos;re ready for them.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/join" size="lg">Join the Network <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/fit" size="lg" variant="secondary"><Compass className="h-4 w-4" strokeWidth={1.75} /> Find your Industry Fit</ButtonLink>
            </div>
            <p className="mt-6 text-[12.5px] text-ink-4">Prototype · every person, company, article and listing here is fictional.</p>
          </div>

          {cover && (
            <Link href={`/insider/${cover.slug}`} className="group block lg:col-span-6 xl:col-span-5">
              <div className="overflow-hidden rounded-[6px]">
                <div className="aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.03]">
                  <CoverArt seed={cover.id} variant={cover.art.variant} hue={cover.art.hue} ground={cover.art.ground} />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                <span>The Insider</span><span className="text-ink-4">/</span><span>{SECTION_LABEL[cover.section]}</span>
              </div>
              <h2 className="mt-2 font-display text-[26px] leading-[1.15] tracking-[-0.01em] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4 sm:text-[30px]">{cover.title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">{cover.dek}</p>
              <p className="mt-3 text-[12.5px] text-ink-4" suppressHydrationWarning>{cover.authorName} · {cover.readMinutes} min read</p>
            </Link>
          )}
        </div>
      </section>

      {/* ---------- Five destinations ---------- */}
      <section className="border-b border-line bg-surface">
        <div className={`${wrap} grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x`}>
          {DESTINATIONS.map((d) => (
            <Link key={d.href} href={d.href} className="group flex flex-col justify-between gap-6 py-7 transition sm:px-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[24px] text-ink">{d.name}</span>
                  <ArrowUpRight className="h-4 w-4 text-ink-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">{d.line}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- The Insider ---------- */}
      <section className={`${wrap} py-20`}>
        <SectionHead kicker="The Insider" title="Reading for the people who do the work." dek="Career guides, interviews and ideas from across the industry. Demo editorial — fictional, and labeled as such." href="/insider" linkLabel="Open The Insider" />
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((a) => (
            <Link key={a.id} href={`/insider/${a.slug}`} className="group">
              <div className="overflow-hidden rounded-[4px]">
                <div className="aspect-[3/2] transition-transform duration-700 group-hover:scale-[1.04]">
                  <CoverArt seed={a.id} variant={a.art.variant} hue={a.art.hue} ground={a.art.ground} />
                </div>
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{SECTION_LABEL[a.section]}</div>
              <h3 className="mt-1.5 font-display text-[20px] leading-[1.2] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{a.title}</h3>
              <p className="mt-2 text-[12.5px] text-ink-4" suppressHydrationWarning>{formatDate(a.publishedAt, { month: "short", day: "numeric" })} · {a.readMinutes} min</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Discover ---------- */}
      <section className="border-y border-line bg-surface py-20">
        <div className={wrap}>
          <SectionHead kicker="Discover" title="Companies worth knowing, not just hiring." dek="Explore agencies, IMOs, FMOs, carrier programs and advisory firms by how they train, support and pay — before you ever apply." href="/discover" linkLabel="Explore Discover" />
          <div className="grid gap-10 lg:grid-cols-3">
            {collections.map(({ c, orgs: list }) => {
              const lead = list[0]!;
              return (
                <div key={c.id}>
                  <Link href={`/organizations/${lead.slug}`} className="group block">
                    <div className="relative overflow-hidden rounded-[4px]">
                      <div className="aspect-[16/10] transition-transform duration-700 group-hover:scale-[1.03]">
                        <CoverArt seed={lead.id} variant={variantFor(lead.id)} hue={lead.brand.color} ground={lead.brand.tint} />
                      </div>
                      <div className="absolute bottom-3 left-3"><OrgLogo brand={lead.brand} name={lead.name} size={40} className="ring-2 ring-surface" /></div>
                    </div>
                  </Link>
                  <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{c.title}</div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{c.dek}</p>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {list.slice(0, 3).map((o) => (
                      <li key={o.id}>
                        <Link href={`/organizations/${o.slug}`} className="group flex items-center gap-3 py-3">
                          <OrgLogo brand={o.brand} name={o.name} size={28} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{o.name}</span>
                            <span className="block text-xs text-ink-3">{ORG_CATEGORY_LABEL[o.category]} · {o.hqCity}, {o.hqState}</span>
                          </span>
                          <span className="shrink-0 text-xs text-ink-4">{orgOpenOpportunities(db, o.id).length} open</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- People ---------- */}
      <section className={`${wrap} py-20`}>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Kicker className="mb-5">People</Kicker>
            <h2 className="font-display text-[34px] leading-[1.08] tracking-[-0.015em] sm:text-[42px]">Your reputation, built in public.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-3">Professional portfolios that show your specialties, career history and accomplishments — and experienced members who&apos;ve opened their calendars to mentor the next generation.</p>
            <Link href="/people" className="group mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink">Meet the community <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[4px] border border-line bg-line sm:grid-cols-2 lg:col-span-8">
            {people.map((p) => {
              const u = users.get(p.userId);
              if (!u) return null;
              return (
                <Link key={p.userId} href={`/people/${p.userId}`} className="group flex gap-4 bg-canvas p-6 transition hover:bg-surface">
                  <Avatar name={u.name} tone={p.avatarTone} size={52} decorative />
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-ink">{u.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-3">{p.headline}</div>
                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">Mentors on</div>
                    <div className="mt-1 text-[13px] text-ink-2">{p.mentor?.topics.slice(0, 2).join(" · ")}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Industry Fit ---------- */}
      <section className="bg-ink text-white">
        <div className={`${wrap} grid items-center gap-10 py-16 lg:grid-cols-12`}>
          <div className="lg:col-span-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Your Industry Fit</div>
            <h2 className="mt-4 font-display text-[34px] leading-[1.08] sm:text-[46px]">Seven questions. A clearer picture of where you belong.</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">Tell us how you want to work — independent or employed, the support you need, the specialties you love. We&apos;ll show the organizations and opportunities that align, and exactly why. Deterministic and transparent; no AI makes decisions about you.</p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <ButtonLink href="/fit" size="lg" variant="secondary" className="border-white">Start Your Industry Fit <ArrowRight className="h-4 w-4" /></ButtonLink>
          </div>
        </div>
      </section>

      {/* ---------- Opportunities ---------- */}
      <section className={`${wrap} py-20`}>
        <SectionHead kicker="Opportunities" title="Two ways to work. Always clearly labeled." dek="Every listing says whether it's W-2 employment or an independent (1099) affiliation, and shows pay only as the organization disclosed it." href="/opportunities" linkLabel="All opportunities" />
        <ul className="divide-y divide-line border-y border-line">
          {opps.map((o) => {
            const org = orgs.get(o.orgId);
            return (
              <li key={o.id}>
                <Link href={`/opportunities/${o.slug}`} className="group grid items-center gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 items-center gap-4">
                    {org && <OrgLogo brand={org.brand} name={org.name} size={40} />}
                    <div className="min-w-0">
                      <div className="truncate text-[16px] font-semibold text-ink group-hover:underline group-hover:underline-offset-4">{o.title}</div>
                      <div className="truncate text-[13px] text-ink-3">{org?.name} · {o.lines.slice(0, 2).map((l) => lineName(l, true)).join(", ")}</div>
                    </div>
                  </div>
                  <div className="hidden text-[13px] text-ink-2 lg:block">{compensationLabel(o.compensation)}</div>
                  <KindBadge kind={o.kind} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- For employers ---------- */}
      <section className="border-t border-line bg-surface">
        <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12`}>
          <div className="lg:col-span-5">
            <Kicker className="mb-5">For organizations</Kicker>
            <h2 className="font-display text-[30px] leading-[1.1] sm:text-[38px]">Be the organization producers want to discover.</h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-[15px] leading-relaxed text-ink-2">Agencies, IMOs, FMOs, carriers and advisory firms present their culture, training and support honestly; meet consenting talent through the New Producer Portal; and run every conversation in a calm recruiting workspace. Listings are reviewed against clear standards — no income claims, every producer cost disclosed.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/join/organization">List your organization</ButtonLink>
              <ButtonLink href="/for-organizations" variant="secondary">How it works</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
