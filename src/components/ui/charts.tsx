"use client";

/**
 * Minimal, dependency-free charts.
 * Single-series, single-hue (navy) marks; recessive grid; hover crosshair +
 * tooltip; every chart has a visually-hidden table for screen readers.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SeriesPoint } from "@/lib/data/types";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

export function AreaChart({ data, height = 200, label, valueSuffix = "" }: { data: SeriesPoint[]; height?: number; label: string; valueSuffix?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = `pn-area-${useId().replace(/:/g, "")}`;
  const pad = { l: 34, r: 8, t: 10, b: 24 };
  const max = useMemo(() => niceMax(Math.max(1, ...data.map((d) => d.value))), [data]);
  const iw = Math.max(0, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length <= 1 ? 0 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${pad.t + ih}L${x(0)},${pad.t + ih}Z`;
  const ticks = [0, max / 2, max];
  const xLabels = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = e.clientX - rect.left - pad.l;
            const i = Math.round((px / iw) * (data.length - 1));
            setHover(i >= 0 && i < data.length ? i : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-navy)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-navy)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--color-ink-4)" className="tabular-nums">{Math.round(t)}</text>
            </g>
          ))}
          {xLabels.map((i) => data[i] && (
            <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="10.5" fill="var(--color-ink-4)">
              {formatDate(data[i]!.date, { month: "short", day: "numeric" })}
            </text>
          ))}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke="var(--color-navy)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover != null && data[hover] && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--color-ink-4)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(data[hover]!.value)} r={4.5} fill="var(--color-navy)" stroke="var(--color-surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hover != null && data[hover] && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lift" style={{ left: Math.min(Math.max(x(hover), 60), width - 60) }}>
          <div className="text-ink-3">{formatDate(data[hover]!.date, { month: "short", day: "numeric" })}</div>
          <div className="font-semibold tabular-nums text-ink">{data[hover]!.value}{valueSuffix}</div>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{data.map((d) => <tr key={d.date}><td>{formatDate(d.date)}</td><td>{d.value}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function ColumnChart({ data, height = 160, label }: { data: SeriesPoint[]; height?: number; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const pad = { l: 26, b: 22, t: 8 };
  const ih = height - pad.b - pad.t;
  const slot = data.length ? (width - pad.l) / data.length : 0;
  const bw = Math.max(2, slot - 2);
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
          {[0, max].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width} y1={pad.t + ih - (t / max) * ih} y2={pad.t + ih - (t / max) * ih} stroke="var(--color-line)" strokeDasharray={t ? "2 4" : undefined} />
              <text x={pad.l - 6} y={pad.t + ih - (t / max) * ih + 3.5} textAnchor="end" fontSize="10.5" fill="var(--color-ink-4)">{t}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const h = (d.value / max) * ih;
            const bx = pad.l + i * slot + 1;
            return (
              <g key={d.date} onMouseEnter={() => setHover(i)}>
                <rect x={pad.l + i * slot} y={pad.t} width={slot} height={ih} fill="transparent" />
                {d.value > 0 && <path d={`M${bx},${pad.t + ih}V${pad.t + ih - h + Math.min(3, h)}q0,-${Math.min(3, h)} ${Math.min(3, bw / 2)},-${Math.min(3, h)}H${bx + bw - Math.min(3, bw / 2)}q${Math.min(3, bw / 2)},0 ${Math.min(3, bw / 2)},${Math.min(3, h)}V${pad.t + ih}Z`} fill={hover === i ? "var(--color-navy-600)" : "var(--color-navy)"} />}
              </g>
            );
          })}
          {[0, data.length - 1].map((i) => data[i] && (
            <text key={i} x={i === 0 ? pad.l : width} y={height - 5} textAnchor={i === 0 ? "start" : "end"} fontSize="10.5" fill="var(--color-ink-4)">
              {formatDate(data[i]!.date, { month: "short", day: "numeric" })}
            </text>
          ))}
        </svg>
      )}
      {hover != null && data[hover] && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lift" style={{ left: Math.min(Math.max(pad.l + hover * slot + slot / 2, 50), width - 50) }}>
          <div className="text-ink-3">{formatDate(data[hover]!.date, { month: "short", day: "numeric" })}</div>
          <div className="font-semibold tabular-nums">{data[hover]!.value}</div>
        </div>
      )}
      <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.date}><td>{formatDate(d.date)}</td><td>{d.value}</td></tr>)}</tbody></table>
    </div>
  );
}

/** Horizontal bars with direct labels — magnitude across categories. */
export function BarList({ items, valueFormat = (v: number) => String(v), className }: { items: { label: React.ReactNode; value: number; hint?: string }[]; valueFormat?: (v: number) => string; className?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((it, idx) => (
        <li key={idx} className="group" title={it.hint}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink-2">{it.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-ink">{valueFormat(it.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-navy transition-[width] duration-500 group-hover:bg-navy-600" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({ data, width = 96, height = 28 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * width},${height - 2 - (v / max) * (height - 4)}`).join(" ");
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--color-navy-400)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
