import clsx from "clsx";

/** Chart colours follow the theme tokens, so they re-colour in dark mode. */
const TONE: Record<string, string> = { oxblood: "var(--color-oxblood)", teal: "var(--color-teal)", gold: "var(--color-gold)", indigo: "var(--color-indigo)", ink: "var(--color-ink)" };

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

/** A radar (spider) chart for a few 0–max scores, e.g. the feedback rubric. Pure SVG. */
export function RadarChart({ labels, values, compare, max = 10, size = 260, tone = "oxblood" }: { labels: string[]; values: number[]; compare?: number[]; max?: number; size?: number; tone?: keyof typeof TONE }) {
  const n = labels.length;
  if (n < 3) return null;
  const c = size / 2, R = size / 2 - 46;
  const pt = (i: number, v: number) => { const a = (-Math.PI / 2) + (2 * Math.PI * i) / n; const r = (Math.max(0, Math.min(max, v)) / max) * R; return [c + r * Math.cos(a), c + r * Math.sin(a)] as const; };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={`Scores: ${labels.map((l, i) => `${l} ${values[i]?.toFixed(1)}`).join(", ")}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={labels.map((_, i) => pt(i, max * f).map((x) => x.toFixed(1)).join(",")).join(" ")} fill="none" stroke="var(--color-line)" strokeWidth="1" />)}
      {labels.map((_, i) => { const [x, y] = pt(i, max); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--color-line)" strokeWidth="1" />; })}
      {compare && <polygon points={poly(compare)} fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.5" strokeDasharray="4 3" />}
      <polygon points={poly(values)} fill={TONE[tone]} fillOpacity="0.16" stroke={TONE[tone]} strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r="3.4" fill={TONE[tone]} />; })}
      {labels.map((l, i) => { const [x, y] = pt(i, max * 1.2); return <text key={l} x={x} y={y} textAnchor={x < c - 4 ? "end" : x > c + 4 ? "start" : "middle"} dominantBaseline="middle" fontSize="10.5" fontWeight="600" fill="var(--color-ink-2)">{l}</text>; })}
    </svg>
  );
}

/** Score-over-time line with a dashed target line. Points are labelled underneath. */
export function ScoreLine({ points, target, height = 190 }: { points: { label: string; score: number }[]; target?: number; height?: number }) {
  const w = 640, padX = 28, padT = 16, padB = 28;
  const y = (v: number) => padT + (1 - v / 10) * (height - padT - padB);
  const x = (i: number) => padX + (points.length === 1 ? (w - 2 * padX) / 2 : (i / (points.length - 1)) * (w - 2 * padX));
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${height - padB} L${x(0).toFixed(1)},${height - padB} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" role="img" aria-label={`Scores: ${points.map((p) => `${p.label} ${p.score.toFixed(1)}`).join(", ")}`}>
      <defs><linearGradient id="score-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TONE.oxblood} stopOpacity="0.25" /><stop offset="100%" stopColor={TONE.oxblood} stopOpacity="0" /></linearGradient></defs>
      {[0, 2.5, 5, 7.5, 10].map((g) => <g key={g}><line x1={padX} x2={w - padX} y1={y(g)} y2={y(g)} stroke="var(--color-line-soft)" /><text x={4} y={y(g)} fontSize="9.5" dominantBaseline="middle" fill="var(--color-ink-faint)">{g}</text></g>)}
      {target !== undefined && <g><line x1={padX} x2={w - padX} y1={y(target)} y2={y(target)} stroke={TONE.teal} strokeDasharray="5 4" strokeWidth="1.5" /><text x={w - padX} y={y(target) - 6} textAnchor="end" fontSize="10" fontWeight="600" fill={TONE.teal}>Target {target}</text></g>}
      {points.length > 1 && <path d={area} fill="url(#score-fill)" />}
      <path d={line} fill="none" stroke={TONE.oxblood} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} pathLength={1} className="animate-draw" />
      {points.map((p, i) => <g key={i}><circle cx={x(i)} cy={y(p.score)} r="4.5" fill="white" stroke={TONE.oxblood} strokeWidth="2.5" /><text x={x(i)} y={y(p.score) - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)">{p.score.toFixed(1)}</text><text x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--color-ink-faint)">{p.label}</text></g>)}
    </svg>
  );
}

/** Simple vertical bars with a label under each and the value above. Values are already formatted by the caller. */
export function BarChart({ data, height = 170, tone = "oxblood" }: { data: { label: string; value: number; text: string }[]; height?: number; tone?: keyof typeof TONE }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 640, padB = 24, padT = 22, gap = 10;
  const bw = (w - gap * (data.length + 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" role="img" aria-label={`Bars: ${data.map((d) => `${d.label} ${d.text}`).join(", ")}`}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * (height - padB - padT));
        const x = gap + i * (bw + gap), y = height - padB - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx="6" fill={TONE[tone]} fillOpacity={d.value === 0 ? 0.2 : 0.9} />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-ink)">{d.value ? d.text : ""}</text>
            <text x={x + bw / 2} y={height - 7} textAnchor="middle" fontSize="10" fill="var(--color-ink-faint)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
