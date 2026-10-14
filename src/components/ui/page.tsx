import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({ eyebrow, title, description, actions, className, breadcrumbs }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string; breadcrumbs?: { href?: string; label: string }[] }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-3" />}
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="font-display text-[32px] leading-[1.1] text-ink sm:text-[38px]">{title}</h1>
        {description && <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Breadcrumbs({ items, className }: { items: { href?: string; label: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-[13px] text-ink-3", className)}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-4" />}
          {it.href ? (
            <Link href={it.href} className="hover:text-ink">{it.label}</Link>
          ) : (
            <span className="text-ink-2" aria-current="page">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className, align = "left" }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h2 className="font-display text-[30px] leading-[1.12] text-ink sm:text-[40px]">{title}</h2>
        {description && <p className="mt-3 text-[15.5px] leading-relaxed text-ink-3">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Container({ className, children, size = "default" }: { className?: string; children: ReactNode; size?: "default" | "narrow" | "wide" }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", size === "narrow" ? "max-w-4xl" : size === "wide" ? "max-w-[1400px]" : "max-w-7xl", className)}>{children}</div>;
}

/** Definition-list row used in detail sidebars. */
export function MetaRow({ label, children, icon }: { label: ReactNode; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon && <span className="mt-0.5 text-ink-4">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-ink-3">{label}</div>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}
