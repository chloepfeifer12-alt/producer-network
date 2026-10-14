/**
 * Demo clock.
 * Seed data is generated relative to the start of the current UTC day so that
 * server and client renders agree and the prototype always looks "current".
 */
const DAY = 86_400_000;

export function demoToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** ISO timestamp `n` days before today at the given UTC hour. */
export function daysAgo(n: number, hour = 15, minute = 0): string {
  return new Date(demoToday() - n * DAY + hour * 3_600_000 + minute * 60_000).toISOString();
}

export function daysFromNow(n: number, hour = 17, minute = 0): string {
  return daysAgo(-n, hour, minute);
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Day-granularity relative label (stable across server/client in the same day). */
export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((demoToday() - dayStart) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff >= 7 && diff < 30) return `${Math.floor(diff / 7)}w ago`;
  if (diff < 0 && diff > -2) return "Tomorrow";
  if (diff < 0 && diff > -7) return `In ${-diff} days`;
  return formatDate(iso);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " UTC";
}

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    day: d.getUTCDate(),
    weekday: d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC",
  };
}

export function isFuture(iso: string) {
  return new Date(iso).getTime() > Date.now();
}

export const DAY_MS = DAY;
