export function BarChart({
  data,
  height = 220,
  color = "var(--gold-500)",
  valueFormatter = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end h-full gap-2">
          <span className="text-xs font-semibold text-ink tabular-nums">{valueFormatter(d.value)}</span>
          <div
            className="w-full rounded-t-[6px] transition-all duration-300 ease-out"
            style={{ height: `${(d.value / max) * (height - 50)}px`, backgroundColor: color, minHeight: 4 }}
          />
          <span className="text-[11px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({
  data,
  height = 220,
  color = "var(--gold-500)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const width = Math.max(data.length * 60, 320);
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const padding = 20;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
    const y = padding + (1 - (d.value - min) / range) * (height - padding * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${points[points.length - 1][0]},${height - padding} L${points[0][0]},${height - padding} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} height={height} preserveAspectRatio="none" className="min-w-full">
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#line-fill)" stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={color} />
      ))}
      {data.map((d, i) => (
        <text key={d.label} x={points[i][0]} y={height - 2} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0]?.value || 1;
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const conv = i > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : 100;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-ink">{s.label}</span>
              <span className="text-muted tabular-nums">
                {s.value} {i > 0 && <span className="text-muted">· {conv}% of prev</span>}
              </span>
            </div>
            <div className="h-3 rounded-full bg-sunken overflow-hidden">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${pct}%`, opacity: 0.5 + (0.5 * (100 - i * 15)) / 100 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
