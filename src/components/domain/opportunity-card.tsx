"use client";

import Link from "next/link";
import { GraduationCap, MapPin, Clock3 } from "lucide-react";
import type { Opportunity, Organization } from "@/lib/data/types";
import { OrgLogo } from "@/components/brand/org-logo";
import { Tag } from "@/components/ui/badge";
import { SponsoredTag } from "@/components/ui/feedback";
import { KindBadge } from "./badges";
import { SaveButton } from "./save-button";
import { ARRANGEMENT_LABEL, ENGAGEMENT_LABEL, EXPERIENCE_LABEL, lineName, stateName } from "@/lib/data/taxonomy";
import { compensationLabel } from "@/lib/utils/format";
import { relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export function opportunityLocation(o: Opportunity) {
  if (o.state === "US") return o.arrangement === "remote" ? "Remote · Multi-state" : "Multi-state";
  return o.city ? `${o.city}, ${o.state}` : stateName(o.state);
}

/** Primary marketplace card. Full-card link with an independent save action. */
export function OpportunityCard({ o, org, sponsored, className, compact }: { o: Opportunity; org?: Organization; sponsored?: boolean; className?: string; compact?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-6",
        sponsored ? "border-gold-200 bg-[linear-gradient(180deg,var(--color-gold-50),var(--color-surface)_45%)]" : "border-line hover:border-line-strong",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {org && <OrgLogo brand={org.brand} name={org.name} size={44} />}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {org && <span className="truncate text-[13px] text-ink-3">{org.name}</span>}
            {sponsored && <SponsoredTag />}
          </div>
          <h3 className="text-[16.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/opportunities/${o.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {o.title}
            </Link>
          </h3>
        </div>
        <SaveButton targetId={o.id} className="-mr-2 -mt-1" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-3">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{opportunityLocation(o)}</span>
        <span>{ARRANGEMENT_LABEL[o.arrangement]}</span>
        <span>{ENGAGEMENT_LABEL[o.engagement]}</span>
        <span>{EXPERIENCE_LABEL[o.experienceLevel]}</span>
      </div>

      {!compact && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">{o.summary}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <KindBadge kind={o.kind} />
        {o.lines.slice(0, compact ? 1 : 2).map((l) => <Tag key={l}>{lineName(l)}</Tag>)}
        {o.trainingProvided && (
          <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-0.5 text-xs text-ink-2"><GraduationCap className="h-3.5 w-3.5" />Training</span>
        )}
      </div>

      <div className="mt-auto pt-5">
      <div className="flex items-end justify-between gap-3 border-t border-line pt-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">Compensation as disclosed</div>
          <div className="mt-0.5 truncate text-[13.5px] font-medium text-ink">{compensationLabel(o.compensation)}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-ink-4" suppressHydrationWarning>
          <Clock3 className="h-3.5 w-3.5" />{o.postedAt ? relativeDay(o.postedAt) : "—"}
        </div>
      </div>
      </div>
    </article>
  );
}
