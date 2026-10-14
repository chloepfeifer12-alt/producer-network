"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ArrowRight, X } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { OrgLogo } from "@/components/brand/org-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MAX_COMPARE } from "@/components/discovery/compare-config";

/**
 * Session-only compare selection shared by /discover and /organizations, so a
 * company picked on the editorial front is still selected in the directory.
 * Stored in sessionStorage as a per-viewer convenience; safe when unavailable.
 */
const KEY = "pn:compare-orgs";
const EMPTY: string[] = [];
let current: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (current) return current;
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    current = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    current = [];
  }
  return current;
}

function write(next: string[]) {
  current = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: selection still works for this page view */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCompareSelection() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const c = read();
    if (c.includes(id)) return write(c.filter((x) => x !== id));
    if (c.length >= MAX_COMPARE) {
      toast(`Compare up to ${MAX_COMPARE} companies`, { body: "Remove one from the compare tray to add another.", tone: "info" });
      return;
    }
    write([...c, id]);
  }, []);
  const clear = useCallback(() => write([]), []);
  return { ids, toggle, clear, has: (id: string) => ids.includes(id) };
}

/** Floating tray listing the selected companies, with a link into the comparison. */
export function CompareTray() {
  const db = useDb();
  const { ids, toggle, clear } = useCompareSelection();
  const orgs = ids.map((id) => db.organizations.find((o) => o.id === id && o.listingStatus === "approved")).filter((o): o is Organization => !!o);
  if (!orgs.length) return null;
  const ready = orgs.length >= 2;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4" role="region" aria-label="Comparison tray">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-pop backdrop-blur animate-rise sm:flex-row sm:items-center">
        <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {orgs.map((o) => (
            <li key={o.id} className="flex items-center gap-2 rounded-xl border border-line bg-subtle py-1 pl-1 pr-1.5">
              <OrgLogo brand={o.brand} name={o.name} size={24} />
              <span className="max-w-[140px] truncate text-[12.5px] font-medium text-ink">{o.name}</span>
              <button type="button" onClick={() => toggle(o.id)} className="rounded-md p-0.5 text-ink-4 hover:bg-sunken hover:text-ink" aria-label={`Remove ${o.name} from comparison`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {Array.from({ length: MAX_COMPARE - orgs.length }).map((_, i) => (
            <li key={`empty-${i}`} className="hidden h-8 w-24 rounded-xl border border-dashed border-line-strong sm:block" aria-hidden />
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          {ready ? (
            <ButtonLink href={`/organizations/compare?ids=${orgs.map((o) => o.id).join(",")}`} size="sm" variant="accent">
              Compare {orgs.length} <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          ) : (
            <Button size="sm" variant="accent" disabled title="Select at least two companies">
              Select 1 more
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
