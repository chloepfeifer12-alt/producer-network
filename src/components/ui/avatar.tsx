import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

/** Muted, warm avatar tones (no photos of real people are used). */
const TONES = [
  ["#E8E1D3", "#5A4A2E"],
  ["#DCE3EE", "#253A5E"],
  ["#E3E9E1", "#2F4A3A"],
  ["#EFE1DC", "#6B3426"],
  ["#E6E2EE", "#3B2F5C"],
  ["#DDEAEA", "#24525A"],
  ["#F0E6D4", "#6E5122"],
  ["#E9E3E6", "#5C3347"],
];

export function Avatar({ name, tone = 0, size = 40, className, ring }: { name: string; tone?: number; size?: number; className?: string; ring?: boolean }) {
  const [bg, fg] = TONES[Math.abs(tone) % TONES.length]!;
  return (
    <span
      role="img"
      aria-label={name}
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold", ring && "ring-2 ring-surface", className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.max(10, size * 0.36), letterSpacing: "-0.02em" }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people, size = 28, max = 4 }: { people: { name: string; tone?: number }[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} name={p.name} tone={p.tone ?? i} size={size} ring />
      ))}
      {people.length > max && (
        <span className="inline-flex items-center justify-center rounded-full bg-sunken text-[11px] font-medium text-ink-3 ring-2 ring-surface" style={{ width: size, height: size }}>
          +{people.length - max}
        </span>
      )}
    </div>
  );
}
