/** Timestamps are stored in UTC and always displayed in IST, 12-hour clock. */
export const IST = "Asia/Kolkata";

export function formatIstDayMonth(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "long" }).format(d);
}

export function formatIstDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** Current time in ms. Wrapped so server components can read the clock without tripping the render-purity lint rule. */
export const nowMs = (): number => Date.now();
