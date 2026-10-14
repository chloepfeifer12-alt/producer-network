import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "navy" | "gold" | "success" | "warning" | "danger" | "outline" | "ink";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-subtle text-ink-2 ring-line",
  navy: "bg-navy-50 text-navy-600 ring-navy-100",
  gold: "bg-gold-50 text-gold-ink ring-gold-200",
  success: "bg-success-50 text-success ring-success/15",
  warning: "bg-warning-50 text-warning ring-warning/15",
  danger: "bg-danger-50 text-danger ring-danger/15",
  outline: "bg-transparent text-ink-2 ring-line-strong",
  ink: "bg-ink text-white ring-ink",
};

export function Badge({ tone = "neutral", className, children, icon }: { tone?: BadgeTone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium leading-5 ring-1 ring-inset whitespace-nowrap", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Small pill for facets like specialties. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-ink-2", className)}>{children}</span>;
}

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", className)} />;
}
