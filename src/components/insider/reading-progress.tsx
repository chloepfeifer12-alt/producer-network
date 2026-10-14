"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Hairline reading-progress bar pinned to the top of the viewport. Tracks how
 * far the reader is through `target`. Updates are direct (no easing) when the
 * reader prefers reduced motion.
 */
export function ReadingProgress({ target }: { target: RefObject<HTMLElement | null> }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = target.current;
      const b = bar.current;
      if (!el || !b) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const p = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total + 0.0001));
      b.style.transform = `scaleX(${rect.top > 0 ? 0 : p})`;
      b.parentElement?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target]);

  return (
    <div role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div ref={bar} style={{ transform: "scaleX(0)" }} className="h-full origin-left bg-navy motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out" />
    </div>
  );
}
