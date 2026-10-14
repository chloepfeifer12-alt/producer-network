"use client";

import { ArrowRight, BriefcaseBusiness, Handshake } from "lucide-react";
import type { OpportunityKind } from "@/lib/data/types";
import { KindBadge } from "@/components/domain/badges";
import { cn } from "@/lib/utils/cn";

const COPY: Record<OpportunityKind, { title: string; body: string; points: string[]; cta: string; icon: typeof Handshake }> = {
  employment: {
    title: "Job · Employment (W-2)",
    body: "You join the organization as an employee.",
    points: ["Employer typically sets schedule and tools", "Salary or hourly pay, often with incentives", "Taxes withheld; benefits vary by employer"],
    cta: "Show only jobs",
    icon: BriefcaseBusiness,
  },
  contracting: {
    title: "Affiliation · Contracting (independent)",
    body: "You run your own practice as an independent contractor (1099).",
    points: ["You typically set your own schedule", "Usually commission-based, per carrier contracts", "You may carry costs such as licensing, E&O or leads"],
    cta: "Show only affiliations",
    icon: Handshake,
  },
};

/** Explains the two opportunity types and lets visitors filter to one. */
export function KindExplainer({ active, onPick, className }: { active: OpportunityKind[]; onPick?: (k: OpportunityKind) => void; className?: string }) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      {(Object.keys(COPY) as OpportunityKind[]).map((k) => {
        const c = COPY[k];
        const Icon = c.icon;
        const isActive = active.length === 1 && active[0] === k;
        return (
          <div
            key={k}
            className={cn(
              "flex gap-4 rounded-2xl border bg-surface p-4 shadow-card transition sm:p-5",
              isActive ? "border-navy-200 ring-1 ring-navy-100" : "border-line",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                k === "employment" ? "bg-navy-50 text-navy-600 ring-navy-100" : "bg-gold-50 text-gold-ink ring-gold-200",
              )}
              aria-hidden
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <KindBadge kind={k} />
              </div>
              <p className="mt-2 text-[13.5px] font-medium text-ink">{c.body}</p>
              <ul className="mt-1.5 space-y-0.5 text-[12.5px] leading-relaxed text-ink-3">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-4" />
                    {p}
                  </li>
                ))}
              </ul>
              {onPick && !isActive && (
                <button
                  type="button"
                  onClick={() => onPick(k)}
                  className="mt-2.5 inline-flex items-center gap-1 rounded text-[12.5px] font-medium text-navy-600 hover:text-navy"
                >
                  {c.cta} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              {isActive && <p className="mt-2.5 text-[12.5px] font-medium text-navy-600">Filtering to {c.title.split(" (")[0]}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact one-line explanation used on detail pages. */
export function kindExplanation(k: OpportunityKind) {
  return k === "employment"
    ? "This is a W-2 employment role: you would be an employee of the organization. Confirm pay, benefits and schedule in your written offer."
    : "This is an independent contracting affiliation (1099): you would operate your own practice, typically paid by commission under carrier contracts, and may carry your own business costs. Confirm all terms in writing.";
}
