"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import type { LineSlug, Sector } from "@/lib/data/types";
import { LINES_BY_SECTOR, SECTOR_LABEL } from "@/lib/data/taxonomy";
import { Popover } from "@/components/ui/menu";
import { LineIcon } from "@/components/ui/line-icon";
import { cn } from "@/lib/utils/cn";

/** Collapsible group inside a filter rail. */
export function FilterSection({
  title,
  activeCount = 0,
  children,
  defaultOpen = true,
}: {
  title: string;
  activeCount?: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || activeCount > 0);
  const id = useId();
  return (
    <section className="border-b border-line py-4 last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-md text-left text-[13px] font-semibold text-ink"
        >
          <span className="flex items-center gap-2">
            {title}
            {activeCount > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-navy px-1 text-[10.5px] font-semibold tabular-nums text-white">
                {activeCount}
              </span>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-ink-4 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
        </button>
      </h3>
      {open && (
        <div id={id} className="mt-3">
          {children}
        </div>
      )}
    </section>
  );
}

export interface FacetOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  description?: string;
  icon?: ReactNode;
}

/** Checkbox list with optional live counts and "show more". */
export function FacetList<T extends string>({
  options,
  value,
  onChange,
  limit,
  ariaLabel,
}: {
  options: FacetOption<T>[];
  value: T[];
  onChange: (v: T[]) => void;
  limit?: number;
  ariaLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const base = useId();
  const hiddenSelected = limit ? options.slice(limit).some((o) => value.includes(o.value)) : false;
  const shown = limit && !expanded && !hiddenSelected ? options.slice(0, limit) : options;
  return (
    <div role="group" aria-label={ariaLabel}>
      <ul className="space-y-0.5">
        {shown.map((o) => {
          const checked = value.includes(o.value);
          const id = `${base}-${o.value}`;
          const empty = o.count === 0 && !checked;
          return (
            <li key={o.value}>
              <label
                htmlFor={id}
                className={cn(
                  "group -mx-2 flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-subtle",
                  empty && "opacity-55",
                )}
              >
                <span className="relative mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center">
                  <input
                    id={id}
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={() => onChange(checked ? value.filter((v) => v !== o.value) : [...value, o.value])}
                  />
                  <span className="absolute inset-0 rounded-[4px] border border-line-strong bg-surface transition peer-checked:border-navy peer-checked:bg-navy peer-focus-visible:ring-4 peer-focus-visible:ring-navy-100" />
                  <Check className="relative h-2.5 w-2.5 text-white opacity-0 transition peer-checked:opacity-100" strokeWidth={3.5} />
                </span>
                {o.icon && <span className="mt-[1px] text-ink-4 group-hover:text-ink-3">{o.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[13.5px] leading-snug", checked ? "font-medium text-ink" : "text-ink-2")}>{o.label}</span>
                  {o.description && <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{o.description}</span>}
                </span>
                {o.count != null && <span className="mt-[1px] shrink-0 text-xs tabular-nums text-ink-4">{o.count}</span>}
              </label>
            </li>
          );
        })}
      </ul>
      {limit != null && options.length > limit && !hiddenSelected && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 rounded text-[12.5px] font-medium text-navy-600 hover:text-navy"
          aria-expanded={expanded}
        >
          {expanded ? "Show fewer" : `Show all ${options.length}`}
        </button>
      )}
    </div>
  );
}

/** A single on/off filter rendered as a pressed-state pill row. */
export function FilterToggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition",
        checked ? "border-navy-200 bg-navy-50" : "border-line bg-surface hover:border-line-strong",
      )}
    >
      <span className="min-w-0">
        <span className={cn("block text-[13.5px]", checked ? "font-medium text-navy" : "text-ink-2")}>{label}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{description}</span>}
      </span>
      <span className={cn("relative mt-0.5 inline-flex h-5 w-8 shrink-0 items-center rounded-full transition", checked ? "bg-navy" : "bg-line-strong")} aria-hidden>
        <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition", checked ? "translate-x-[14px]" : "translate-x-0.5")} />
      </span>
    </button>
  );
}

export interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ActiveFilterChips({ chips, onClearAll, className }: { chips: ActiveChip[]; onClearAll: () => void; className?: string }) {
  if (!chips.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label="Active filters">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-navy-50 py-1 pl-3 pr-2 text-[12.5px] text-navy-700 transition hover:border-navy-200 hover:bg-navy-100"
          aria-label={`Remove filter: ${c.label}`}
        >
          {c.label}
          <X className="h-3 w-3 text-navy-400 group-hover:text-navy" strokeWidth={2.25} />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="ml-1 rounded px-1.5 py-1 text-[12.5px] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline">
        Clear all
      </button>
    </div>
  );
}

/** Large search field used in discovery headers. Uncontrolled-friendly with local state. */
export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  label,
  className,
  size = "lg",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  label: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const id = useId();
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-4", size === "lg" ? "left-4 h-[18px] w-[18px]" : "left-3 h-4 w-4")} strokeWidth={1.75} />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "w-full rounded-xl border border-line-strong bg-surface text-ink shadow-card placeholder:text-ink-4 transition focus:border-navy-400 focus:outline-none focus:ring-4 focus:ring-navy-100 [&::-webkit-search-cancel-button]:hidden",
          size === "lg" ? "h-[52px] pl-11 pr-11 text-[15px]" : "h-10 pl-9 pr-9 text-sm",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
          }}
          className={cn("absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-4 hover:bg-sunken hover:text-ink", size === "lg" ? "right-3" : "right-2")}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Job-site style controls                                             */
/* ------------------------------------------------------------------ */

const pillBase =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-100";

/** Compact pill that opens a popover of filter options. */
export function FilterPill({
  label,
  count = 0,
  children,
  onClear,
  width = 300,
}: {
  label: string;
  count?: number;
  children: ReactNode;
  onClear?: () => void;
  width?: number;
}) {
  return (
    <Popover
      align="left"
      label={`${label} filter`}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            pillBase,
            count > 0 ? "border-navy bg-navy-50 font-medium text-navy" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
            open && "ring-4 ring-navy-100",
          )}
        >
          {label}
          {count > 0 && (
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-navy px-1 text-[10.5px] font-semibold tabular-nums text-white">
              {count}
            </span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")} strokeWidth={2} />
        </button>
      )}
    >
      {(close) => (
        <div style={{ width: `min(${width}px, calc(100vw - 2rem))` }}>
          <div className="max-h-[min(420px,60vh)] overflow-y-auto p-4">{children}</div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <button
              type="button"
              onClick={() => onClear?.()}
              disabled={!count}
              className="rounded text-[12.5px] font-medium text-ink-3 hover:text-ink disabled:opacity-40"
            >
              Clear
            </button>
            <button type="button" onClick={close} className="rounded-md bg-ink px-3 py-1 text-[12.5px] font-medium text-white hover:bg-[#2a2d35]">
              Done
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

/** Single on/off pill (e.g. "Training provided"). */
export function TogglePill({ label, pressed, onChange, icon }: { label: string; pressed: boolean; onChange: (v: boolean) => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={cn(pillBase, pressed ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink")}
    >
      {pressed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : icon}
      {label}
    </button>
  );
}

/** Category facet grouped under Insurance / Financial services headings. */
export function GroupedLineFacet({ value, onChange, count }: { value: LineSlug[]; onChange: (v: LineSlug[]) => void; count?: (slug: LineSlug) => number }) {
  return (
    <div className="space-y-4">
      {(Object.keys(LINES_BY_SECTOR) as Sector[]).map((sector) => (
        <div key={sector}>
          <div className="eyebrow mb-1.5">{SECTOR_LABEL[sector]}</div>
          <FacetList
            ariaLabel={`${SECTOR_LABEL[sector]} categories`}
            options={LINES_BY_SECTOR[sector].map((l) => ({
              value: l.slug,
              label: l.name,
              count: count?.(l.slug),
              icon: <LineIcon line={l.slug} className="h-3.5 w-3.5" />,
            }))}
            value={value.filter((v) => LINES_BY_SECTOR[sector].some((l) => l.slug === v))}
            onChange={(next) => onChange([...value.filter((v) => !LINES_BY_SECTOR[sector].some((l) => l.slug === v)), ...next])}
          />
        </div>
      ))}
    </div>
  );
}

/** Two-field "What / Where" search bar, job-site style. */
export function WhatWhereSearch({
  what,
  onWhat,
  where,
  onWhere,
  whereOptions,
  onSubmit,
  whatLabel,
  whatPlaceholder,
  whereLabel = "Where",
}: {
  what: string;
  onWhat: (v: string) => void;
  where: string;
  onWhere: (v: string) => void;
  whereOptions: { value: string; label: string }[];
  onSubmit: () => void;
  whatLabel: string;
  whatPlaceholder: string;
  whereLabel?: string;
}) {
  const whatId = useId();
  const whereId = useId();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-2 rounded-2xl border border-line-strong bg-surface p-2 shadow-lift md:flex-row md:items-stretch md:gap-0"
    >
      <div className="relative flex min-w-0 flex-[1.5] items-center">
        <label htmlFor={whatId} className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">
          What
        </label>
        <Search className="pointer-events-none absolute left-4 top-[30px] h-4 w-4 text-ink-4" strokeWidth={1.75} />
        <input
          id={whatId}
          type="search"
          value={what}
          onChange={(e) => onWhat(e.target.value)}
          placeholder={whatPlaceholder}
          aria-label={whatLabel}
          autoComplete="off"
          className="h-[58px] w-full rounded-xl bg-transparent pb-1.5 pl-10 pr-9 pt-6 text-[15px] text-ink placeholder:text-ink-4 focus:bg-subtle/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {what && (
          <button type="button" onClick={() => onWhat("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-4 hover:bg-sunken hover:text-ink" aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="hidden w-px self-stretch bg-line md:my-2 md:block" aria-hidden />
      <div className="relative flex min-w-0 flex-1 items-center">
        <label htmlFor={whereId} className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">
          {whereLabel}
        </label>
        <MapPin className="pointer-events-none absolute left-4 top-[30px] h-4 w-4 text-ink-4" strokeWidth={1.75} />
        <select
          id={whereId}
          value={where}
          onChange={(e) => onWhere(e.target.value)}
          className="h-[58px] w-full appearance-none rounded-xl bg-transparent pb-1.5 pl-10 pr-9 pt-6 text-[15px] text-ink focus:bg-subtle/60 focus:outline-none"
        >
          {whereOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-[30px] h-4 w-4 text-ink-4" />
      </div>
      <button
        type="submit"
        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-navy px-7 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition hover:bg-navy-600 md:ml-2 md:h-auto"
      >
        <Search className="h-4 w-4" strokeWidth={2} />
        Search
      </button>
    </form>
  );
}
