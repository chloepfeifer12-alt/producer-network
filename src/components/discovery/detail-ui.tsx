"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Container } from "@/components/ui/page";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** A titled content section on detail pages. Anchorable via `id`. */
export function DetailSection({ id, title, eyebrow, children, className, action }: { id: string; title: string; eyebrow?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-32 border-t border-line pt-8", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h2 id={`${id}-title`} className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Bulleted list with a hairline marker, used for responsibilities/requirements. */
export function DetailList({ items, marker = "dot" }: { items: string[]; marker?: "dot" | "number" }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-2">
          {marker === "number" ? (
            <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold tabular-nums text-ink-3 ring-1 ring-line">{i + 1}</span>
          ) : (
            <span aria-hidden className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          )}
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Small labelled fact tile. */
export function FactTile({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-ink-4">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-[14px] font-medium leading-snug text-ink">{value}</div>
      {hint && <div className="mt-1 text-[12px] leading-snug text-ink-3">{hint}</div>}
    </div>
  );
}

/** Full-page "not available" state for missing or non-public records. */
export function Unavailable({ title, body, backHref, backLabel, secondary }: { title: string; body: string; backHref: string; backLabel: string; secondary?: { href: string; label: string } }) {
  return (
    <Container size="narrow" className="flex min-h-[60vh] flex-col justify-center py-20">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink-3 ring-1 ring-line">
        <SearchX className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h1 className="font-display text-[34px] leading-tight text-ink">{title}</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-3">{body}</p>
      <div className="mt-7 flex flex-wrap gap-2">
        <Link href={backHref} className={buttonClass("primary")}>
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        {secondary && (
          <Link href={secondary.href} className={buttonClass("secondary")}>
            {secondary.label}
          </Link>
        )}
      </div>
    </Container>
  );
}

/** Tracks which section id is currently in view (for in-page navigation). */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");
  useEffect(() => {
    const els = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        const first = els.find((el) => visible.has(el.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [key]);
  return active;
}
