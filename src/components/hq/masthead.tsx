"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { User } from "@/lib/data/types";
import type { BriefItem, HqMode } from "./hq-data";
import { timeOfDay } from "./hq-data";

const EDITION: Record<HqMode, string> = {
  experienced: "Your headquarters",
  new: "Your first-year headquarters",
  aspiring: "Your path into the industry",
  organization: "Your organization's network",
};

/** The welcome: dated kicker, serif greeting, one-line briefing derived from real activity. */
export function Masthead({ user, mode, items }: { user: User; mode: HqMode; items: BriefItem[] }) {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const first = user.name.split(" ")[0];

  return (
    <header className="animate-rise">
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        <span>{date}</span>
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="hidden text-ink-4 sm:inline">The Network · {EDITION[mode]}</span>
      </div>

      <h1 className="mt-6 font-display text-[40px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[56px] lg:text-[64px]">
        {timeOfDay(now)}, {first}<span className="text-gold">.</span>
      </h1>

      {items.length ? (
        <div className="mt-5 max-w-[68rem]">
          <span className="sr-only">Today in your network:</span>
          <ul className="flex flex-col gap-2 text-[15px] leading-[1.9] text-ink-2 sm:block sm:text-[16.5px]">
            {items.map((b, i) => (
              <li key={b.id} className="flex items-baseline sm:inline">
                <span aria-hidden className="mr-2.5 mt-[0.7em] h-1.5 w-1.5 shrink-0 self-start rounded-full bg-navy-400 sm:hidden" />
                <Link href={b.href} className="group underline decoration-line-strong decoration-1 underline-offset-[5px] transition hover:text-ink hover:decoration-ink">
                  {b.text}
                  <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5 -translate-y-px text-ink-4 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </Link>
                {i < items.length - 1 && <span aria-hidden className="hidden text-ink-4 sm:inline">{"  ·  "}</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-3">
          A quiet day in your network — a good moment to <Link href="/discover" className="text-ink underline decoration-line-strong underline-offset-[5px] hover:decoration-ink">discover an organization</Link> or <Link href="/people" className="text-ink underline decoration-line-strong underline-offset-[5px] hover:decoration-ink">meet someone new</Link>.
        </p>
      )}
    </header>
  );
}
