import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { TILE, type Tone } from "./palette";

/** A white sparkline for use on a coloured tile. */
function MiniArea({ data, w = 120, h = 40 }: { data: number[]; w?: number; h?: number }) {
  if (data.length < 2 || data.every((v) => v === 0)) return <svg width={w} height={h} aria-hidden><line x1="2" x2={w - 2} y1={h - 6} y2={h - 6} stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" /></svg>;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 4) + 2, h - 5 - (v / max) * (h - 12)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={`${line} L${w - 2},${h} L2,${h} Z`} fill="white" fillOpacity="0.16" />
      <path d={line} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="white" />
    </svg>
  );
}

/** A coloured headline number with its change since the period before and a little trend line. */
export function StatTile({ label, value, pct, sub, icon, tone, series, className }: { label: string; value: React.ReactNode; pct?: number | null; sub?: React.ReactNode; icon: React.ReactNode; tone: Tone; series?: number[]; className?: string }) {
  return (
    <div className={clsx("group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-card ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift", TILE[tone], className)}>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
      <span aria-hidden className="pointer-events-none absolute -bottom-14 -left-8 size-32 rounded-full bg-black/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.07em] text-white/75">{label}</p>
        <span className="flex size-8 flex-none items-center justify-center rounded-xl bg-white/15 [&>svg]:size-[17px]">{icon}</span>
      </div>
      <p className="tnum relative mt-3 font-display text-[28px] font-bold leading-none">{value}</p>
      <div className="relative mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0 text-[11.5px] leading-[1.35] text-white/80">
          {pct !== undefined && (
            <span className={clsx("mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold", pct === null ? "bg-white/15" : pct >= 0 ? "bg-white/25" : "bg-black/25")}>
              {pct === null ? <Minus className="size-3" aria-hidden /> : pct >= 0 ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
              {pct === null ? "no change data" : `${Math.abs(pct)}%`}
            </span>
          )}
          {sub && <p className="truncate">{sub}</p>}
        </div>
        {series && <MiniArea data={series} />}
      </div>
    </div>
  );
}
