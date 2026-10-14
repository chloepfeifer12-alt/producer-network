"use client";

import { useEffect, useRef, useState } from "react";
import type { InsiderSection } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";
import { SECTION_LABEL, sectionNumber, sectionSlug } from "./sections";

export function sectionAnchor(s: InsiderSection) {
  return `section-${sectionSlug(s)}`;
}

/**
 * Sticky section index for the Insider front. Highlights the section in view
 * (scroll-spy) and keeps the active chip scrolled into view on small screens.
 */
export function SectionNav({ sections }: { sections: InsiderSection[] }) {
  const [active, setActive] = useState<InsiderSection | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(sectionAnchor(s))).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const onScroll = () => {
      const line = 160;
      let current: InsiderSection | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = (el.dataset.section as InsiderSection) ?? null;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  useEffect(() => {
    if (!active || !listRef.current) return;
    const chip = listRef.current.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!chip) return;
    const list = listRef.current;
    const left = chip.offsetLeft - list.clientWidth / 2 + chip.clientWidth / 2;
    list.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);

  return (
    <nav aria-label="Insider sections" className="sticky top-[63px] z-40 border-y border-line bg-canvas/92 backdrop-blur-md">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <ul ref={listRef} className="-mx-1 flex snap-x items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li className="hidden shrink-0 pr-3 font-display text-[17px] italic text-ink lg:block">The Insider</li>
          {sections.map((s) => {
            const on = active === s;
            return (
              <li key={s} className="shrink-0 snap-start">
                <a
                  href={`#${sectionAnchor(s)}`}
                  data-chip={s}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-200",
                    on ? "bg-ink text-canvas" : "text-ink-3 hover:bg-sunken hover:text-ink",
                  )}
                >
                  <span className={cn("font-display text-[11px] tabular-nums", on ? "text-canvas/60" : "text-ink-4")}>{sectionNumber(s)}</span>
                  {SECTION_LABEL[s]}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
