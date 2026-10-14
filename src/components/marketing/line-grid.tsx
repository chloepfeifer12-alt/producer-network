"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Database, LineSlug, Sector } from "@/lib/data/types";
import { INSURANCE_LINES } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { publishedOpportunities } from "@/lib/services/opportunities";
import { approvedOrganizations } from "@/lib/services/organizations";
import { LineIcon } from "@/components/ui/line-icon";
import { cn } from "@/lib/utils/cn";

export type LineCounts = Record<LineSlug, { opportunities: number; organizations: number }>;

/** Live counts of public opportunities and approved organizations per category. */
export function lineCounts(db: Database): LineCounts {
  const opps = publishedOpportunities(db);
  const orgs = approvedOrganizations(db);
  return Object.fromEntries(
    INSURANCE_LINES.map((l) => [
      l.slug,
      {
        opportunities: opps.filter((o) => o.lines.includes(l.slug)).length,
        organizations: orgs.filter((o) => o.lines.includes(l.slug)).length,
      },
    ]),
  ) as LineCounts;
}

export function useLineCounts() {
  const db = useDb();
  return useMemo(() => lineCounts(db), [db]);
}

/** Editorial grid of all career categories. */
export function LineGrid({ className, exclude, sector }: { className?: string; exclude?: LineSlug; sector?: Sector }) {
  const counts = useLineCounts();
  const lines = INSURANCE_LINES.filter((l) => l.slug !== exclude && (!sector || l.sector === sector));
  if (exclude) {
    // Compact variant (used for "other categories") — avoids an uneven hairline grid.
    return (
      <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {lines.map((l) => (
          <li key={l.slug} className="group relative flex items-center gap-3.5 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card transition hover:border-line-strong hover:shadow-lift">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-navy ring-1 ring-line">
              <LineIcon line={l.slug} className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <Link href={`/explore/${l.slug}`} className="block truncate text-[14px] font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none">{l.name}</Link>
              <span className="block text-xs tabular-nums text-ink-3">{counts[l.slug].opportunities} open · {counts[l.slug].organizations} orgs</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:text-ink" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3", className)}>
      {lines.map((l, i) => {
        const c = counts[l.slug];
        return (
          <li key={l.slug} className="group relative flex flex-col bg-surface p-6 transition hover:bg-[#fdfcf9] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-subtle text-navy ring-1 ring-line transition group-hover:bg-navy group-hover:text-white group-hover:ring-navy">
                <LineIcon line={l.slug} className="h-5 w-5" />
              </span>
              <span className="font-display text-sm tabular-nums text-ink-4">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.01em] text-ink">
              <Link href={`/explore/${l.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {l.name}
              </Link>
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{l.summary}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-[12.5px] text-ink-3">
              <span className="tabular-nums">
                <span className="font-medium text-ink">{c.opportunities}</span> open {c.opportunities === 1 ? "role" : "roles"}
                <span className="mx-2 text-ink-4">·</span>
                <span className="font-medium text-ink">{c.organizations}</span> {c.organizations === 1 ? "organization" : "organizations"}
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
            </div>
          </li>
        );
      })}
      {/* Filler cells keep the hairline grid even when the count doesn't fill the last row. */}
      {Array.from({ length: Math.max((3 - (lines.length % 3)) % 3, lines.length % 2) }).map((_, i) => (
        <li
          key={`fill-${i}`}
          aria-hidden
          className={cn(
            "hidden bg-surface",
            i < lines.length % 2 ? "sm:block" : "sm:hidden",
            i < (3 - (lines.length % 3)) % 3 ? "lg:block" : "lg:hidden",
          )}
        />
      ))}
    </ul>
  );
}
