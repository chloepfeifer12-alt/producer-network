"use client";

import Link from "next/link";
import { Check, GraduationCap, MapPin } from "lucide-react";
import type { Opportunity, Organization } from "@/lib/data/types";
import { ARRANGEMENT_LABEL } from "@/lib/data/taxonomy";
import { compensationLabel } from "@/lib/utils/format";
import { relativeDay } from "@/lib/utils/dates";
import { OrgLogo } from "@/components/brand/org-logo";
import { Badge } from "@/components/ui/badge";
import { KindBadge } from "@/components/domain/badges";
import { SaveButton } from "@/components/domain/save-button";
import { opportunityLocation } from "@/components/domain/opportunity-card";

/**
 * Clean, single-column job listing row (job-search style). Full-row link to
 * the opportunity, with an independent save action and optional
 * "why recommended" chips.
 */
export function JobRow({
  o,
  org,
  reasons,
  meta,
  applied,
}: {
  o: Opportunity;
  org?: Organization;
  reasons?: string[];
  /** Small trailing meta text, e.g. "Saved 3 days ago". Defaults to posted date. */
  meta?: string;
  applied?: boolean;
}) {
  return (
    <li className="group relative px-5 py-5 transition hover:bg-subtle/50 sm:px-6">
      <div className="flex items-start gap-4">
        {org && <OrgLogo brand={org.brand} name={org.name} size={44} className="hidden sm:inline-flex" />}
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/opportunities/${o.slug}`} className="after:absolute after:inset-0 group-hover:underline underline-offset-4 decoration-ink-4 focus-visible:outline-none">
              {o.title}
            </Link>
          </h3>
          <div className="mt-0.5 text-[13.5px] text-ink-2">{org?.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opportunityLocation(o)}</span>
            <span>{ARRANGEMENT_LABEL[o.arrangement]}</span>
            {o.trainingProvided && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />Training</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <KindBadge kind={o.kind} />
            <span className="rounded-md bg-subtle px-2 py-0.5 text-[12px] text-ink-2 ring-1 ring-inset ring-line" title="Compensation as disclosed by the organization">
              {compensationLabel(o.compensation)}
            </span>
            {applied && <Badge tone="success" icon={<Check className="h-3 w-3" />}>Applied</Badge>}
          </div>
          {reasons && reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Why this job</span>
              {reasons.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[11.5px] text-navy-600 ring-1 ring-inset ring-navy-100">
                  <Check className="h-3 w-3" strokeWidth={2.25} />{r}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2.5 text-xs text-ink-4" suppressHydrationWarning>{meta ?? (o.postedAt ? `Posted ${relativeDay(o.postedAt).toLowerCase()}` : "")}</div>
        </div>
        <SaveButton targetId={o.id} className="-mr-2 -mt-1" />
      </div>
    </li>
  );
}
