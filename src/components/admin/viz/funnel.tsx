import { COLOR, CYCLE } from "./palette";

export interface FunnelStep { label: string; value: number; hint?: string }

/** Each step as a bar sized against the first, with the share that carried on from the step before. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((s, i) => {
        const prev = steps[i - 1]?.value;
        const carry = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        const color = COLOR[CYCLE[i % CYCLE.length]];
        return (
          <li key={s.label} className="grid grid-cols-[minmax(104px,150px)_1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12.5px] leading-tight text-ink-2">{s.label}</p>
              <p className="mt-0.5 text-[10.5px] leading-none text-ink-faint">{i === 0 ? "everyone" : carry === null ? "—" : `${carry}% of the step before`}</p>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-line-soft" role="img" aria-label={`${s.label}: ${s.value}`}>
              <div className="flex h-full items-center rounded-lg px-2 text-[10.5px] font-bold text-white transition-[width] duration-700" style={{ width: `${Math.max(7, (s.value / top) * 100)}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))` }}>{Math.round((s.value / top) * 100)}%</div>
            </div>
            <span className="tnum w-10 text-right text-[13px] font-bold text-ink">{s.value.toLocaleString("en-IN")}</span>
          </li>
        );
      })}
    </ol>
  );
}
