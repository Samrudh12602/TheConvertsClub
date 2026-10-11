import { COLOR, CYCLE } from "./palette";

export interface FunnelStep { label: string; value: number; hint?: string }

/** Each step as a bar sized against the first, with the share that carried on from the step before. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const prev = steps[i - 1]?.value;
        const carry = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        const color = COLOR[CYCLE[i % CYCLE.length]];
        return (
          <li key={s.label}>
            {i > 0 && <p className="ml-3 flex items-center gap-1.5 py-1 text-[11px] text-ink-faint"><span aria-hidden>↓</span>{carry === null ? "—" : `${carry}% carried on`}</p>}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 text-[12.5px]"><span className="text-ink-2">{s.label}{s.hint && <span className="text-ink-faint"> · {s.hint}</span>}</span><span className="tnum font-bold text-ink">{s.value.toLocaleString("en-IN")}</span></div>
                <div className="mt-1.5 h-8 overflow-hidden rounded-lg bg-line-soft" role="img" aria-label={`${s.label}: ${s.value}`}>
                  <div className="flex h-full items-center rounded-lg px-2.5 text-[11px] font-bold text-white transition-[width] duration-700" style={{ width: `${Math.max(7, (s.value / top) * 100)}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))` }}>
                    {Math.round((s.value / top) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
