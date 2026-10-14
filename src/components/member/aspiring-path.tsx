"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { AspiringDetails } from "@/lib/data/types";
import { lineName } from "@/lib/data/taxonomy";
import { cn } from "@/lib/utils/cn";

export type PathStage = AspiringDetails["stage"] | "licensed";

export const PATH_STEPS: { value: PathStage; label: string; description: string }[] = [
  { value: "exploring", label: "Exploring", description: "Learning which corners of the industry fit you." },
  { value: "studying", label: "Studying", description: "Working through pre-licensing education." },
  { value: "exam_scheduled", label: "Exam scheduled", description: "A test date is on the calendar." },
  { value: "exam_passed", label: "Exam passed", description: "Completing your state application." },
  { value: "licensed", label: "Licensed", description: "Ready to add self-reported license records." },
];

export const ASPIRING_STAGE_LABEL: Record<AspiringDetails["stage"], string> = {
  exploring: "Exploring",
  studying: "Studying",
  exam_scheduled: "Exam scheduled",
  exam_passed: "Exam passed",
};

/** Plain-language next step for each stage. Educational only — never licensing advice. */
export function nextStepFor(stage: AspiringDetails["stage"]): { title: string; body: string; href: string; cta: string } {
  switch (stage) {
    case "exploring":
      return {
        title: "Find the area that fits you",
        body: "Compare insurance careers by day-to-day work, typical roles and skills before choosing a licensing path.",
        href: "/explore",
        cta: "Explore the industry",
      };
    case "studying":
      return {
        title: "Understand the license you're working toward",
        body: "Lines of authority and exam requirements vary by state. Confirm the details with your state department of insurance.",
        href: "/resources/understanding-lines-of-authority",
        cta: "Read the overview",
      };
    case "exam_scheduled":
      return {
        title: "Start talking to organizations that train",
        body: "Many organizations welcome candidates who are about to be licensed — and some offer licensing support.",
        href: "/opportunities",
        cta: "Browse opportunities",
      };
    case "exam_passed":
      return {
        title: "Prepare for your first 90 days",
        body: "While your state application is processed, plan how you'll learn systems, products and habits.",
        href: "/resources/first-90-days-new-producer",
        cta: "Read the guide",
      };
  }
}

/** Horizontal on desktop, vertical on mobile. */
export function AspiringStepper({ stage, className }: { stage: AspiringDetails["stage"]; className?: string }) {
  const current = PATH_STEPS.findIndex((s) => s.value === stage);
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-5 sm:gap-2", className)} aria-label="Licensing journey">
      {PATH_STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.value} className="relative flex gap-3 sm:flex-col sm:gap-2.5" aria-current={active ? "step" : undefined}>
            {/* connector */}
            {i < PATH_STEPS.length - 1 && (
              <span aria-hidden className={cn("absolute left-[13px] top-7 h-[calc(100%-4px)] w-px sm:left-7 sm:top-[13px] sm:h-px sm:w-[calc(100%-20px)]", done ? "bg-navy" : "bg-line-strong")} />
            )}
            <span
              className={cn(
                "relative z-[1] flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold tabular-nums ring-4 ring-surface",
                done ? "bg-navy text-white" : active ? "border-2 border-navy bg-surface text-navy" : "border border-line-strong bg-surface text-ink-4",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span className="min-w-0 pb-1 sm:pr-2">
              <span className={cn("block text-[13px] font-medium", active ? "text-ink" : done ? "text-ink-2" : "text-ink-3")}>
                {s.label}
                {active && <span className="sr-only"> (current step)</span>}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{s.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AspiringNextStep({ details }: { details: AspiringDetails }) {
  const next = nextStepFor(details.stage);
  return (
    <div className="rounded-xl border border-line bg-subtle/60 p-4">
      <div className="eyebrow mb-1.5 text-gold-ink">Suggested next step</div>
      <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{next.title}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{next.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={next.href} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
          {next.cta} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {details.targetLines.slice(0, 3).map((l) => (
          <Link key={l} href={`/explore/${l}`} className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
            {lineName(l)}
          </Link>
        ))}
      </div>
    </div>
  );
}
