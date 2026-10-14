"use client";

import { useEffect } from "react";
import { STORAGE_KEY, useStore } from "@/lib/store/db-store";

/**
 * Loads persisted demo data after mount (avoids SSR/client mismatches) and
 * keeps multiple open tabs in sync — handy when demoing two roles side by side.
 */
export function StoreHydrator() {
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).finally(() => useStore.setState({ hydrated: true }));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) useStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
