"use client";

import { cn } from "@/lib/utils/cn";

/** Single-select filter chips with an "All" option (null value). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  allLabel = "All",
  ariaLabel,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T | null;
  onChange: (v: T | null) => void;
  allLabel?: string;
  ariaLabel: string;
  className?: string;
}) {
  const items: { value: T | null; label: string; count?: number }[] = [{ value: null, label: allLabel }, ...options];
  return (
    <div role="group" aria-label={ariaLabel} className={cn("scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0", className)}>
      {items.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value ?? "__all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-100",
              active ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
            )}
          >
            {o.label}
            {o.count != null && <span className={cn("text-[11px] tabular-nums", active ? "text-white/70" : "text-ink-4")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
