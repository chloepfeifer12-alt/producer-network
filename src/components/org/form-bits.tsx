"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { LineSlug, Sector } from "@/lib/data/types";
import { LINES_BY_SECTOR, SECTOR_LABEL, US_STATES } from "@/lib/data/taxonomy";
import { ChipGroup, Switch } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/** A titled editor section with an anchor id. */
export function FormSection({ id, title, description, children, aside }: { id: string; title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
    </Card>
  );
}

/** Horizontal, scrollable section index used at the top of long editors. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Sections" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto pb-1">
      {items.map((s) => (
        <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-3 transition hover:border-line-strong hover:text-ink">
          {s.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * State picker with a "Nationwide" switch. Nationwide is stored as ["ALL"],
 * matching the convention used across organizations and opportunities.
 */
export function StateMultiSelect({ value, onChange, label = "Nationwide", description, collapsedByDefault }: { value: string[]; onChange: (v: string[]) => void; label?: string; description?: string; collapsedByDefault?: boolean }) {
  const nationwide = value.includes("ALL");
  const [open, setOpen] = useState(!collapsedByDefault);
  const selected = value.filter((v) => v !== "ALL");
  return (
    <div className="space-y-3">
      <Switch checked={nationwide} onChange={(v) => onChange(v ? ["ALL"] : [])} label={label} description={description ?? "Eligible in every state where the required licenses are held."} />
      {!nationwide && (
        <div className="rounded-xl border border-line bg-subtle/50 p-3">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-[13px] text-ink-2">
            <span>
              {selected.length ? <><span className="font-medium text-ink">{selected.length}</span> selected · {selected.slice(0, 8).join(", ")}{selected.length > 8 ? "…" : ""}</> : "Choose states"}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-ink-4 transition", open && "rotate-180")} />
          </button>
          {open && (
            <div className="mt-3">
              <ChipGroup size="sm" ariaLabel="States" options={US_STATES.map((s) => ({ value: s.code, label: s.code }))} value={selected} onChange={onChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Character counter shown under text areas. */
export function CharCount({ value, min, max }: { value: string; min?: number; max?: number }) {
  const n = value.trim().length;
  const short = min != null && n < min;
  return (
    <span className={cn("text-[11.5px] tabular-nums", short ? "text-ink-4" : "text-ink-3")}>
      {n}
      {max ? ` / ${max}` : ""}
      {short ? ` · ${min - n} more needed` : ""}
    </span>
  );
}

/** Category picker grouped under "Insurance" and "Financial services". */
export function LinePicker({ value, onChange }: { value: LineSlug[]; onChange: (v: LineSlug[]) => void }) {
  return (
    <div className="space-y-3">
      {(Object.keys(LINES_BY_SECTOR) as Sector[]).map((sector) => {
        const lines = LINES_BY_SECTOR[sector];
        if (!lines.length) return null;
        const slugs = new Set<LineSlug>(lines.map((l) => l.slug));
        return (
          <div key={sector}>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">{SECTOR_LABEL[sector]}</div>
            <ChipGroup<LineSlug>
              ariaLabel={`${SECTOR_LABEL[sector]} categories`}
              size="sm"
              options={lines.map((l) => ({ value: l.slug, label: l.name }))}
              value={value.filter((v) => slugs.has(v))}
              onChange={(next) => onChange([...value.filter((v) => !slugs.has(v)), ...next])}
            />
          </div>
        );
      })}
    </div>
  );
}
