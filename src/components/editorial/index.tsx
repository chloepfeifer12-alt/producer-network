import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Small uppercase label with a hairline rule — the editorial section opener. */
export function Kicker({ children, className, rule = true }: { children: ReactNode; className?: string; rule?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3", className)}>
      <span className="shrink-0">{children}</span>
      {rule && <span className="h-px flex-1 bg-line" aria-hidden />}
    </div>
  );
}

export function SectionHead({
  kicker,
  title,
  dek,
  href,
  linkLabel = "See all",
  className,
  size = "md",
}: {
  kicker?: ReactNode;
  title: ReactNode;
  dek?: ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={cn("mb-7", className)}>
      {kicker && <Kicker className="mb-4">{kicker}</Kicker>}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className={cn("font-display leading-[1.08] tracking-[-0.015em] text-ink", size === "lg" ? "text-[34px] sm:text-[44px]" : size === "sm" ? "text-[22px] sm:text-[24px]" : "text-[28px] sm:text-[34px]")}>{title}</h2>
          {dek && <p className="mt-2.5 text-[15px] leading-relaxed text-ink-3">{dek}</p>}
        </div>
        {href && (
          <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
            {linkLabel} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Rule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}

export function PullQuote({ children, cite, className }: { children: ReactNode; cite?: ReactNode; className?: string }) {
  return (
    <figure className={cn("border-l-2 border-ink pl-6", className)}>
      <blockquote className="font-display text-[24px] italic leading-[1.3] text-ink sm:text-[28px]">{children}</blockquote>
      {cite && <figcaption className="mt-3 text-[13px] text-ink-3">{cite}</figcaption>}
    </figure>
  );
}

export function ByLine({ name, role, meta, className }: { name: ReactNode; role?: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[12.5px] text-ink-3", className)}>
      <span className="font-medium text-ink-2">{name}</span>
      {role && <span> · {role}</span>}
      {meta && <span> · {meta}</span>}
    </div>
  );
}
