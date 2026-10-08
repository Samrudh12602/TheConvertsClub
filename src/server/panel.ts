import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { BookingError, isDemoStudent, now, openOrExpiredHold } from "@/server/booking-shared";
import { HOUR, pickCandidate, type Candidate } from "@/server/scheduling";

/**
 * Panel PI: one student, three interviewers at the same hour. The owner is always the lead (Session.mentorId); two other
 * active mentors with an open slot at that hour sit on the panel (SessionPanelist). A time is bookable only when all
 * three are free, and all three slots are held and booked together, or none are.
 */

/** Everyone who can sit on the panel at one instant, from the slots open then. */
type SlotRow = { id: string; startsAt: Date; mentorId: string; mentor: { id: string; tier: "SENIOR" | "JUNIOR"; isAdminMentor: boolean } };

export function panelFrom(slots: SlotRow[], loadOf: Map<string, number>): { lead: Candidate; panel: [Candidate, Candidate] } | null {
  const lead = slots.find((s) => s.mentor.isAdminMentor);
  if (!lead) return null;
  let rest: Candidate[] = slots.filter((s) => !s.mentor.isAdminMentor).map((s) => ({ slotId: s.id, mentorId: s.mentorId, tier: s.mentor.tier, isAdminMentor: false, load: loadOf.get(s.mentorId) ?? 0 }));
  const a = pickCandidate(rest, false);
  if (!a) return null;
  rest = rest.filter((c) => c.mentorId !== a.mentorId);
  const b = pickCandidate(rest, false);
  if (!b) return null;
  return { lead: { slotId: lead.id, mentorId: lead.mentorId, tier: lead.mentor.tier, isAdminMentor: true, load: 0 }, panel: [a, b] };
}

const slotInclude = { mentor: { select: { id: true, tier: true, isAdminMentor: true } } } as const;

/** Bookable start times for a Panel PI between two instants: hours where the owner and two others are all free. */
export async function panelTimes(studentId: string, rangeFrom: Date, rangeTo: Date) {
  const s = await getSettings();
  const t = now();
  const earliest = new Date(Math.max(rangeFrom.getTime(), t.getTime() + s.minLeadHours * HOUR));
  if (earliest >= rangeTo) return [];
  const demo = await isDemoStudent(db, studentId);
  const slots = await db.slot.findMany({
    where: { startsAt: { gte: earliest, lt: rangeTo }, ...openOrExpiredHold(t), mentor: { status: "ACTIVE", user: { isDemo: demo } } },
    include: slotInclude, orderBy: { startsAt: "asc" },
  });
  const mine = await db.session.findMany({ where: { studentId, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gte: earliest, lt: rangeTo } }, select: { startsAt: true } });
  const busy = new Set(mine.map((m) => m.startsAt?.getTime()));
  const byTime = new Map<number, SlotRow[]>();
  for (const sl of slots) byTime.set(sl.startsAt.getTime(), [...(byTime.get(sl.startsAt.getTime()) ?? []), sl as SlotRow]);
  return [...byTime.entries()].filter(([ms, list]) => !busy.has(ms) && panelFrom(list, new Map()) !== null).map(([ms]) => new Date(ms));
}

/** Inside the hold transaction: put the lead's and both panelists' slots on hold for this student, all or nothing. */
export async function holdPanelSlots(tx: Prisma.TransactionClient, studentId: string, startsAt: Date, heldUntil: Date) {
  const demo = await isDemoStudent(tx, studentId);
  const slots = await tx.slot.findMany({ where: { startsAt, ...openOrExpiredHold(now()), mentor: { status: "ACTIVE", user: { isDemo: demo } } }, include: slotInclude });
  const load = await tx.session.groupBy({ by: ["mentorId"], where: { mentorId: { in: slots.map((x) => x.mentorId) }, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gte: now() } }, _count: true });
  const chosen = panelFrom(slots as SlotRow[], new Map(load.map((l) => [l.mentorId ?? "", l._count])));
  if (!chosen) throw new BookingError("That time isn't open for a Panel PI any more. Pick another.", "TAKEN");
  for (const c of [chosen.lead, ...chosen.panel]) {
    // Conditional update: if any one of the three was just taken, the whole hold is abandoned (the transaction rolls back).
    const r = await tx.slot.updateMany({ where: { id: c.slotId, ...openOrExpiredHold(now()) }, data: { status: "HELD", heldById: studentId, heldUntil } });
    if (r.count !== 1) throw new BookingError("Someone just took that time. Pick another.", "TAKEN");
  }
  return { slotId: chosen.lead.slotId, heldUntil };
}

/** Inside confirmBooking: turn the two panelist holds into booked seats on the new session. */
export async function seatPanel(tx: Prisma.TransactionClient, sessionId: string, studentId: string, lead: { id: string; startsAt: Date }) {
  const held = await tx.slot.findMany({ where: { heldById: studentId, status: "HELD", startsAt: lead.startsAt, id: { not: lead.id }, heldUntil: { gte: now() } } });
  if (held.length !== 2) throw new BookingError("Your hold on the panel expired. Pick a time again.", "HOLD_EXPIRED");
  for (const h of held) {
    await tx.slot.update({ where: { id: h.id }, data: { status: "BOOKED", heldUntil: null } });
    await tx.sessionPanelist.create({ data: { sessionId, mentorId: h.mentorId, slotId: h.id } });
  }
}

/** Free the panelists' slots again (a cancelled panel). The rows stay as the record of who was on it. */
export async function releasePanelSeats(tx: Prisma.TransactionClient, sessionId: string) {
  const seats = await tx.sessionPanelist.findMany({ where: { sessionId, slotId: { not: null } }, select: { slotId: true } });
  for (const s of seats) if (s.slotId) await tx.slot.update({ where: { id: s.slotId }, data: { status: "OPEN", heldById: null, heldUntil: null } });
}

/** The two non-lead panelists, with the details emails need. */
export const panelistsOf = (sessionId: string) =>
  db.sessionPanelist.findMany({ where: { sessionId }, include: { mentor: { include: { user: { select: { id: true, name: true, email: true } } } } }, orderBy: { createdAt: "asc" } });
