"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { InsiderSection } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { articlesByDate } from "@/lib/services/insider";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { RESOURCE_KIND_LABEL } from "@/components/marketing/resource-card";
import { EventsListing } from "./events-block";
import { DEMO_NOTE, SECTION_DEK, SECTION_LABEL, SECTION_ORDER, SECTION_SHORT, sectionHref } from "./sections";
import { chipClass, StoryList, Wrap } from "./story-list";

/** One Insider section: title, dek, then the same calm story list as the front. */
export function InsiderSectionPage({ section }: { section: InsiderSection }) {
  const db = useDb();
  const articles = useMemo(() => articlesByDate(db).filter((a) => a.section === section), [db, section]);
  const resources = db.resources.slice(0, 6);

  return (
    <div className="pb-24 sm:pb-32">
      <Wrap className="pt-8 sm:pt-12">
        <Link href="/insider" className="group inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-3 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
          The Insider
        </Link>
        <h1 className="mt-6 font-display text-[40px] leading-[1.02] tracking-[-0.025em] text-ink sm:text-[48px]">{SECTION_LABEL[section]}</h1>
        <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-ink-2">{SECTION_DEK[section]}</p>

        <nav aria-label="Insider sections" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Link href="/insider" className={chipClass(false)}>
            All
          </Link>
          {SECTION_ORDER.map((s) => (
            <Link key={s} href={sectionHref(s)} aria-current={s === section ? "page" : undefined} className={chipClass(s === section)}>
              {SECTION_SHORT[s]}
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          {articles.length > 0 ? (
            <StoryList articles={articles} showSection={false} />
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
          <section aria-labelledby="on-the-calendar" className="mt-16 sm:mt-24">
            <h2 id="on-the-calendar" className="font-display text-[30px] leading-none tracking-[-0.015em] text-ink">
              On the calendar
            </h2>
            <div className="mt-6">
              <EventsListing limit={8} compact />
            </div>
          </section>
        )}

        {section === "education" && resources.length > 0 && (
          <section aria-labelledby="from-the-library" className="mt-16 sm:mt-24">
            <h2 id="from-the-library" className="font-display text-[30px] leading-none tracking-[-0.015em] text-ink">
              From the library
            </h2>
            <ul className="mt-6 border-t border-line">
              {resources.map((r) => (
                <li key={r.id} className="border-b border-line">
                  <Link href={`/resources/${r.slug}`} className="group flex items-baseline justify-between gap-6 py-4">
                    <span className="text-[15.5px] font-medium leading-snug text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">{r.title}</span>
                    <span className="shrink-0 text-[12.5px] text-ink-4">
                      {RESOURCE_KIND_LABEL[r.kind]} · {r.minutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/resources" className="group mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink">
              The full library <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </section>
        )}

        <p className="mt-16 border-t border-line pt-5 text-[12.5px] leading-relaxed text-ink-4">{DEMO_NOTE}</p>
      </Wrap>
    </div>
  );
}
