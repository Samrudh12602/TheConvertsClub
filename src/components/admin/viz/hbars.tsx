import { COLOR, CYCLE, type Tone } from "./palette";

export interface BarItem { label: string; value: number; text?: string; sub?: string }

/** A ranked list of horizontal bars, each in its own colour. */
export function HBars({ items, tone, empty = "Nothing yet." }: { items: BarItem[]; tone?: Tone; empty?: string }) {
  if (items.length === 0) return <p className="text-[12.5px] text-ink-faint">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it, i) => {
        const color = COLOR[tone ?? CYCLE[i % CYCLE.length]];
        return (
          <li key={it.label}>
            <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="min-w-0 truncate text-ink-2">{it.label}{it.sub && <span className="text-ink-faint"> · {it.sub}</span>}</span>
              <span className="tnum flex-none font-semibold text-ink">{it.text ?? it.value}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line-soft" role="img" aria-label={`${it.label}: ${it.text ?? it.value}`}>
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(3, (it.value / max) * 100)}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 62%, white))` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
