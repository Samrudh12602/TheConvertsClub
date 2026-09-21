/**
 * Admin-editable business rules. Defaults below are ASSUMPTIONS recorded in docs/DECISIONS.md.
 * Public copy reads these through getPolicy() so no policy number is hard-coded in a page.
 * In Phase 1 getPolicy() reads the Setting table and falls back to these defaults.
 */
export const DEFAULT_SETTINGS = {
  bookingMode: "AUTO_CONFIRM" as "AUTO_CONFIRM" | "ADMIN_APPROVAL",
  holdMinutes: 10,
  cancelNoticeHours: 12,
  maxReschedules: 2,
  refundWindowHours: 48,
  recordingRetentionDays: 90,
  gdCapacity: 8,
  feedbackDueHours: 24,
  gstEnabled: false,
};

export type Settings = typeof DEFAULT_SETTINGS;

export async function getPolicy(): Promise<Settings> {
  return DEFAULT_SETTINGS;
}

/** "once", "twice", "3 times" - for prose. */
export function times(n: number): string {
  if (n === 1) return "once";
  if (n === 2) return "twice";
  return `${n} times`;
}
