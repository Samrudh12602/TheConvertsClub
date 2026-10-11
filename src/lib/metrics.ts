/** Pure helpers behind the admin dashboard and analytics: day buckets, deltas, histograms, heatmaps and compact rupee labels. */

export const DAY = 86_400_000;
const IST_OFFSET = 5.5 * 3_600_000;

/** "2026-10-11": the calendar day in India. */
export const istDayKey = (d: Date) => new Date(d.getTime() + IST_OFFSET).toISOString().slice(0, 10);

/** The start (00:00 IST) of the day `d` falls on. */
export const istDayStart = (d: Date) => new Date(Math.floor((d.getTime() + IST_OFFSET) / DAY) * DAY - IST_OFFSET);

const LABEL = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export interface DayBucket { key: string; label: string; start: Date; end: Date }

/** The last `n` days in India ending with today, oldest first. */
export function lastDays(n: number, now: Date = new Date()): DayBucket[] {
  const today = istDayStart(now).getTime();
  return Array.from({ length: n }, (_, i) => {
    const start = new Date(today - (n - 1 - i) * DAY);
    return { key: istDayKey(start), label: LABEL.format(start), start, end: new Date(start.getTime() + DAY) };
  });
}

/** Adds `v` of every row to the day it happened on. Rows outside the days are ignored. */
export function bucketByDay(rows: { at: Date; v: number }[], days: DayBucket[]): number[] {
  const index = new Map(days.map((d, i) => [d.key, i]));
  const out = days.map(() => 0);
  for (const r of rows) {
    const i = index.get(istDayKey(r.at));
    if (i !== undefined) out[i] += r.v;
  }
  return out;
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Percent change from `prev` to `cur`. Null when there is nothing to compare against (both zero, or growth from zero). */
export function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** "₹1.2L", "₹45K", "₹980": paise to a short rupee label in the Indian style. */
export function compactInr(paise: number): string {
  const r = Math.round(paise / 100);
  const a = Math.abs(r);
  const sign = r < 0 ? "−" : "";
  if (a >= 1_00_00_000) return `${sign}₹${trim(a / 1_00_00_000)}Cr`;
  if (a >= 1_00_000) return `${sign}₹${trim(a / 1_00_000)}L`;
  if (a >= 10_000) return `${sign}₹${trim(a / 1000)}K`;
  return `${sign}₹${a.toLocaleString("en-IN")}`;
}
const trim = (n: number) => (n >= 100 ? n.toFixed(0) : n.toFixed(1)).replace(/\.0$/, "");

/** Counts values into `bins` equal bands from 0 to `max` (the top band includes `max`). */
export function histogram(values: number[], bins: number, max: number): number[] {
  const out = Array.from({ length: bins }, () => 0);
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v / max) * bins)));
    out[i]++;
  }
  return out;
}

/** Weekday (Mon=0 … Sun=6) by three-hour band (0 = 00:00–03:00 … 7 = 21:00–24:00), in India time. */
export function weekHeat(dates: Date[]): number[][] {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 8 }, () => 0));
  for (const d of dates) {
    const t = new Date(d.getTime() + IST_OFFSET);
    const wd = (t.getUTCDay() + 6) % 7;
    grid[wd][Math.floor(t.getUTCHours() / 3)]++;
  }
  return grid;
}

/** Shares of a total as whole percents that add up to 100 (largest remainder), so a legend never reads 99% or 101%. */
export function wholePercents(values: number[]): number[] {
  const total = sum(values);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floor = raw.map(Math.floor);
  let left = 100 - sum(floor);
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f);
  for (const { i } of order) { if (left <= 0) break; floor[i]++; left--; }
  return floor;
}

/** A friendly, honest greeting by the hour in India. */
export function greeting(now: Date = new Date()): string {
  const h = new Date(now.getTime() + IST_OFFSET).getUTCHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Good night";
}
