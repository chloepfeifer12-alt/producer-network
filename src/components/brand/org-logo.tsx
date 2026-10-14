import type { OrgBrand } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

/**
 * Generated geometric marks for FICTIONAL organizations. No real logos are
 * used anywhere in the prototype. Production would accept uploaded assets.
 */
function Mark({ mark }: { mark: OrgBrand["mark"] }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (mark) {
    case "arch":
      return <path d="M9 26V17a7 7 0 0 1 14 0v9M14 26v-8a2 2 0 0 1 4 0v8" {...s} />;
    case "circle":
      return (
        <>
          <circle cx="16" cy="16" r="8.5" {...s} />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
        </>
      );
    case "diamond":
      return (
        <>
          <path d="M16 6.5 25.5 16 16 25.5 6.5 16Z" {...s} />
          <path d="M16 11.5 20.5 16 16 20.5 11.5 16Z" fill="currentColor" />
        </>
      );
    case "stack":
      return <path d="M8 11h16M8 16h16M8 21h10" {...s} />;
    case "wave":
      return <path d="M6.5 13c3-3 6.5-3 9.5 0s6.5 3 9.5 0M6.5 19.5c3-3 6.5-3 9.5 0s6.5 3 9.5 0" {...s} />;
    case "split":
      return (
        <>
          <rect x="8" y="8" width="16" height="16" rx="3" {...s} />
          <path d="M8 24 24 8" {...s} />
        </>
      );
    case "ring":
      return (
        <>
          <circle cx="16" cy="16" r="9" {...s} />
          <path d="M16 7v6M16 19v6" {...s} />
        </>
      );
    case "chevron":
      return <path d="m9 11 7 6 7-6M9 17l7 6 7-6" {...s} />;
  }
}

export function OrgLogo({ brand, name, size = 44, className }: { brand: OrgBrand; name: string; size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${name} logo (fictional)`}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[28%] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),0_1px_2px_rgb(0_0_0/0.08)]", className)}
      style={{ width: size, height: size, background: `linear-gradient(155deg, ${brand.color} 0%, color-mix(in oklab, ${brand.color} 82%, black) 100%)` }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} aria-hidden>
        <Mark mark={brand.mark} />
      </svg>
    </span>
  );
}
