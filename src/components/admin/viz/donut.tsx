import { wholePercents } from "@/lib/metrics";
import { COLOR, CYCLE } from "./palette";

export interface Slice { label: string; value: number; text?: string }

/** A ring split by share, with the total in the middle and a legend that adds up to exactly 100%. */
export function Donut({ slices, centerValue, centerLabel, size = 168, emptyText = "Nothing yet" }: { slices: Slice[]; centerValue: string; centerLabel: string; size?: number; emptyText?: string }) {
  const total = slices.reduce((n, s) => n + s.value, 0);
  const stroke = 22, r = (size - stroke) / 2, c = 2 * Math.PI * r, gap = slices.length > 1 ? 3 : 0;
  const pcts = wholePercents(slices.map((s) => s.value));
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative flex-none" style={{ width: size, height: size }} role="img" aria-label={`${centerLabel}: ${centerValue}. ${slices.map((s, i) => `${s.label} ${pcts[i]} percent`).join(", ")}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth={stroke} strokeDasharray={total === 0 ? "3 8" : undefined} strokeLinecap="round" />
          {total > 0 && slices.map((s, i) => {
            const len = (s.value / total) * c;
            const el = <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLOR[CYCLE[i % CYCLE.length]]} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}`} strokeDashoffset={-acc} />;
            acc += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tnum font-display text-[22px] font-bold leading-none text-ink">{total === 0 ? "—" : centerValue}</span>
          <span className="mt-1 text-[11px] font-medium text-ink-faint">{total === 0 ? emptyText : centerLabel}</span>
        </div>
      </div>
      {total > 0 && (
        <ul className="min-w-[180px] flex-1 space-y-2 text-[12.5px]">
          {slices.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2.5">
              <span aria-hidden className="size-2.5 flex-none rounded-full" style={{ background: COLOR[CYCLE[i % CYCLE.length]] }} />
              <span className="min-w-0 flex-1 truncate text-ink-2">{s.label}</span>
              <span className="tnum font-semibold text-ink">{s.text ?? s.value}</span>
              <span className="tnum w-9 text-right text-ink-faint">{pcts[i]}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
