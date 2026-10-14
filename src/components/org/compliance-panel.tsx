"use client";

import { Check, CircleDashed, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ModerationFlag } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";
import { FLAG_GUIDE } from "./org-utils";

export interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
}

/**
 * Live compliance pre-check. Mirrors the platform's automated pre-screen so
 * organizations see — while typing — what would route a listing to review.
 */
export function CompliancePanel({
  flags,
  checklist,
  title = "Compliance pre-check",
  subject = "listing",
  footnote,
}: {
  flags: ModerationFlag[];
  checklist?: ChecklistItem[];
  title?: string;
  subject?: string;
  footnote?: string;
}) {
  const clear = flags.length === 0;
  const done = checklist?.filter((c) => c.ok).length ?? 0;
  return (
    <section aria-labelledby="precheck-title" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className={cn("flex items-start gap-3 border-b px-5 py-4", clear ? "border-line bg-success-50/60" : "border-warning/15 bg-warning-50/70")}>
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", clear ? "bg-surface text-success ring-success/20" : "bg-surface text-warning ring-warning/20")}>
          {clear ? <ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> : <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />}
        </span>
        <div className="min-w-0">
          <h2 id="precheck-title" className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3" aria-live="polite">
            {clear ? `No language issues detected in this ${subject}.` : `${flags.length} ${flags.length === 1 ? "item" : "items"} would route this ${subject} to human review.`}
          </p>
        </div>
      </div>

      {!clear && (
        <ul className="divide-y divide-line">
          {flags.map((f, i) => {
            const g = FLAG_GUIDE[f.code];
            return (
              <li key={`${f.code}-${i}`} className="px-5 py-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                  {g?.title ?? f.label}
                </div>
                {f.excerpt && (
                  <blockquote className="mt-2 rounded-md border-l-2 border-warning/40 bg-warning-50/60 px-2.5 py-1.5 text-[12.5px] italic leading-relaxed text-ink-2">
                    {f.excerpt}
                  </blockquote>
                )}
                {g && (
                  <div className="mt-2 space-y-1 text-[12.5px] leading-relaxed text-ink-3">
                    <p>{g.why}</p>
                    <p className="text-ink-2"><span className="font-medium">Fix: </span>{g.fix}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {checklist && checklist.length > 0 && (
        <div className="border-t border-line px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between text-[12px]">
            <span className="font-semibold uppercase tracking-[0.1em] text-ink-4">Ready to publish</span>
            <span className="tabular-nums text-ink-3">{done}/{checklist.length}</span>
          </div>
          <ul className="space-y-1.5">
            {checklist.map((c) => (
              <li key={c.key} className={cn("flex items-start gap-2 text-[12.5px] leading-snug", c.ok ? "text-ink-3" : "text-ink-2")}>
                {c.ok ? <Check className="mt-px h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.25} /> : <CircleDashed className="mt-px h-3.5 w-3.5 shrink-0 text-ink-4" />}
                <span className={cn(c.ok && "line-through decoration-ink-4/40")}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-line bg-subtle/50 px-5 py-3 text-[11.5px] leading-relaxed text-ink-4">
        {footnote ?? "Automated and rule-based. Flags route a listing to a human reviewer — nothing is auto-rejected. This is a writing aid, not legal advice."}
      </p>
    </section>
  );
}
