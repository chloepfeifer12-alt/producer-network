import type { Compensation } from "@/lib/data/types";
import { COMP_MODEL_LABEL } from "@/lib/data/taxonomy";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function money(n: number) {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString("en-US")}`;
}

export function moneyExact(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/**
 * Renders compensation exactly as disclosed by the organization.
 * Never extrapolates, projects or "estimates" earnings.
 */
export function compensationLabel(c: Compensation): string {
  const model = COMP_MODEL_LABEL[c.model];
  if (!c.disclosed || c.min == null) return model;
  const unit = c.period === "hour" ? "/hr" : "/yr";
  const fmt = (n: number) => (c.period === "hour" ? `$${n}` : money(n));
  const range = c.max && c.max !== c.min ? `${fmt(c.min)}–${fmt(c.max)}` : fmt(c.min);
  return `${model} · ${range}${unit}`;
}

export function compactNumber(n: number) {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function pct(n: number, digits = 1) {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Deterministic pseudo-random generator for stable demo series. */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
