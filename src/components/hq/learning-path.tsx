"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import type { Article, ProducerProfile, Resource } from "@/lib/data/types";
import { lineName } from "@/lib/data/taxonomy";
import { SECTION_LABEL } from "@/lib/services/insider";
import { CoverArt } from "@/components/brand/cover-art";
import { SectionHead } from "@/components/editorial";
import { AspiringStepper, nextStepFor } from "@/components/member/aspiring-path";

const KIND_LABEL: Record<Resource["kind"], string> = { guide: "Guide", article: "Article", checklist: "Checklist", webinar: "Webinar", template: "Template" };

/** Aspiring members: where they are, what's next, and what to read. Educational only. */
export function LearningPath({ profile, guides, resources }: { profile: ProducerProfile; guides: Article[]; resources: Resource[] }) {
  const a = profile.aspiring;
  const next = a ? nextStepFor(a.stage) : undefined;
  return (
    <section aria-label="Your path into insurance">
      <SectionHead
        kicker="Your path"
        title="Learning the industry, one clear step at a time"
        dek={a ? <>You&apos;re focused on {a.targetLines.slice(0, 3).map((l) => lineName(l)).join(", ")}{a.targetDate ? <> · aiming for {a.targetDate.toLowerCase()}</> : null}.</> : undefined}
        href="/me/profile"
        linkLabel="Update your path"
      />

      {a && <AspiringStepper stage={a.stage} className="border-y border-line py-6" />}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          {next && (
            <div className="mb-9">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">Suggested next step</div>
              <p className="mt-2 font-display text-[26px] leading-[1.15] text-ink">{next.title}</p>
              <p className="mt-2 max-w-[60ch] text-[14.5px] leading-relaxed text-ink-3">{next.body}</p>
              <Link href={next.href} className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-navy-600 hover:text-navy">
                {next.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Career guides from The Insider</div>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {guides.map((g) => (
              <li key={g.id}>
                <Link href={`/insider/${g.slug}`} className="group flex items-center gap-4 py-4">
                  <div className="w-24 shrink-0 overflow-hidden rounded-[3px]">
                    <div className="aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.05]">
                      <CoverArt seed={g.id} variant={g.art.variant} hue={g.art.hue} ground={g.art.ground} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">{SECTION_LABEL[g.section]} · {g.readMinutes} min</div>
                    <div className="mt-1 font-display text-[18px] leading-[1.25] text-ink decoration-1 underline-offset-4 group-hover:underline">{g.title}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <Link href="/launch" className="group block rounded-2xl border border-line bg-surface p-6 transition hover:border-line-strong hover:shadow-card">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">New Producer Portal</div>
            <p className="mt-2 font-display text-[22px] leading-[1.2] text-ink">Companies that hire and train people who are just starting out.</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">See how each one trains, supports and pays new producers — and, when you&apos;re ready, introduce yourself to several at once, sharing only what you choose.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 group-hover:text-navy">
              Visit the Portal <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Reading list</div>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {resources.map((r) => (
              <li key={r.id}>
                <Link href={`/resources/${r.slug}`} className="group flex items-start gap-3 py-3.5">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.75} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium leading-snug text-ink decoration-1 underline-offset-4 group-hover:underline">{r.title}</span>
                    <span className="mt-0.5 block text-[12px] text-ink-4">{KIND_LABEL[r.kind]} · {r.minutes} min</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-4">Educational content only — licensing rules vary by state. Confirm requirements with your state department of insurance.</p>
        </div>
      </div>
    </section>
  );
}
