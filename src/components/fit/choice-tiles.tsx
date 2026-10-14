"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TileOption<T extends string> {
  value: T;
  title: string;
  body?: string;
  icon?: ReactNode;
}

function Indicator({ on, shape }: { on: boolean; shape: "radio" | "check" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-150",
        shape === "radio" ? "rounded-full" : "rounded-[6px]",
        on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface group-hover:border-ink-4",
      )}
    >
      {on && (shape === "radio" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Check className="h-3 w-3" strokeWidth={3} />)}
    </span>
  );
}

const tileBase =
  "group relative flex w-full items-start gap-4 rounded-2xl border text-left transition-[border-color,background-color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

function tileState(on: boolean) {
  return on
    ? "border-navy bg-navy-50 shadow-[inset_0_0_0_1px_var(--color-navy)]"
    : "border-line bg-surface shadow-card hover:-translate-y-px hover:border-line-strong hover:shadow-lift";
}

function Hotkey({ n }: { n: number }) {
  if (n > 9) return null;
  return (
    <span aria-hidden className="absolute bottom-3 right-3 hidden h-5 min-w-5 items-center justify-center rounded-[5px] border border-line px-1 text-[10.5px] font-medium tabular-nums text-ink-4 lg:inline-flex">
      {n}
    </span>
  );
}

/** Large single-select tiles with radio semantics and roving focus. */
export function SingleTiles<T extends string>({
  options,
  value,
  onChoose,
  label,
  columns = 2,
}: {
  options: TileOption<T>[];
  value: T | undefined;
  /** `commit` is true for a click / Enter / Space (advance), false for arrow-key moves. */
  onChoose: (v: T, commit: boolean) => void;
  label: string;
  columns?: 1 | 2;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = Math.max(0, options.findIndex((o) => o.value === value));

  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + options.length) % options.length;
    refs.current[next]?.focus();
    onChoose(options[next]!.value, false);
  };

  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2")}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === active ? 0 : -1}
            onClick={() => onChoose(o.value, true)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(tileBase, tileState(on), "min-h-[92px] p-5 sm:p-6")}
          >
            {o.icon && <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors", on ? "bg-navy text-white" : "bg-subtle text-ink-2")}>{o.icon}</span>}
            <span className="min-w-0 flex-1 pr-2">
              <span className="block text-[16.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">{o.title}</span>
              {o.body && <span className="mt-1.5 block text-[14px] leading-relaxed text-ink-3">{o.body}</span>}
            </span>
            <Indicator on={on} shape="radio" />
            <Hotkey n={i + 1} />
          </button>
        );
      })}
    </div>
  );
}

/** Large multi-select tiles (toggle buttons). */
export function MultiTiles<T extends string>({
  options,
  value,
  onChange,
  label,
  compact,
  hotkeyOffset = 0,
  className,
}: {
  options: TileOption<T>[];
  value: T[];
  onChange: (v: T[]) => void;
  label: string;
  compact?: boolean;
  hotkeyOffset?: number;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("grid gap-3", compact ? "grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2", className)}>
      {options.map((o, i) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(tileBase, tileState(on), compact ? "min-h-[64px] items-center gap-3 px-4 py-3.5" : "min-h-[92px] p-5 sm:p-6")}
          >
            {o.icon && <span className={cn("flex shrink-0 items-center justify-center rounded-xl transition-colors", compact ? "h-9 w-9" : "h-10 w-10", on ? "bg-navy text-white" : "bg-subtle text-ink-2")}>{o.icon}</span>}
            <span className="min-w-0 flex-1">
              <span className={cn("block font-semibold leading-snug tracking-[-0.01em] text-ink", compact ? "text-[14.5px]" : "text-[16.5px]")}>{o.title}</span>
              {o.body && <span className={cn("block leading-relaxed text-ink-3", compact ? "mt-0.5 line-clamp-1 text-[12.5px]" : "mt-1.5 text-[14px]")}>{o.body}</span>}
            </span>
            <Indicator on={on} shape="check" />
            {!compact && <Hotkey n={hotkeyOffset + i + 1} />}
          </button>
        );
      })}
    </div>
  );
}
