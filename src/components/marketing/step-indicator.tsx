import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Visible progress for multi-step onboarding wizards. */
export function StepIndicator({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <nav aria-label="Progress" className={className}>
      <p className="mb-3 text-xs text-ink-3 sm:hidden">
        Step {current + 1} of {steps.length} · <span className="font-medium text-ink">{steps[current]}</span>
      </p>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition",
                  done && "bg-navy text-white",
                  active && "bg-ink text-white ring-4 ring-navy-100",
                  !done && !active && "bg-surface text-ink-4 ring-1 ring-line-strong",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                <span className="sr-only">{done ? " (complete)" : active ? " (current)" : ""}</span>
              </span>
              <span className={cn("hidden truncate text-[13px] sm:block", active ? "font-medium text-ink" : "text-ink-3")}>{s}</span>
              {i < steps.length - 1 && <span className={cn("h-px min-w-3 flex-1", done ? "bg-navy" : "bg-line-strong")} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
