import clsx from "clsx";

const TONE: Record<string, string> = { oxblood: "#7a1f2b", teal: "#17665f", gold: "#b07a1e", indigo: "#2b2a7a", ink: "#16130f" };

/** A circular progress ring with the value in the middle. Pure SVG, no library. */
export function ProgressRing({ value, max, label, sub, tone = "oxblood", size = 84, stroke = 8 }: { value: number; max: number; label?: React.ReactNode; sub?: string; tone?: keyof typeof TONE; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5" role="img" aria-label={`${label ?? value} of ${max}${sub ? " " + sub : ""}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE[tone]} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tnum font-display text-[19px] font-bold leading-none text-ink">{label ?? value}</span>
        </div>
      </div>
      {sub && <span className="text-center text-[11px] font-medium leading-[1.25] text-ink-muted">{sub}</span>}
    </div>
  );
}

/** A tiny trend line with a soft fill. `data` is any series of numbers. */
export function Sparkline({ data, tone = "oxblood", width = 120, height = 36, className }: { data: number[]; tone?: keyof typeof TONE; width?: number; height?: number; className?: string }) {
  if (data.length < 2) return <div className={clsx("text-[11px] text-ink-faint", className)} style={{ height }}>Not enough data yet</div>;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (width - 4) + 2, height - 4 - ((v - min) / span) * (height - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const id = `sp-${tone}-${width}-${data.length}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Trend">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TONE[tone]} stopOpacity="0.28" /><stop offset="100%" stopColor={TONE[tone]} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={TONE[tone]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.8" fill={TONE[tone]} />
    </svg>
  );
}
