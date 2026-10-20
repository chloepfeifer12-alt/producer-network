/**
 * A tiny in-memory router for the single-file preview. It keeps the current URL
 * in memory (an artifact frame can't change its own address) and uses
 * history.pushState with no URL so the browser Back button still works.
 */
import { useSyncExternalStore } from "react";

export interface Loc {
  pathname: string;
  search: string;
  hash: string;
}

const BASE = "https://preview.local";
let current: Loc = { pathname: "/", search: "", hash: "" };
const stack: Loc[] = [current];
let index = 0;
const listeners = new Set<() => void>();

function parse(href: string): Loc {
  const u = new URL(href, BASE + current.pathname + current.search);
  return { pathname: u.pathname.replace(/\/+$/, "") || "/", search: u.search, hash: u.hash };
}

function emit() {
  listeners.forEach((l) => l());
}

export function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.slice(1));
  if (!id) return false;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ block: "start" });
  return !!el;
}

export function navigate(href: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  const next = parse(href);
  const samePage = next.pathname === current.pathname && next.search === current.search;
  current = next;
  if (opts.replace) stack[index] = next;
  else {
    stack.splice(index + 1);
    stack.push(next);
    index = stack.length - 1;
    try {
      history.pushState({ pnIndex: index }, "");
    } catch {
      /* some frames refuse history; in-memory routing still works */
    }
  }
  emit();
  requestAnimationFrame(() => {
    if (next.hash) {
      // Content may still be mounting; retry briefly.
      let tries = 0;
      const tick = () => {
        if (!scrollToHash(next.hash) && tries++ < 20) setTimeout(tick, 50);
      };
      tick();
    } else if (opts.scroll !== false && !samePage) window.scrollTo(0, 0);
  });
}

export function go(delta: number) {
  const i = index + delta;
  if (i < 0 || i >= stack.length) return;
  index = i;
  current = stack[i]!;
  emit();
}

if (typeof window !== "undefined") {
  try {
    history.replaceState({ pnIndex: 0 }, "");
  } catch {
    /* ignore */
  }
  window.addEventListener("popstate", (e) => {
    const i = (e.state as { pnIndex?: number } | null)?.pnIndex;
    if (typeof i === "number" && stack[i]) {
      index = i;
      current = stack[i]!;
      emit();
    }
  });
}

export function setInitial(href: string) {
  current = parse(href);
  stack[0] = current;
}

export function getLoc() {
  return current;
}

export function useLoc(): Loc {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current,
  );
}

/** Route params for the matched page, set by the route renderer. */
export const paramsRef: { current: Record<string, string> } = { current: {} };
