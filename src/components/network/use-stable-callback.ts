"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Returns a callback with a stable identity that always calls the latest `fn`.
 * The shared Dialog re-runs its focus-management effect whenever `onClose`
 * changes identity, so dialogs here always receive a stable close handler.
 */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
