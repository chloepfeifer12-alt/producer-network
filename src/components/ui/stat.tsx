import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Stat({ label, value, sub, icon, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-ink-3">{label}</div>
        {icon && <div className="text-ink-4">{icon}</div>}
      </div>
      <div className="mt-2 text-[28px] font-semibold tracking-[-0.03em] tabular-nums text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "navy" }: { value: number; className?: string; tone?: "navy" | "gold" | "ink" }) {
  const color = tone === "gold" ? "bg-gold" : tone === "ink" ? "bg-ink" : "bg-navy";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 5, label }: { value: number; size?: number; stroke?: number; label?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(value)} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sunken)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-navy)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">{label ?? `${Math.round(value)}%`}</span>
    </div>
  );
}
