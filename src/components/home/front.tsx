"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import { useDb, useHydrated } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { articlesByDate, coverStory, SECTION_LABEL } from "@/lib/services/insider";
import { CoverArt } from "@/components/brand/cover-art";
import { ButtonLink } from "@/components/ui/button";
import { Kicker, SectionHead } from "@/components/editorial";

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

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="border-b border-line">
        <div className={`${wrap} grid gap-12 pb-16 pt-14 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-20`}>
          <div className="lg:col-span-6 xl:col-span-7">
            <Kicker className="mb-8 max-w-sm">The professional home of insurance</Kicker>
            <h1 className="font-display text-[40px] leading-[1.02] tracking-[-0.025em] text-ink sm:text-[56px] xl:text-[62px]">
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
                <div className="aspect-[16/10] transition-transform duration-700 group-hover:scale-[1.03]">
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
        <ul className="grid gap-x-12 divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-y-0">
          {stories.map((a) => (
            <li key={a.id} className="sm:border-b sm:border-line">
              <Link href={`/insider/${a.slug}`} className="group block py-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">{SECTION_LABEL[a.section]} · {a.readMinutes} min</div>
                <h3 className="mt-1.5 font-display text-[20px] leading-snug text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{a.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Industry Fit ---------- */}
      <section className="border-y border-line bg-surface">
        <div className={`${wrap} grid items-center gap-10 py-16 lg:grid-cols-12`}>
          <div className="lg:col-span-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Your Industry Fit</div>
            <h2 className="mt-4 font-display text-[30px] leading-[1.1] text-ink sm:text-[38px]">A few questions. A clearer picture of where you belong.</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-3">Tell us how you want to work — independent or employed, the support you need, the specialties you love. We&apos;ll show the organizations and opportunities that align, and exactly why. Deterministic and transparent; no AI makes decisions about you.</p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <ButtonLink href="/fit" size="lg">Start Your Industry Fit <ArrowRight className="h-4 w-4" /></ButtonLink>
          </div>
        </div>
      </section>

      {/* ---------- For employers ---------- */}
      <section>
        <div className={`${wrap} grid gap-10 py-20 lg:grid-cols-12`}>
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
