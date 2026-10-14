"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check, MapPin, Plus } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { SponsoredTag } from "@/components/ui/feedback";
import { RecruitingDot } from "@/components/domain/org-card";
import { ARRANGEMENT_LABEL, ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { cn } from "@/lib/utils/cn";
import { FollowButton } from "./follow-button";
import { LEAD_SHORT, employmentShort, placeLine, trainingShort } from "./org-facts";

/**
 * Editorial company card for Discover and the directory: cover art banner,
 * logo, key facts and independent follow / compare controls.
 */
export function DiscoverOrgCard({
  org,
  openCount,
  sponsored,
  reason,
  compare,
  className,
  headingLevel = 3,
  orientation = "vertical",
}: {
  org: Organization;
  openCount?: number;
  sponsored?: boolean;
  /** Personalization line, e.g. "Because you follow Ashgrove". */
  reason?: ReactNode;
  compare?: { selected: boolean; onToggle: () => void };
  className?: string;
  headingLevel?: 2 | 3;
  /** Horizontal cards set art beside the content (used for single wide placements). */
  orientation?: "vertical" | "horizontal";
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const row = orientation === "horizontal";
  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        row ? "flex-col sm:flex-row" : "flex-col",
        sponsored ? "border-gold-200" : "border-line hover:border-line-strong",
        compare?.selected && "border-navy-200 ring-2 ring-navy-100",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden border-line/60", row ? "aspect-[16/7] border-b sm:aspect-auto sm:w-[42%] sm:shrink-0 sm:border-b-0 sm:border-r" : "aspect-[16/7] border-b")}>
        <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} className="transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        {sponsored && <SponsoredTag className="absolute right-3 top-3 bg-surface/95" />}
        {compare && (
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
              "absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium backdrop-blur transition duration-150",
              compare.selected ? "border-navy bg-navy text-white" : "border-white/60 bg-surface/85 text-ink-2 hover:bg-surface hover:text-ink",
            )}
          >
            {compare.selected ? <Check className="h-3 w-3" strokeWidth={2.75} /> : <Plus className="h-3 w-3" strokeWidth={2.5} />}
            Compare
          </button>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col px-5 pb-4", row && "sm:px-7 sm:pb-6 sm:pt-6")}>
        <div className={cn("-mt-7 mb-3 flex items-end justify-between gap-3", row && "sm:mt-0")}>
          <OrgLogo brand={org.brand} name={org.name} size={52} className={cn("relative z-[1] ring-4 ring-surface", row && "sm:ring-0")} />
          <FollowButton org={org} />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">{ORG_CATEGORY_LABEL[org.category]}</div>
        <H className="mt-1.5 font-display text-[21px] leading-[1.15] tracking-[-0.01em] text-ink">
          <Link href={`/organizations/${org.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
            {org.name}
          </Link>
        </H>
        <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{placeLine(org)}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{org.tagline}</p>
        {reason && <p className="mt-3 border-l-2 border-navy-200 pl-2.5 text-[12.5px] leading-snug text-navy-600">{reason}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3.5">
          <Fact label="Training" value={trainingShort(org)} muted={!org.trainingPrograms.length} />
          <Fact label="Lead support" value={LEAD_SHORT[org.leadProgram.policy]} />
          <Fact label="Model" value={employmentShort(org)} />
          <Fact label="Works" value={org.arrangements.map((a) => ARRANGEMENT_LABEL[a]).join(" · ")} />
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <RecruitingDot status={org.recruitingStatus} />
          {openCount != null && (
            <span className="text-[12px] font-medium tabular-nums text-ink-2">
              {openCount ? `${openCount} open ${openCount === 1 ? "role" : "roles"}` : <span className="font-normal text-ink-4">No open roles</span>}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-4">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-[12.5px] font-medium", muted ? "text-ink-4" : "text-ink")} title={value}>
        {value}
      </dd>
    </div>
  );
}

export function DiscoverOrgCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" aria-hidden>
      <div className="skeleton aspect-[16/7] rounded-none" />
      <div className="px-5 pb-5">
        <div className="skeleton -mt-7 h-[52px] w-[52px] rounded-2xl ring-4 ring-surface" />
        <div className="skeleton mt-4 h-3 w-24" />
        <div className="skeleton mt-2 h-5 w-2/3" />
        <div className="skeleton mt-3 h-3 w-full" />
        <div className="skeleton mt-2 h-3 w-4/5" />
        <div className="skeleton mt-6 h-16 w-full" />
      </div>
    </div>
  );
}
