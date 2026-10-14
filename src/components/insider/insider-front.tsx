"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import type { Article, InsiderSection } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { articlesByDate, coverStory } from "@/lib/services/insider";
import { brand } from "@/config/brand";
import { ArticleArt, authorLabel, SectionLabel, StoryHeadline } from "./parts";
import { DEMO_NOTE, issueMonth, SECTION_LABEL, SECTION_SHORT, sectionHref } from "./sections";
import { chipClass, FILTER_SECTIONS, StoryList, Wrap } from "./story-list";
import { EventsListing } from "./events-block";

type Filter = InsiderSection | "all";

/**
 * The Insider front, calm by default: masthead → one cover story →
 * one filterable "Latest" list → three upcoming events.
 */
export function InsiderFront() {
  const db = useDb();
  const all = useMemo(() => articlesByDate(db), [db]);
  const cover = useMemo(() => coverStory(db), [db]);
  const [filter, setFilter] = useState<Filter>("all");

  const chips = useMemo(() => FILTER_SECTIONS.filter((s) => all.some((a) => a.section === s)), [all]);
  const list = useMemo(() => (filter === "all" ? all.filter((a) => a.id !== cover?.id) : all.filter((a) => a.section === filter)), [all, cover, filter]);

  return (
    <div className="pb-24 sm:pb-32">
      <Masthead />

      {cover && (
        <Wrap className="pt-10 sm:pt-14">
          <CoverStory article={cover} />
        </Wrap>
      )}

      <Wrap className="mt-16 sm:mt-24">
        <section aria-labelledby="latest">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="latest" className="font-display text-[30px] leading-none tracking-[-0.015em] text-ink sm:text-[34px]">
              Latest
            </h2>
            {filter !== "all" && (
              <Link href={sectionHref(filter)} className="group inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink">
                {SECTION_LABEL[filter]} section <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          <div role="group" aria-label="Filter stories by section" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={chipClass(filter === "all")}>
              All
            </button>
            {chips.map((s) => (
              <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={chipClass(filter === s)}>
                {SECTION_SHORT[s]}
              </button>
            ))}
          </div>

          <p className="sr-only" aria-live="polite">
            {list.length} {list.length === 1 ? "story" : "stories"} shown
          </p>
          <StoryList articles={list} showSection={filter === "all"} className="mt-6" />
        </section>
      </Wrap>

      <Wrap className="mt-16 sm:mt-24">
        <section aria-labelledby="upcoming-events">
          <h2 id="upcoming-events" className="font-display text-[30px] leading-none tracking-[-0.015em] text-ink sm:text-[34px]">
            Upcoming events
          </h2>
          <p className="mt-3 text-[15px] text-ink-3">Gatherings across the Network, online and in person.</p>
          <div className="mt-6">
            <EventsListing limit={3} compact />
          </div>
        </section>
      </Wrap>
    </div>
  );
}

function Masthead() {
  return (
    <header className="pt-8 sm:pt-12">
      <Wrap>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          <span>{brand.name} · Editorial</span>
          <span>
            Issue · {issueMonth()} · <span className="text-gold-ink">Demo edition</span>
          </span>
        </div>
        <div className="flex flex-col gap-3 pt-6 sm:pt-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <h1 className="font-display text-[48px] leading-[0.95] tracking-[-0.035em] text-ink sm:text-[60px] lg:text-[68px]">The Insider</h1>
          <p className="max-w-[44ch] font-display text-[17px] italic leading-[1.45] text-ink-2 sm:text-[18px] lg:pb-2 lg:text-right">
            Field notes on careers, craft and leadership from across insurance and financial services.
          </p>
        </div>
        <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-4">
          <Info className="mt-[2px] h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          {DEMO_NOTE}
        </p>
      </Wrap>
    </header>
  );
}

function CoverStory({ article }: { article: Article }) {
  return (
    <article className="group relative grid gap-x-12 gap-y-6 border-t border-line pt-10 sm:pt-12 lg:grid-cols-12 lg:items-center">
      <ArticleArt article={article} ratio="h-[200px] sm:h-[260px] lg:h-[300px]" className="lg:col-span-6" label />
      <div className="lg:col-span-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">Cover story</span>
          <span aria-hidden className="h-3 w-px bg-line-strong" />
          <SectionLabel article={article} />
        </p>
        <StoryHeadline article={article} as="h2" className="mt-3 text-[32px] leading-[1.08] tracking-[-0.02em] sm:text-[38px] lg:text-[42px]" />
        <p className="mt-4 max-w-[52ch] text-[16.5px] leading-relaxed text-ink-2">{article.dek}</p>
        <p className="mt-5 text-[13px] text-ink-3">
          By <span className="font-medium text-ink-2">{authorLabel(article)}</span> · {article.readMinutes} min read
        </p>
      </div>
    </article>
  );
}
