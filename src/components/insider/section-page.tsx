"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { InsiderSection } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { articlesByDate } from "@/lib/services/insider";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { RESOURCE_KIND_LABEL } from "@/components/marketing/resource-card";
import { cn } from "@/lib/utils/cn";
import { EventsListing } from "./events-block";
import { DEMO_NOTE, issueMonth, SECTION_LABEL, SECTION_ORDER, sectionHref, sectionNumber } from "./sections";
import { CompactStory, FeatureRow, SectionOpener, Wrap } from "./story-layouts";

export function InsiderSectionPage({ section }: { section: InsiderSection }) {
  const db = useDb();
  const articles = useMemo(() => articlesByDate(db).filter((a) => a.section === section), [db, section]);
  const [lead, ...rest] = articles;

  return (
    <div className="pb-24">
      <Wrap className="pt-8 sm:pt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-3">
          <Link href="/insider" className="group inline-flex items-center gap-2 font-display text-[22px] italic text-ink">
            <ArrowLeft className="h-4 w-4 text-ink-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
            The Insider
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Issue · {issueMonth()} · <span className="text-gold-ink">Demo edition</span>
          </span>
        </div>
        <SectionOpener section={section} link={false} as="h1" />
        <p className="mt-6 text-[12px] text-ink-3">{DEMO_NOTE}</p>

        <div className="mt-12">
          {lead ? (
            <>
              <FeatureRow article={lead} />
              {rest.length > 0 && (
                <div className="mt-14 grid gap-x-12 border-t border-line pt-10 lg:grid-cols-2">
                  {rest.map((a) => (
                    <CompactStory key={a.id} article={a} className="border-b border-line lg:[&:nth-child(2)]:pt-0" />
                  ))}
                </div>
              )}
            </>
          ) : (
            section !== "events" && (
              <EmptyState
                title={`No ${SECTION_LABEL[section]} stories in this issue`}
                description="New pieces are added with each demo edition."
                action={
                  <ButtonLink href="/insider" variant="secondary">
                    Back to The Insider
                  </ButtonLink>
                }
              />
            )
          )}
        </div>

        {section === "events" && (
          <div className="mt-16 max-w-4xl">
            <h2 className="mb-4 font-display text-[26px] tracking-[-0.01em] text-ink">On the calendar</h2>
            <EventsListing limit={12} />
          </div>
        )}

        {section === "education" && (
          <div className="mt-16">
            <h2 className="font-display text-[26px] italic tracking-[-0.01em] text-ink">From the library</h2>
            <ul className="mt-4 grid border-t border-ink sm:grid-cols-2 sm:gap-x-12 lg:grid-cols-3">
              {db.resources.map((r) => (
                <li key={r.id} className="border-b border-line">
                  <Link href={`/resources/${r.slug}`} className="group block py-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                      {RESOURCE_KIND_LABEL[r.kind]} · {r.minutes} min
                    </p>
                    <p className="mt-1 text-[15px] font-medium leading-snug text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">{r.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav aria-label="Other sections" className="mt-24 border-t-2 border-ink pt-5">
          <h2 className="font-display text-[15px] italic text-ink-3">Elsewhere in the issue</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-8 sm:grid-cols-4">
            {SECTION_ORDER.map((s) => (
              <li key={s} className="border-b border-line">
                <Link
                  href={s === section ? "#" : sectionHref(s)}
                  aria-current={s === section ? "page" : undefined}
                  className={cn(
                    "flex items-baseline gap-2 py-3 font-display text-[19px] leading-tight",
                    s === section ? "pointer-events-none text-ink-4" : "text-ink hover:underline hover:decoration-ink/30 hover:underline-offset-4",
                  )}
                >
                  <span className="text-[12px] tabular-nums text-ink-4">{sectionNumber(s)}</span>
                  {SECTION_LABEL[s]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Wrap>
    </div>
  );
}
