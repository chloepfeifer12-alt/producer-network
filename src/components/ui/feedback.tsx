import type { ReactNode } from "react";
import { CircleAlert, FlaskConical, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({ icon, title, description, action, className, compact }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 text-center", compact ? "px-6 py-8" : "px-6 py-14", className)}>
      {icon && <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-subtle text-ink-3 ring-1 ring-line">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 py-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

type NoticeTone = "info" | "warning" | "danger" | "demo";

export function Notice({ tone = "info", title, children, className, icon }: { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; className?: string; icon?: ReactNode }) {
  const styles: Record<NoticeTone, string> = {
    info: "bg-navy-50 border-navy-100 text-navy-700",
    warning: "bg-warning-50 border-warning/20 text-[#5f430d]",
    danger: "bg-danger-50 border-danger/20 text-[#6e2620]",
    demo: "bg-gold-50 border-gold-200 text-gold-ink",
  };
  const Icon = tone === "warning" ? CircleAlert : tone === "danger" ? ShieldAlert : tone === "demo" ? FlaskConical : Info;
  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed", styles[tone], className)}>
      <span className="mt-0.5 shrink-0">{icon ?? <Icon className="h-4 w-4" />}</span>
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

/** Inline marker for prototype/synthetic content. */
export function DemoTag({ children = "Demo data", className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-gold-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gold-ink ring-1 ring-inset ring-gold-200", className)}>
      <FlaskConical className="h-3 w-3" />
      {children}
    </span>
  );
}

export function SponsoredTag({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border border-gold-200 bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold-ink", className)} title="Paid placement — shown separately from organic results">
      Sponsored
    </span>
  );
}
