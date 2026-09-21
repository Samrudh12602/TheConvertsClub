import type { MentorTier, PiFocus, SessionType } from "@/generated/prisma/client";

/** Pure scheduling helpers. IST is UTC+5:30 (no DST), so an "IST hour" boundary is 30 minutes off a UTC hour. */
export const HOUR = 3_600_000;
export const IST_OFFSET_MS = 5.5 * HOUR;

export const floorToIstHour = (ms: number) => Math.floor((ms + IST_OFFSET_MS) / HOUR) * HOUR - IST_OFFSET_MS;
export const ceilToIstHour = (ms: number) => Math.ceil((ms + IST_OFFSET_MS) / HOUR) * HOUR - IST_OFFSET_MS;

export interface SlotSpan {
  startsAt: Date;
  endsAt: Date;
}

/** Split a window into 1-hour slots that start on IST hour boundaries. Partial hours are dropped (floor). */
export function splitIntoSlots(start: Date, end: Date): SlotSpan[] {
  const out: SlotSpan[] = [];
  const from = ceilToIstHour(start.getTime());
  const to = floorToIstHour(end.getTime());
  for (let t = from; t + HOUR <= to; t += HOUR) out.push({ startsAt: new Date(t), endsAt: new Date(t + HOUR) });
  return out;
}

/** "2027-01-09" + "18:00" (IST) -> UTC Date. */
export function istToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MS);
}

export function istDayRange(date: string): { from: Date; to: Date } {
  const from = istToUtc(date, "00:00");
  return { from, to: new Date(from.getTime() + 24 * HOUR) };
}

/** "YYYY-MM-DD" of a UTC instant in IST. */
export function istDateString(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Repeat a window weekly until (and including) `until`. Returns the extra windows after the first. */
export function weeklyRepeats(start: Date, end: Date, until: Date): SlotSpan[] {
  const out: SlotSpan[] = [];
  for (let k = 1; ; k++) {
    const s = new Date(start.getTime() + k * 7 * 24 * HOUR);
    if (s.getTime() > until.getTime()) break;
    out.push({ startsAt: s, endsAt: new Date(end.getTime() + k * 7 * 24 * HOUR) });
  }
  return out;
}

// ───────────── Assignment ─────────────

export interface Candidate {
  slotId: string;
  mentorId: string;
  tier: MentorTier;
  isAdminMentor: boolean;
  /** Upcoming confirmed sessions already assigned. */
  load: number;
}

export const needsSenior = (type: SessionType, focus: PiFocus | null | undefined, seniorFocuses: string[]) =>
  type === "MOCK_PI" && !!focus && seniorFocuses.includes(focus);

const byLoad = (a: Candidate, b: Candidate) => a.load - b.load || a.mentorId.localeCompare(b.mentorId);

/**
 * Default assignment rule:
 *  - senior-required focus: an available Senior (lowest load)
 *  - otherwise: the available Junior with the lowest load, falling back to a Senior
 *  - last resort for both: the Admin's own mentor availability
 * Students never see tier; this only decides which mentor's slot is held.
 */
export function pickCandidate(cands: Candidate[], seniorRequired: boolean): Candidate | null {
  const regular = cands.filter((c) => !c.isAdminMentor);
  const seniors = regular.filter((c) => c.tier === "SENIOR").sort(byLoad);
  const juniors = regular.filter((c) => c.tier === "JUNIOR").sort(byLoad);
  const admin = cands.filter((c) => c.isAdminMentor).sort(byLoad);
  const order = seniorRequired ? [seniors, admin] : [juniors, seniors, admin];
  for (const group of order) if (group.length) return group[0];
  return null;
}

// ───────────── Cancel / reschedule policy ─────────────

export type CancelOutcome = "RELEASE" | "CONSUME";

/** Cancelling with enough notice returns the credit; late cancels consume it. */
export function cancelOutcome(startsAt: Date, now: Date, noticeHours: number): CancelOutcome {
  return startsAt.getTime() - now.getTime() >= noticeHours * HOUR ? "RELEASE" : "CONSUME";
}

export const canReschedule = (startsAt: Date, now: Date, noticeHours: number, used: number, max: number) =>
  used < max && startsAt.getTime() - now.getTime() >= noticeHours * HOUR;
