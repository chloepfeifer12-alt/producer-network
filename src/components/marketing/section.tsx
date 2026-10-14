import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/page";
import { cn } from "@/lib/utils/cn";

/**
 * Editorial building blocks for the public marketing pages.
 * Server-safe (no client hooks) so pages can stay server components.
 */

export function MarketingHero({
  eyebrow,
  title,
  lede,
  actions,
  aside,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line", className)}>
      <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <Container className="relative pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
        <div className={cn("grid gap-12", aside && "lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16")}>
          <div className="max-w-3xl">
            {eyebrow && <div className="eyebrow mb-5 flex items-center gap-2.5"><span className="h-px w-6 bg-gold" aria-hidden />{eyebrow}</div>}
            <h1 className="font-display text-[40px] leading-[1.04] text-ink sm:text-[54px] lg:text-[64px]">{title}</h1>
            {lede && <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-3 sm:text-lg">{lede}</p>}
            {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
          </div>
          {aside && <div className="min-w-0">{aside}</div>}
        </div>
        {children}
      </Container>
    </section>
  );
}

export function Section({ id, tone = "canvas", className, children, size = "default" }: { id?: string; tone?: "canvas" | "surface" | "subtle"; className?: string; children: ReactNode; size?: "default" | "narrow" | "wide" }) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-16 sm:py-24",
        tone === "surface" && "border-y border-line bg-surface",
        tone === "subtle" && "border-y border-line bg-subtle",
        className,
      )}
    >
      <Container size={size}>{children}</Container>
    </section>
  );
}

export function FeatureItem({ icon, title, children, className }: { icon?: ReactNode; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      {icon && <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-navy ring-1 ring-line shadow-card">{icon}</div>}
      <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      <div className="mt-2 text-[14.5px] leading-relaxed text-ink-3">{children}</div>
    </div>
  );
}

export function CheckList({ items, className, tone = "navy" }: { items: ReactNode[]; className?: string; tone?: "navy" | "gold" | "muted" }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-2">
          <span className={cn("mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full", tone === "gold" ? "bg-gold-50 text-gold-ink ring-1 ring-gold-200" : tone === "muted" ? "bg-sunken text-ink-3" : "bg-navy-50 text-navy ring-1 ring-navy-100")}>
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </span>
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Dark closing call-to-action band. */
export function CtaBand({ eyebrow, title, body, actions, className }: { eyebrow?: ReactNode; title: ReactNode; body?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16", className)}>
      <svg className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] text-white/[0.06]" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="99" fill="none" stroke="currentColor" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" />
        <circle cx="100" cy="100" r="41" fill="none" stroke="currentColor" />
      </svg>
      <div className="relative max-w-2xl">
        {eyebrow && <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-200">{eyebrow}</div>}
        <h2 className="font-display text-[32px] leading-[1.1] sm:text-[42px]">{title}</h2>
        {body && <p className="mt-4 text-[15.5px] leading-relaxed text-white/65">{body}</p>}
      </div>
      {actions && <div className="relative mt-8 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

/** Light pill shown before a hero eyebrow or inside cards to mark editorial / demo context. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-3", className)}>{children}</span>;
}

/** Accessible, dependency-free FAQ accordion built on <details>. */
export function FaqList({ items, className }: { items: { q: string; a: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line rounded-2xl border border-line bg-surface shadow-card", className)}>
      {items.map((it) => (
        <details key={it.q} className="group px-5 sm:px-6 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[15px] font-medium text-ink">
            <span>{it.q}</span>
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-3 transition group-open:rotate-45 group-open:border-ink group-open:text-ink" aria-hidden>
              <span className="absolute h-px w-2.5 bg-current" />
              <span className="absolute h-2.5 w-px bg-current" />
            </span>
          </summary>
          <div className="-mt-1 max-w-3xl pb-5 text-[14.5px] leading-relaxed text-ink-3">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

/** Numbered principle / step used in editorial lists. */
export function NumberedItem({ n, title, children }: { n: number; title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-5 border-t border-line pt-6">
      <span className="font-display text-[28px] leading-none text-gold tabular-nums">{String(n).padStart(2, "0")}</span>
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
        <div className="mt-2 text-[14.5px] leading-relaxed text-ink-3">{children}</div>
      </div>
    </div>
  );
}
