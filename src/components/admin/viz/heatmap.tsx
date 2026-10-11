const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BANDS = ["12–3a", "3–6a", "6–9a", "9–12", "12–3p", "3–6p", "6–9p", "9–12p"];

/** When mocks are started: weekday by three-hour band, darker = busier. */
export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(...grid.flat(), 0);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-1 text-[10.5px]" aria-label="Mock starts by weekday and time of day">
          <thead><tr><th className="w-9" />{BANDS.map((b) => <th key={b} className="pb-0.5 font-medium text-ink-faint">{b}</th>)}</tr></thead>
          <tbody>
            {grid.map((row, d) => (
              <tr key={DAYS[d]}>
                <th className="pr-1 text-right font-medium text-ink-faint">{DAYS[d]}</th>
                {row.map((v, b) => (
                  <td key={b} title={`${DAYS[d]} ${BANDS[b]}: ${v} start${v === 1 ? "" : "s"}`} className="h-7 rounded-md text-center font-semibold" style={{ background: v === 0 ? "var(--color-line-soft)" : `color-mix(in srgb, var(--color-oxblood) ${16 + (v / max) * 84}%, transparent)`, color: v / (max || 1) > 0.5 ? "white" : "var(--color-ink-2)" }}>{v || ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {max === 0 && <p className="mt-2 text-[12px] text-ink-faint">Fills in as students start mocks. Times are India time.</p>}
    </div>
  );
}
