import { IST } from "@/lib/datetime";

/** All display times are IST, 12-hour. */
const f = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...o }).format(d);

export const fmtTime = (d: Date) => f(d, { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase(); // 6:00 PM
export const fmtDayNum = (d: Date) => f(d, { day: "2-digit" }); // 09
export const fmtMon = (d: Date) => f(d, { month: "short" }); // Jan
export const fmtDate = (d: Date) => f(d, { day: "numeric", month: "short" }); // 9 Jan
export const fmtDay = (d: Date) => f(d, { weekday: "short", day: "numeric", month: "short" }); // Fri 9 Jan
export const fmtWhen = (d: Date) => `${fmtDay(d)}, ${fmtTime(d)}`;
export const fmtDow = (d: Date) => f(d, { weekday: "short" });
export const fmtFull = (d: Date) => f(d, { weekday: "long", day: "numeric", month: "long" });

/** "in 2 hours 40 min", "in 3 days", "3h ago". */
export function relative(target: Date, now: Date = new Date()): string {
  const diff = target.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const body = days >= 2 ? `${days} days` : hrs >= 1 ? `${hrs} hour${hrs === 1 ? "" : "s"}${mins % 60 && hrs < 6 ? ` ${mins % 60} min` : ""}` : `${Math.max(1, mins)} min`;
  return diff >= 0 ? `in ${body}` : `${body} ago`;
}

export const initials = (name?: string | null) =>
  (name ?? "?").replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

export const firstName = (name?: string | null) => (name ?? "there").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "there";
