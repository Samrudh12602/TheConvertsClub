import { COLOR } from "./palette";

/** How scores are spread: bars from low to high, shaded from oxblood through gold to teal. */
export function ScoreHistogram({ bins, max, avg }: { bins: number[]; max: number; avg: number | null }) {
  const top = Math.max(...bins, 1);
  const step = max / bins.length;
  const shade = (i: number) => (i < bins.length * 0.34 ? COLOR.oxblood : i < bins.length * 0.67 ? COLOR.gold : COLOR.teal);
  const total = bins.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Score spread: ${bins.map((b, i) => `${Math.round(i * step)} to ${Math.round((i + 1) * step)}: ${b}`).join(", ")}`}>
        {bins.map((b, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="tnum mb-1 text-center text-[10.5px] font-bold text-ink opacity-0 transition-opacity group-hover:opacity-100">{b}</span>
            <div className="rounded-t-md transition-all duration-500" style={{ height: `${total === 0 ? 4 : Math.max(4, (b / top) * 100)}%`, background: total === 0 ? "var(--color-line-soft)" : `linear-gradient(180deg, ${shade(i)}, color-mix(in srgb, ${shade(i)} 55%, white))` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[10px] text-ink-faint">{bins.map((_, i) => <span key={i} className="flex-1 text-center">{Math.round(i * step)}</span>)}</div>
      <p className="mt-2 text-[12px] text-ink-muted">{total === 0 ? "Scores appear here once students submit mocks." : <>Average score <b className="tnum text-ink">{avg?.toFixed(1)}</b> out of {max} · {total} attempt{total === 1 ? "" : "s"}</>}</p>
    </div>
  );
}
