"use client";

import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import type { Article, EventItem } from "@/lib/data/types";
import { SECTION_LABEL } from "@/lib/services/insider";
import { CoverArt } from "@/components/brand/cover-art";
import { SectionHead } from "@/components/editorial";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { formatEventDate } from "@/lib/utils/dates";
import { RsvpButton } from "./actions";

export function Spotlight({ article }: { article: Article }) {
  return (
    <Link href={`/insider/${article.slug}`} className="group grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-8">
      <div className="overflow-hidden rounded-[4px]">
        <div className="aspect-[4/5] max-h-[340px] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:aspect-[4/5]">
          <CoverArt seed={article.id} variant={article.art.variant} hue={article.art.hue} ground={article.art.ground} />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">{SECTION_LABEL[article.section]}</div>
        <h3 className="mt-2 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-ink decoration-1 underline-offset-[5px] group-hover:underline sm:text-[28px]">{article.title}</h3>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-3">{article.dek}</p>
        <p className="mt-auto pt-5 text-[12.5px] text-ink-4">
          {article.authorName} · {article.readMinutes} min read · Fictional spotlight
        </p>
      </div>
    </Link>
  );
}

export function EventsList({ events }: { events: EventItem[] }) {
  if (!events.length)
    return <EmptyState compact title="No upcoming events" description="Groups host roundtables and office hours regularly — check back soon." action={<ButtonLink href="/network/events" size="sm" variant="secondary">All events</ButtonLink>} />;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {events.map((e) => {
        const d = formatEventDate(e.startsAt);
        return (
          <li key={e.id} className="flex items-start gap-4 py-4">
            <div className="w-12 shrink-0 text-center">
              <div className="text-[10.5px] font-semibold tracking-[0.14em] text-ink-4">{d.month}</div>
              <div className="font-display text-[30px] leading-none text-ink">{d.day}</div>
            </div>
            <div className="min-w-0 flex-1">
              <Link href="/network/events" className="text-[14.5px] font-semibold leading-snug tracking-[-0.005em] text-ink decoration-1 underline-offset-4 hover:underline">{e.title}</Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-3">
                <span className="inline-flex items-center gap-1">
                  {e.format === "virtual" ? <Video className="h-3 w-3" aria-hidden /> : <MapPin className="h-3 w-3" aria-hidden />}
                  {e.format === "virtual" ? "Virtual" : e.location}
                </span>
                <span className="text-ink-4">·</span>
                <span>{d.weekday}, {d.time}</span>
              </div>
              <div className="mt-1 text-[12px] text-ink-4">Hosted by {e.host} · {e.attendees.length} going</div>
            </div>
            <RsvpButton event={e} />
          </li>
        );
      })}
    </ul>
  );
}

export function Community({ article, events, stacked }: { article?: Article; events: EventItem[]; stacked?: boolean }) {
  return (
    <section aria-label="Community">
      <SectionHead kicker="Community" title="Around the network" href="/network/events" linkLabel="All events" size={stacked ? "sm" : "md"} />
      <div className={stacked ? "space-y-10" : "grid grid-cols-1 gap-12 lg:grid-cols-12"}>
        <div className={stacked ? "" : "lg:col-span-7"}>{article ? <Spotlight article={article} /> : null}</div>
        <div className={stacked ? "" : "lg:col-span-5"}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Upcoming</div>
          <EventsList events={events} />
        </div>
      </div>
    </section>
  );
}
