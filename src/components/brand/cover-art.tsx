import { hashString, seeded } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type CoverVariant = "arcs" | "grid" | "contour" | "orbit" | "stripes" | "blocks";

/**
 * Deterministic editorial cover art. Quiet geometric compositions drawn from a
 * subject's own palette — used instead of stock photography or generated imagery.
 */
export function CoverArt({
  seed,
  variant,
  hue,
  ground,
  className,
  label,
}: {
  seed: string;
  variant: CoverVariant;
  hue: string;
  ground: string;
  className?: string;
  label?: string;
}) {
  const r = seeded(hashString(seed) + 11);
  const W = 400;
  const H = 260;
  const shapes: React.ReactNode[] = [];

  switch (variant) {
    case "arcs": {
      const cx = r() > 0.5 ? W : 0;
      const cy = H;
      for (let i = 1; i <= 11; i++) {
        const rad = i * 34;
        shapes.push(<circle key={i} cx={cx} cy={cy} r={rad} fill="none" stroke={hue} strokeOpacity={0.12 + (i % 3) * 0.12} strokeWidth={i % 4 === 0 ? 10 : 1.4} />);
      }
      shapes.push(<circle key="sun" cx={cx === 0 ? W - 90 : 90} cy={70} r={26} fill={hue} fillOpacity={0.85} />);
      break;
    }
    case "grid": {
      const n = 10;
      const s = W / n;
      for (let x = 0; x < n; x++)
        for (let y = 0; y < Math.ceil(H / s); y++) {
          const v = r();
          if (v > 0.72) shapes.push(<rect key={`${x}-${y}`} x={x * s + 4} y={y * s + 4} width={s - 8} height={s - 8} fill={hue} fillOpacity={v > 0.9 ? 0.85 : 0.18} />);
          else shapes.push(<circle key={`${x}-${y}`} cx={x * s + s / 2} cy={y * s + s / 2} r={1.6} fill={hue} fillOpacity={0.35} />);
        }
      break;
    }
    case "contour": {
      const amp = 10 + r() * 14;
      for (let i = 0; i < 16; i++) {
        const y0 = 14 + i * 16;
        const ph = r() * Math.PI * 2;
        let d = `M0 ${y0}`;
        for (let x = 0; x <= W; x += 10) d += ` L${x} ${(y0 + Math.sin(x / 55 + ph + i * 0.3) * amp * (0.4 + (i % 5) / 6)).toFixed(1)}`;
        shapes.push(<path key={i} d={d} fill="none" stroke={hue} strokeOpacity={i === 9 ? 0.9 : 0.22} strokeWidth={i === 9 ? 2.5 : 1.1} />);
      }
      break;
    }
    case "orbit": {
      const cx = W * (0.35 + r() * 0.3);
      const cy = H * 0.55;
      [38, 72, 108, 150, 196].forEach((rad, i) => {
        shapes.push(<circle key={`o${i}`} cx={cx} cy={cy} r={rad} fill="none" stroke={hue} strokeOpacity={0.22} strokeWidth={1.2} />);
        const a = r() * Math.PI * 2;
        shapes.push(<circle key={`p${i}`} cx={cx + Math.cos(a) * rad} cy={cy + Math.sin(a) * rad} r={i === 2 ? 9 : 4.5} fill={hue} fillOpacity={i === 2 ? 0.9 : 0.6} />);
      });
      shapes.push(<circle key="core" cx={cx} cy={cy} r={16} fill={hue} fillOpacity={0.9} />);
      break;
    }
    case "stripes": {
      for (let i = -10; i < 24; i++) {
        const x = i * 26;
        shapes.push(<path key={i} d={`M${x} ${H} L${x + 140} 0 L${x + 152} 0 L${x + 12} ${H} Z`} fill={hue} fillOpacity={i % 5 === 0 ? 0.75 : 0.1} />);
      }
      break;
    }
    case "blocks": {
      const cols = [0, 120 + r() * 40, 250 + r() * 40, W];
      const rows = [0, 80 + r() * 50, H];
      cols.slice(0, -1).forEach((c, ci) =>
        rows.slice(0, -1).forEach((rw, ri) => {
          const v = r();
          shapes.push(
            <rect key={`${ci}-${ri}`} x={c + 3} y={rw + 3} width={cols[ci + 1]! - c - 6} height={rows[ri + 1]! - rw - 6} fill={hue} fillOpacity={v > 0.75 ? 0.85 : v > 0.4 ? 0.2 : 0.07} />,
          );
        }),
      );
      break;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-full w-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ background: ground }}
    >
      {shapes}
    </svg>
  );
}

/** Pick a stable variant for a subject without stored art (e.g. organizations). */
export function variantFor(seed: string): CoverVariant {
  const v: CoverVariant[] = ["arcs", "grid", "contour", "orbit", "stripes", "blocks"];
  return v[hashString(seed) % v.length]!;
}
