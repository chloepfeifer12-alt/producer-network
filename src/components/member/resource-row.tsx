"use client";

import Link from "next/link";
import { BookmarkCheck, BookOpen, ChevronRight } from "lucide-react";
import type { Resource } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { RESOURCE_KIND_LABEL } from "./utils";

/** Compact list row for a resource. Optional unsave action sits above the full-row link. */
export function ResourceRow({ resource, onUnsave, compact, className }: { resource: Resource; onUnsave?: () => void; compact?: boolean; className?: string }) {
  return (
    <li className={cn("group relative flex items-start gap-3.5 transition hover:bg-subtle/50", compact ? "px-5 py-3.5 sm:px-6" : "px-5 py-5 sm:px-6", className)}>
      <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-3 ring-1 ring-line", compact ? "h-8 w-8" : "h-10 w-10")}>
        <BookOpen className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <Badge tone="neutral">{RESOURCE_KIND_LABEL[resource.kind]}</Badge>
          <span>{resource.minutes} min</span>
        </div>
        <h3 className={cn("font-medium leading-snug tracking-[-0.005em] text-ink", compact ? "text-[13.5px]" : "text-[15px]")}>
          <Link href={`/resources/${resource.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {resource.title}
          </Link>
        </h3>
        {!compact && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{resource.summary}</p>}
      </div>
      {onUnsave ? (
        <button
          type="button"
          onClick={onUnsave}
          aria-pressed
          aria-label={`Remove “${resource.title}” from saved`}
          title="Remove from saved"
          className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy transition hover:bg-navy-100"
        >
          <BookmarkCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      ) : (
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5" />
      )}
    </li>
  );
}
