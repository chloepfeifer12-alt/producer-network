"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { SponsoredTag } from "@/components/ui/feedback";
import { ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { cn } from "@/lib/utils/cn";
import { FollowButton } from "./follow-button";
import { employmentShort, trainingShort } from "./org-facts";

type CompareProp = { selected: boolean; onToggle: () => void };

/**
 * Calm company card for Discover, the directory and "similar companies":
 * a short, quiet art band, name, one line of context and two key facts
 * (training + model). Everything else lives on the profile.
 */
export function DiscoverOrgCard({
  org,
  openCount,
  sponsored,
  reason,
  compare,
  className,
  headingLevel = 3,
}: {
  org: Organization;
  openCount?: number;
  sponsored?: boolean;
  /** Personalization line, e.g. "Because you follow Ashgrove". Replaces the tagline. */
  reason?: ReactNode;
  compare?: CompareProp;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition duration-200",
        sponsored ? "border-gold-200" : "border-line hover:border-line-strong",
        compare?.selected && "border-navy-200 ring-2 ring-navy-100",
        className,
      )}
    >
      <div className="relative h-[88px] overflow-hidden sm:h-[104px] border-b border-line/60">
        <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} intensity={0.4} />
        {sponsored && <SponsoredTag className="absolute right-3 top-3 bg-surface/95" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-5 pb-4">
        <div className="-mt-6 mb-3 flex items-end justify-between gap-3">
          <OrgLogo brand={org.brand} name={org.name} size={44} className="relative z-[1] ring-4 ring-surface" />
          <FollowButton org={org} />
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-4">{ORG_CATEGORY_LABEL[org.category]}</div>
        <H className="mt-1 font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink">
          <Link href={`/organizations/${org.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
            {org.name}
          </Link>
        </H>
        <div className="mt-1 truncate text-[12.5px] text-ink-3">
          {org.hqCity}, {org.hqState}
          {openCount ? ` · ${openCount} open ${openCount === 1 ? "role" : "roles"}` : ""}
        </div>
        {reason ? (
          <p className="mt-3 line-clamp-1 text-[13px] leading-snug text-navy-600">{reason}</p>
        ) : (
          <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{org.tagline}</p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <dl className="flex min-w-0 items-center gap-x-1.5 text-[12.5px] text-ink-2">
              <div className="min-w-0">
                <dt className="sr-only">Training</dt>
                <dd className={cn("truncate", !org.trainingPrograms.length && "text-ink-4")}>{trainingShort(org)}</dd>
              </div>
              <div className="shrink-0 before:mr-1.5 before:text-ink-4 before:content-['·']">
                <dt className="sr-only">Model</dt>
                <dd className="inline font-medium text-ink">{employmentShort(org)}</dd>
              </div>
            </dl>
            {compare && <CompareToggle org={org} compare={compare} />}
          </div>
        </div>
      </div>
    </article>
  );
}

function CompareToggle({ org, compare, className }: { org: Organization; compare: CompareProp; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        compare.onToggle();
      }}
      aria-pressed={compare.selected}
      aria-label={compare.selected ? `Remove ${org.name} from comparison` : `Add ${org.name} to comparison`}
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium transition duration-150",
        compare.selected ? "bg-navy-50 text-navy" : "text-ink-3 hover:bg-sunken hover:text-ink",
        className,
      )}
    >
      {compare.selected ? <Check className="h-3 w-3" strokeWidth={2.75} /> : <Plus className="h-3 w-3" strokeWidth={2.5} />}
      Compare
    </button>
  );
}

/**
 * Sponsored placement as one slim, clearly labeled row — never louder than
 * organic content. Shared by /discover and the directory.
 */
export function SponsoredRow({ org, compare, className }: { org: Organization; compare?: CompareProp; className?: string }) {
  return (
    <div className={cn("group relative flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50/40 px-3 py-2.5 sm:gap-4 sm:px-4", className)}>
      <OrgLogo brand={org.brand} name={org.name} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link
            href={`/organizations/${org.slug}`}
            className="text-[14px] font-semibold text-ink after:absolute after:inset-0 after:rounded-xl hover:underline hover:underline-offset-4"
          >
            {org.name}
          </Link>
          <span className="text-[12px] text-ink-4">{ORG_CATEGORY_LABEL[org.category]}</span>
        </div>
        <p className="hidden truncate text-[12.5px] text-ink-3 sm:block">{org.tagline}</p>
      </div>
      {compare && <CompareToggle org={org} compare={compare} className="hidden sm:inline-flex" />}
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
    </div>
  );
}

/** Label line that heads a block of sponsored rows. */
export function SponsoredLabel({ id, note }: { id?: string; note: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-ink-3">
        <span id={id} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
          Sponsored · Paid placement
        </span>
        <span>{note}</span>
      </div>
      <Link href="/for-organizations#sponsored" className="text-[12px] font-medium text-gold-ink underline-offset-4 hover:underline">
        How sponsorship works
      </Link>
    </div>
  );
}

export function DiscoverOrgCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden>
      <div className="skeleton h-[104px] rounded-none" />
      <div className="px-5 pb-5">
        <div className="skeleton -mt-6 h-[44px] w-[44px] rounded-2xl ring-4 ring-surface" />
        <div className="skeleton mt-4 h-3 w-24" />
        <div className="skeleton mt-2 h-5 w-2/3" />
        <div className="skeleton mt-3 h-3 w-full" />
        <div className="skeleton mt-6 h-8 w-full" />
      </div>
    </div>
  );
}
