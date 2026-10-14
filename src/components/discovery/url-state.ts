"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

export type ParamValue = string | string[] | boolean | null | undefined;

/**
 * Keeps discovery filters in the URL so every search is shareable.
 * Must be used beneath a <Suspense> boundary (useSearchParams).
 */
export function useUrlParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (patch: Record<string, ParamValue>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, v] of Object.entries(patch)) {
        if (v == null || v === false || v === "" || (Array.isArray(v) && v.length === 0)) next.delete(key);
        else next.set(key, Array.isArray(v) ? v.join(",") : v === true ? "1" : v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );

  const clear = useCallback(
    (keep: string[] = []) => {
      const next = new URLSearchParams();
      for (const k of keep) {
        const v = params.get(k);
        if (v) next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );

  return { params, update, clear };
}

/** Reads a comma-separated list param, keeping only known values. */
export function readList<T extends string>(params: ReadonlyURLSearchParams | URLSearchParams, key: string, allowed: readonly T[]): T[] {
  const raw = params.get(key);
  if (!raw) return [];
  const set = new Set<string>(allowed);
  return Array.from(new Set(raw.split(",").filter((v) => set.has(v)))) as T[];
}

export function readFlag(params: ReadonlyURLSearchParams | URLSearchParams, key: string) {
  return params.get(key) === "1";
}

/**
 * Local text state for a search box that commits to the URL after a pause.
 * External URL changes (e.g. "Clear all") flow back into the field.
 */
export function useDebouncedParam(urlValue: string, commit: (v: string) => void, delay = 250) {
  const [value, setValue] = useState(urlValue);
  const committed = useRef(urlValue);

  useEffect(() => {
    if (urlValue !== committed.current) {
      committed.current = urlValue;
      setValue(urlValue);
    }
  }, [urlValue]);

  useEffect(() => {
    if (value === committed.current) return;
    const t = setTimeout(() => {
      committed.current = value;
      commit(value);
    }, delay);
    return () => clearTimeout(t);
  }, [value, commit, delay]);

  const flush = useCallback(() => {
    committed.current = value;
    commit(value);
  }, [value, commit]);

  return [value, setValue, flush] as const;
}

/** Local form state that re-syncs whenever the URL value changes (submit-to-apply fields). */
export function useSyncedState<T>(urlValue: T) {
  const [value, setValue] = useState(urlValue);
  const [prev, setPrev] = useState(urlValue);
  if (prev !== urlValue) {
    setPrev(urlValue);
    setValue(urlValue);
  }
  return [value, setValue] as const;
}
