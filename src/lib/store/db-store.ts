"use client";

/**
 * Local prototype "database".
 *
 * A single Zustand store holds the synthetic database and the demo session,
 * persisted to the browser's localStorage. All mutations go through the
 * service layer (src/lib/services), which calls `commit()` below — UI code
 * never mutates the store directly. In production this module is replaced by
 * API calls backed by PostgreSQL with row-level security.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import type { Database } from "@/lib/data/types";
import { buildSeedDatabase, SCHEMA_VERSION } from "@/lib/data/seed";

export const STORAGE_KEY = "producer-network:demo-db";

interface StoreState {
  db: Database;
  sessionUserId: string | null;
  hydrated: boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (): StoreState => ({
      db: buildSeedDatabase(),
      sessionUserId: null,
      hydrated: false,
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ db: s.db, sessionUserId: s.sessionUserId }),
      // Any schema change resets demo data rather than attempting migration.
      migrate: () => ({ db: buildSeedDatabase(), sessionUserId: null }),
      merge: (persisted, current) => {
        const p = persisted as Partial<StoreState> | undefined;
        if (!p?.db || p.db.schemaVersion !== SCHEMA_VERSION) return current;
        return { ...current, db: p.db, sessionUserId: p.sessionUserId ?? null };
      },
    },
  ),
);

/** Apply an immutable update to the database. Used only by services. */
export function commit(recipe: (draft: Database) => void) {
  useStore.setState((s) => ({ db: produce(s.db, recipe) }));
}

export function getDb(): Database {
  return useStore.getState().db;
}

export function setSessionUser(userId: string | null) {
  useStore.setState({ sessionUserId: userId });
}

export function resetDemoData() {
  useStore.setState({ db: buildSeedDatabase() });
}

/* -------- React hooks -------- */

/** Whole database (stable reference until the next commit). Derive with useMemo. */
export function useDb(): Database {
  return useStore((s) => s.db);
}

export function useHydrated(): boolean {
  return useStore((s) => s.hydrated);
}

export function useSessionUserId(): string | null {
  return useStore((s) => s.sessionUserId);
}
