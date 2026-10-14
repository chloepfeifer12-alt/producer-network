"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Article, Database, EventItem, Post, User } from "@/lib/data/types";
import { SECTION_LABEL } from "@/lib/services/insider";
import { formatEventDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

/** Header used when a block sits inside a tab: one quiet line plus a link. */
export function BareHead({ dek, href, label }: { dek: ReactNode; href: string; label: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <p className="text-[14px] text-ink-3">{dek}</p>
      <Link href={href} className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
        {label} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/** One tabbed block instead of several stacked sections. */
export function CalmTabs<T extends string>({ label, tabs, initial }: { label: string; tabs: { id: T; label: string; render: () => ReactNode }[]; initial?: T }) {
  const [active, setActive] = useState<T>(initial ?? tabs[0]!.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0]!;
  return (
    <section aria-label={label}>
      <div className="mb-8 flex items-end justify-between gap-6 border-b border-line">
        <h2 className="pb-3 font-display text-[26px] leading-none text-ink sm:text-[30px]">{label}</h2>
        <div role="tablist" aria-label={label} className="scrollbar-none -mb-px flex gap-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === current.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "shrink-0 border-b-[1.5px] pb-3 text-[14px] transition-colors",
                t.id === current.id ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" key={current.id} className="animate-fade-in">
        {current.render()}
      </div>
    </section>
  );
}

/** A single quiet line for saved items, applications, requests and Fit. */
export function ActivityLine({ db, user }: { db: Database; user: User }) {
  const saved = db.savedOpportunities.filter((s) => s.userId === user.id).length;
  const apps = db.applications.filter((a) => a.applicantId === user.id && !a.withdrawn && a.stage !== "closed" && a.stage !== "hired");
  const interviews = apps.filter((a) => a.stage === "interview").length;
  const requests = db.connections.filter((c) => c.toId === user.id && c.status === "pending").length;
  const fit = db.fitAnswers[user.id];
  const items: { label: string; value: string; href: string }[] = [
    { label: "Saved roles", value: String(saved), href: "/me/saved" },
    { label: interviews ? "Applications · interviewing" : "Active applications", value: interviews ? `${apps.length} · ${interviews}` : String(apps.length), href: "/me/applications" },
    { label: "Connection requests", value: String(requests), href: "/network/connections?tab=received" },
    { label: "Your Industry Fit", value: fit ? "Saved" : "Not started", href: "/fit" },
  ];
  return (
    <nav aria-label="Your activity" className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
      {items.map((i, idx) => (
        <Link
          key={i.label}
          href={i.href}
          className={cn("group px-1 py-4 transition hover:bg-surface sm:px-5", idx % 2 === 1 && "border-l border-line", idx >= 2 && "border-t border-line sm:border-t-0", idx === 2 && "sm:border-l")}
        >
          <div className="text-[12px] text-ink-3">{i.label}</div>
          <div className="mt-1 flex items-center justify-between font-display text-[22px] text-ink">
            {i.value}
            <ArrowRight className="h-3.5 w-3.5 text-ink-4 opacity-0 transition group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </nav>
  );
}

/** Reading, conversation and the next event — as quiet text rows. */
export function TodayList({ stories, posts, authorName, nextEvent }: { stories: Article[]; posts: Post[]; authorName: (id: string) => string; nextEvent?: EventItem }) {
  return (
    <section aria-label="Today in the industry">
      <div className="mb-6 flex items-end justify-between gap-6 border-b border-line pb-3">
        <h2 className="font-display text-[26px] leading-none text-ink sm:text-[30px]">Today in the industry</h2>
        <Link href="/insider" className="text-[13px] font-medium text-ink-2 hover:text-ink">The Insider →</Link>
      </div>
      <div className="grid gap-12 lg:grid-cols-12">
        <ul className="divide-y divide-line lg:col-span-7">
          {stories.map((a) => (
            <li key={a.id}>
              <Link href={`/insider/${a.slug}`} className="group block py-4 first:pt-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">{SECTION_LABEL[a.section]} · {a.readMinutes} min</div>
                <div className="mt-1 font-display text-[19px] leading-snug text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{a.title}</div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="space-y-8 lg:col-span-5">
          {posts.length > 0 && (
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">In conversation</div>
              <ul className="space-y-4">
                {posts.slice(0, 2).map((p) => (
                  <li key={p.id}>
                    <Link href="/network/conversations" className="group block">
                      <p className="line-clamp-2 text-[14.5px] leading-relaxed text-ink-2 group-hover:text-ink">“{p.body}”</p>
                      <p className="mt-1 text-[12.5px] text-ink-4">{authorName(p.authorId)} · {p.comments.length} replies</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nextEvent && (
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">Next event</div>
              <Link href="/network/events" className="group flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line" suppressHydrationWarning>
                  <span className="text-[9.5px] font-semibold tracking-[0.1em] text-ink-3">{formatEventDate(nextEvent.startsAt).month}</span>
                  <span className="text-base font-semibold leading-none">{formatEventDate(nextEvent.startsAt).day}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">{nextEvent.title}</span>
                  <span className="block text-[12.5px] text-ink-3">{nextEvent.format === "virtual" ? "Virtual" : nextEvent.location} · {nextEvent.host}</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
