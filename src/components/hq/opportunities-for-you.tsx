"use client";

import Link from "next/link";
import { Check, MapPin } from "lucide-react";
import { OrgLogo } from "@/components/brand/org-logo";
import { SectionHead } from "@/components/editorial";
import { BareHead } from "./calm";
import { KindBadge } from "@/components/domain/badges";
import { SaveButton } from "@/components/domain/save-button";
import { opportunityLocation } from "@/components/domain/opportunity-card";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { ARRANGEMENT_LABEL } from "@/lib/data/taxonomy";
import { compensationLabel } from "@/lib/utils/format";
import { relativeDay } from "@/lib/utils/dates";
import type { OppPick } from "./hq-data";

function OppRow({ pick }: { pick: OppPick }) {
  const o = pick.opportunity;
  return (
    <li className="group relative py-6 first:pt-0">
      <div className="flex items-start gap-4">
        {pick.org && <OrgLogo brand={pick.org.brand} name={pick.org.name} size={40} className="mt-0.5 hidden sm:flex" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-3">
            {pick.org && <span className="font-medium text-ink-2">{pick.org.name}</span>}
            <span className="text-ink-4">·</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden />{opportunityLocation(o)}</span>
            <span className="text-ink-4">·</span>
            <span>{ARRANGEMENT_LABEL[o.arrangement]}</span>
            {o.postedAt && (
              <>
                <span className="text-ink-4">·</span>
                <span className="text-ink-4">{relativeDay(o.postedAt)}</span>
              </>
            )}
          </div>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/opportunities/${o.slug}`} className="decoration-1 underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none">
              {o.title}
            </Link>
          </h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <KindBadge kind={o.kind} />
            <span className="text-[13px] text-ink-2">
              <span className="text-ink-4">As disclosed: </span>
              {compensationLabel(o.compensation)}
            </span>
          </div>
          {pick.reasons.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3" aria-label="Why this is recommended">
              {pick.fitLabel && <li className="font-medium text-navy-600">{pick.fitLabel}</li>}
              {pick.reasons.map((r) => (
                <li key={r} className="inline-flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-navy-400" strokeWidth={2.25} aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
        <SaveButton targetId={o.id} className="-mr-2 -mt-1 shrink-0" />
      </div>
    </li>
  );
}

export function OpportunitiesForYou({ picks, title, dek, usesFit, bare }: { picks: OppPick[]; title: string; dek: string; usesFit: boolean; bare?: boolean }) {
  return (
    <section aria-label="Opportunities for you">
      {bare ? <BareHead dek={dek} href="/opportunities" label="All opportunities" /> : <SectionHead kicker="Opportunities" title={title} dek={dek} href="/opportunities" linkLabel="All opportunities" size="sm" />}
      {picks.length ? (
        <>
          <ul className="divide-y divide-line border-b border-line">
            {picks.map((p) => <OppRow key={p.opportunity.id} pick={p} />)}
          </ul>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-4">
            {usesFit ? "Ranked by your Industry Fit answers" : "Ranked by your specialties, preferences and licensed states"} — transparent rules, no paid placement. Compensation is shown exactly as each organization disclosed it; results vary by individual.
          </p>
        </>
      ) : (
        <EmptyState
          compact
          title="Nothing new matches your profile yet"
          description="Add specialties and preferences to your profile, or browse every open role."
          action={<ButtonLink href="/opportunities" variant="secondary" size="sm">Browse opportunities</ButtonLink>}
        />
      )}
    </section>
  );
}
