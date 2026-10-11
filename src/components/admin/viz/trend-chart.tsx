"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { compactInr, pctDelta, sum } from "@/lib/metrics";
import { COLOR, TINT, type Tone } from "./palette";

export interface TrendMetric { key: string; label: string; tone: Tone; kind: "inr" | "int"; current: number[]; previous?: number[] }

const W = 820, H = 290, PAD_L = 50, PAD_R = 14, PAD_T = 16, PAD_B = 30;

/** Rounds a maximum up to a tidy number (1, 2, 2.5, 5 × a power of ten) so the gridlines read cleanly. */
function niceMax(v: number, floor: number): number {
  const m = Math.max(v, floor);
  const p = 10 ** Math.floor(Math.log10(m));
  for (const f of [1, 2, 2.5, 5, 10]) if (m <= f * p) return f * p;
  return 10 * p;
}

/** A smooth line through the points (Catmull-Rom turned into Béziers). */
function smooth(pts: readonly (readonly [number, number])[]): string {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

const full = (m: TrendMetric, v: number) => (m.kind === "inr" ? `₹${Math.round(v / 100).toLocaleString("en-IN")}` : v.toLocaleString("en-IN"));
const short = (m: TrendMetric, v: number) => (m.kind === "inr" ? compactInr(v) : v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : String(Math.round(v * 10) / 10));

/**
 * The main trend chart: switch between revenue, orders, sign-ups and mock attempts, hover to read any day, and see the
 * period before as a dashed line for comparison.
 */
export function TrendChart({ labels, metrics, caption }: { labels: string[]; metrics: TrendMetric[]; caption?: string }) {
  const [key, setKey] = useState(metrics[0].key);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const m = metrics.find((x) => x.key === key) ?? metrics[0];
  const n = m.current.length;
  const color = COLOR[m.tone];
  const max = niceMax(Math.max(...m.current, ...(m.previous ?? []), 0), m.kind === "inr" ? 100_000 : 4);
  const x = (i: number) => PAD_L + (n === 1 ? (W - PAD_L - PAD_R) / 2 : (i / (n - 1)) * (W - PAD_L - PAD_R));
  const y = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B);
  const pts = m.current.map((v, i) => [x(i), y(v)] as const);
  const prevPts = (m.previous ?? []).map((v, i) => [x(i), y(v)] as const);
  const line = smooth(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD_B} L${pts[0][0].toFixed(1)},${H - PAD_B} Z` : "";
  const total = sum(m.current), prevTotal = m.previous ? sum(m.previous) : 0;
  const pct = m.previous ? pctDelta(total, prevTotal) : null;
  const empty = total === 0 && prevTotal === 0;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xTicks = Array.from(new Set([0, 1, 2, 3, 4, 5].map((k) => Math.round((k / 5) * (n - 1)))));
  const gid = `trend-${m.key}`;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || n < 1) return;
    const vx = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((vx - PAD_L) / (W - PAD_L - PAD_R)) * (n - 1)))));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Metric" className="flex flex-wrap gap-1.5">
          {metrics.map((t) => (
            <button key={t.key} role="tab" aria-selected={t.key === m.key} type="button" onClick={() => { setKey(t.key); setHover(null); }}
              className={clsx("min-h-9 rounded-full px-3.5 text-[12px] font-semibold leading-none transition-colors", t.key === m.key ? `${TINT[t.tone]} ring-1 ring-current/25` : "text-ink-muted hover:bg-surface")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-right">
          <p className="tnum font-display text-[24px] font-bold leading-none text-ink">{full(m, total)}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11.5px] text-ink-faint">
            {pct !== null && <span className={clsx("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", pct >= 0 ? "bg-teal-tint text-teal" : "bg-oxblood-tint text-oxblood")}>{pct >= 0 ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}{Math.abs(pct)}%</span>}
            {caption ?? "in this period"}
          </p>
        </div>
      </div>

      <div className="relative mt-3">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${m.label} over ${n} days. Total ${full(m, total)}.`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="touch-pan-y select-none">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.32" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--color-line-soft)" strokeDasharray={t === 0 ? undefined : "3 5"} />
              <text x={PAD_L - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10.5" fill="var(--color-ink-faint)">{short(m, t)}</text>
            </g>
          ))}
          {xTicks.map((i) => <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="10.5" fill="var(--color-ink-faint)">{labels[i]}</text>)}
          {prevPts.length > 1 && <path d={smooth(prevPts)} fill="none" stroke="var(--color-ink-faint)" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="5 5" />}
          {!empty && <path d={area} fill={`url(#${gid})`} />}
          {empty ? (
            <path d={smooth(Array.from({ length: 12 }, (_, i) => [x((i / 11) * (n - 1)), y(max * (0.25 + 0.2 * Math.sin(i / 1.6) + i * 0.025))] as const))} fill="none" stroke={color} strokeOpacity="0.28" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
          ) : (
            <path d={line} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {hover !== null && !empty && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={H - PAD_B} stroke={color} strokeOpacity="0.35" />
              {m.previous && <circle cx={x(hover)} cy={y(m.previous[hover] ?? 0)} r="4" fill="var(--color-card)" stroke="var(--color-ink-faint)" strokeWidth="2" />}
              <circle cx={x(hover)} cy={y(m.current[hover])} r="5.5" fill="var(--color-card)" stroke={color} strokeWidth="3" />
            </g>
          )}
        </svg>
        {empty && <p className="pointer-events-none absolute inset-x-0 top-[38%] text-center text-[13px] font-medium text-ink-faint">Your first {m.label.toLowerCase()} will appear here</p>}
        {hover !== null && !empty && (
          <div className="pointer-events-none absolute top-2 z-10 min-w-[128px] rounded-xl border border-line bg-card px-3 py-2 text-[12px] shadow-lift" style={{ left: `${Math.min(86, Math.max(14, (x(hover) / W) * 100))}%`, transform: "translateX(-50%)" }}>
            <p className="font-semibold text-ink">{labels[hover]}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-ink-2"><span aria-hidden className="size-2 rounded-full" style={{ background: color }} />{m.label} <b className="tnum ml-auto text-ink">{full(m, m.current[hover])}</b></p>
            {m.previous && <p className="mt-0.5 flex items-center gap-1.5 text-ink-faint"><span aria-hidden className="size-2 rounded-full bg-ink-faint/60" />Before <span className="tnum ml-auto">{full(m, m.previous[hover] ?? 0)}</span></p>}
          </div>
        )}
      </div>
      <p className="mt-1 flex items-center gap-4 text-[11.5px] text-ink-faint"><span className="flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-5 rounded" style={{ background: color }} />This period</span>{m.previous && <span className="flex items-center gap-1.5"><span aria-hidden className="h-0 w-5 border-t-2 border-dashed border-ink-faint/60" />Period before</span>}</p>
    </div>
  );
}
