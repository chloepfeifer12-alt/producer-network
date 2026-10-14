"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

export function Tabs<T extends string>({ items, value, onChange, className }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("scrollbar-none -mb-px flex gap-6 overflow-x-auto border-b border-line", className)}>
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative flex shrink-0 items-center gap-2 pb-3 pt-1 text-sm transition",
            t.value === value ? "font-medium text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:rounded-full after:bg-ink" : "text-ink-3 hover:text-ink",
          )}
        >
          {t.label}
          {t.count != null && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", t.value === value ? "bg-ink text-white" : "bg-sunken text-ink-3")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function LinkTabs({ items, active, className }: { items: { href: string; label: ReactNode; count?: number }[]; active: string; className?: string }) {
  return (
    <nav className={cn("scrollbar-none -mb-px flex gap-6 overflow-x-auto border-b border-line", className)}>
      {items.map((t) => {
        const isActive = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 pb-3 pt-1 text-sm transition",
              isActive ? "font-medium text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:rounded-full after:bg-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {t.label}
            {t.count != null && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", isActive ? "bg-ink text-white" : "bg-sunken text-ink-3")}>{t.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Segmented control for compact view toggles. */
export function Segmented<T extends string>({ items, value, onChange, ariaLabel }: { items: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg border border-line bg-subtle p-0.5">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          role="radio"
          aria-checked={i.value === value}
          onClick={() => onChange(i.value)}
          className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] transition", i.value === value ? "bg-surface font-medium text-ink shadow-card" : "text-ink-3 hover:text-ink")}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
