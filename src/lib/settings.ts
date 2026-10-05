/**
 * Admin-editable business rules. Defaults below are ASSUMPTIONS recorded in docs/DECISIONS.md.
 * Public copy reads these through getPolicy() so no policy number is hard-coded in a page.
 * getSettings() (settings-db.ts) merges the Setting table over these defaults.
 */
export const DEFAULT_SETTINGS = {
  bookingMode: "AUTO_CONFIRM" as "AUTO_CONFIRM" | "ADMIN_APPROVAL",
  holdMinutes: 10,
  /** Earliest bookable start, in hours from now. */
  minLeadHours: 2,
  cancelNoticeHours: 12,
  maxReschedules: 2,
  refundWindowHours: 48,
  recordingRetentionDays: 90,
  /** Unused credits expire this many days after being granted. 0 = never expire (the default). */
  creditValidityDays: 0,
  /** Students are warned this many days before credits expire. */
  creditExpiryWarnDays: 14,
  gdCapacity: 8,
  feedbackDueHours: 24,
  gstEnabled: false,
  /** PI focuses that must go to a Senior mentor. */
  seniorRequiredFocuses: ["STRESS", "INSTITUTE_FINAL"] as string[],
  /** What counts as a "mock" for bonuses: completed PI, GD and WAT by default. */
  mockCounts: ["PI", "GD", "WAT"] as string[],
  bonusPeriod: "SEASON" as "SEASON" | "MONTH",
  /** Referral bonus: every N students a mentor refers earns them this percent of the fees those students paid. */
  referralBonusEvery: 10,
  referralBonusPercent: 5,
  /** Admin's own sessions accrue no pay unless this is on. */
  adminAccrues: false,
  /** Show demo accounts, demo mentors and demo rows (all fake). Off for real use; Admin can switch it on to test. */
  demoEnabled: false,
  seasonStart: "2026-12-20",
  seasonEnd: "2027-03-31",
};

export type Settings = typeof DEFAULT_SETTINGS;

/** "once", "twice", "3 times" - for prose. */
export function times(n: number): string {
  if (n === 1) return "once";
  if (n === 2) return "twice";
  return `${n} times`;
}
