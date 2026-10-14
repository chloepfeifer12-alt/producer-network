"use client";

import type { Opportunity, Organization, SponsoredSurface } from "@/lib/data/types";
import { OrgLogo } from "@/components/brand/org-logo";
import { SponsoredTag } from "@/components/ui/feedback";
import { KindBadge } from "@/components/domain/badges";
import { ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { compensationLabel } from "@/lib/utils/format";

export const SURFACE_LABEL: Record<SponsoredSurface, string> = {
  home_featured: "Homepage · Featured",
  directory_top: "Organization directory · Top",
  search_top: "Opportunity search · Top",
  line_page: "Insurance category pages",
};

export const SURFACE_DESCRIPTION: Record<SponsoredSurface, string> = {
  home_featured: "A labeled “Featured organizations” band on the public homepage.",
  directory_top: "A labeled band above the alphabetical organization directory.",
  search_top: "A labeled band above organic opportunity search results.",
  line_page: "A labeled band on insurance category (line) pages.",
};

const PATH: Record<SponsoredSurface, string> = {
  home_featured: "/",
  directory_top: "/organizations",
  search_top: "/opportunities?q=…",
  line_page: "/explore/[line]",
};

const ORGANIC_HEADING: Record<SponsoredSurface, string> = {
  home_featured: "Explore insurance careers",
  directory_top: "All organizations · A–Z",
  search_top: "Results · ranked by relevance",
  line_page: "Open roles in this category",
};

function GhostRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5">
      <span className="h-7 w-7 shrink-0 rounded-md bg-sunken" />
      <div className="flex-1 space-y-1.5">
        <span className="block h-2 w-2/3 rounded bg-sunken" />
        <span className="block h-2 w-1/3 rounded bg-sunken/70" />
      </div>
    </div>
  );
}

/**
 * Faithful miniature of how a surface renders a sponsored placement:
 * always labeled, always in its own block, never interleaved with organic results.
 */
export function SurfacePreview({ surface, org, opportunity }: { surface: SponsoredSurface; org?: Organization; opportunity?: Opportunity }) {
  const showOpp = !!opportunity && (surface === "search_top" || surface === "line_page");
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-canvas" aria-label={`Preview of ${SURFACE_LABEL[surface]}`}>
      <div className="flex items-center gap-1.5 border-b border-line bg-subtle px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ml-2 truncate rounded bg-surface px-2 py-0.5 font-mono text-[10.5px] text-ink-3 ring-1 ring-line">{PATH[surface]}</span>
      </div>
      <div className="space-y-3 p-3 sm:p-4">
        <div className="rounded-lg border border-gold-200 bg-gold-50/60 p-2.5" aria-label="Sponsored block">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold-ink">{surface === "home_featured" ? "Featured organizations" : "Sponsored"}</span>
            <span className="text-[10px] text-ink-4">Paid placement · separate from results</span>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-gold-200 bg-surface p-2.5">
            {org ? <OrgLogo brand={org.brand} name={org.name} size={30} /> : <span className="h-[30px] w-[30px] rounded-md bg-sunken" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-[12px] text-ink-3">{org?.name ?? "Organization name"}</span>
                <SponsoredTag />
              </div>
              <div className="mt-0.5 truncate text-[13px] font-semibold text-ink">
                {showOpp ? opportunity!.title : org ? ORG_CATEGORY_LABEL[org.category] : "Listing title"}
              </div>
              {showOpp && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <KindBadge kind={opportunity!.kind} />
                  <span className="text-[11px] text-ink-3">{compensationLabel(opportunity!.compensation)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">
            {ORGANIC_HEADING[surface]}
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="space-y-1.5">
            <GhostRow />
            <GhostRow />
          </div>
        </div>
      </div>
      <figcaption className="border-t border-line bg-subtle/60 px-3 py-2 text-[11px] leading-relaxed text-ink-3">{SURFACE_DESCRIPTION[surface]} Organic ordering below is unaffected.</figcaption>
    </figure>
  );
}
