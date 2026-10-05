import { db } from "@/lib/db";
import { HOUR, istDayRange, istToUtc, splitIntoSlots, weeklyRepeats, type SlotSpan } from "@/server/scheduling";
import { audit } from "@/server/audit";

export class AvailabilityError extends Error {}

/** Create slots (skipping ones that already exist) for a list of windows. Returns how many changed. `direct`: set-aside hours for the paid PI / strategy calls with Samrudh. */
async function createSlots(mentorId: string, windows: (SlotSpan & { direct?: boolean })[], repeatUntil?: Date, direct = false) {
  let created = 0;
  for (const w of windows) {
    const d = w.direct ?? direct;
    await db.availabilityWindow.create({ data: { mentorId, startsAt: w.startsAt, endsAt: w.endsAt, repeatUntil, direct: d } });
    const spans = splitIntoSlots(w.startsAt, w.endsAt);
    const r = await db.slot.createMany({ data: spans.map((s) => ({ mentorId, ...s, direct: d })), skipDuplicates: true });
    created += r.count;
    // Hours that already existed as the OTHER kind and are still open switch over; booked or held hours are never touched.
    const switched = await db.slot.updateMany({ where: { mentorId, status: "OPEN", direct: !d, startsAt: { in: spans.map((s) => s.startsAt) } }, data: { direct: d } });
    created += switched.count;
  }
  return created;
}

function assertDirectAllowed(isAdminMentor: boolean, direct: boolean) {
  if (direct && !isAdminMentor) throw new AvailabilityError("Only Samrudh's own hours can be set aside for the paid PI / strategy calls.");
}

/** Add a window on an IST date (from/to as HH:mm), optionally repeating weekly until another IST date. */
export async function addWindow(mentorId: string, date: string, from: string, to: string, repeatUntil?: string, direct = false) {
  const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, select: { isAdminMentor: true } });
  assertDirectAllowed(Boolean(m?.isAdminMentor), direct);
  const start = istToUtc(date, from);
  const end = istToUtc(date, to);
  if (end.getTime() - start.getTime() < HOUR) throw new AvailabilityError("A window needs at least one full hour.");
  if (start.getTime() < Date.now()) throw new AvailabilityError("That window is in the past.");
  const windows: SlotSpan[] = [{ startsAt: start, endsAt: end }];
  const until = repeatUntil ? istToUtc(repeatUntil, "23:59") : undefined;
  if (until) windows.push(...weeklyRepeats(start, end, until));
  if (windows.length > 60) throw new AvailabilityError("That repeats too many times. Pick an earlier end date.");
  return createSlots(mentorId, windows, until, direct);
}

/** Copy the previous 7 days of windows forward by one week (each keeps its own kind). */
export async function copyPreviousWeek(mentorId: string, weekStartDate: string) {
  const { from } = istDayRange(weekStartDate);
  const prevFrom = new Date(from.getTime() - 7 * 24 * HOUR);
  const wins = await db.availabilityWindow.findMany({ where: { mentorId, startsAt: { gte: prevFrom, lt: from } } });
  const shifted = wins.map((w) => ({ startsAt: new Date(w.startsAt.getTime() + 7 * 24 * HOUR), endsAt: new Date(w.endsAt.getTime() + 7 * 24 * HOUR), direct: w.direct })).filter((w) => w.startsAt.getTime() > Date.now());
  if (!shifted.length) throw new AvailabilityError("There's nothing in the previous week to copy.");
  return createSlots(mentorId, shifted);
}

/** Block a whole IST date: open slots become BLOCKED. Booked slots stay booked (changes route to Admin). */
export async function blockDate(mentorId: string, date: string) {
  const { from, to } = istDayRange(date);
  const r = await db.slot.updateMany({ where: { mentorId, startsAt: { gte: from, lt: to }, status: { in: ["OPEN", "HELD"] } }, data: { status: "BLOCKED", heldById: null, heldUntil: null } });
  return r.count;
}

export async function unblockDate(mentorId: string, date: string) {
  const { from, to } = istDayRange(date);
  const r = await db.slot.updateMany({ where: { mentorId, startsAt: { gte: from, lt: to }, status: "BLOCKED" }, data: { status: "OPEN" } });
  return r.count;
}

/** A mentor cannot delete a booked slot: that goes to Admin. */
export async function removeSlot(mentorId: string, slotId: string, actorId: string) {
  const slot = await db.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.mentorId !== mentorId) throw new AvailabilityError("Slot not found.");
  if (slot.status === "BOOKED") throw new AvailabilityError("This slot is booked. Ask Samrudh to move the session and it will free up.");
  if (slot.status === "HELD" && slot.heldUntil && slot.heldUntil.getTime() > Date.now()) throw new AvailabilityError("A student is booking this slot right now. Try again in a few minutes.");
  await db.slot.delete({ where: { id: slotId } });
  await audit({ actorId, action: "availability.remove_slot", entity: "Slot", entityId: slotId });
}

/**
 * Click on one hour of the week grid. Nothing there -> add it as the chosen kind. Open hour of the same kind -> remove it.
 * Open hour of the other kind -> switch it to the chosen kind. Booked or being-booked hours can't be changed here.
 */
export async function toggleSlot(mentorId: string, startsAt: Date, direct = false) {
  const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, select: { isAdminMentor: true } });
  assertDirectAllowed(Boolean(m?.isAdminMentor), direct);
  const slot = await db.slot.findUnique({ where: { mentorId_startsAt: { mentorId, startsAt } } });
  if (slot) {
    if (slot.status === "BOOKED") throw new AvailabilityError("Booked slots can't be changed here. Ask Samrudh.");
    if (slot.status === "HELD" && slot.heldUntil && slot.heldUntil.getTime() > Date.now()) throw new AvailabilityError("A student is booking this slot right now. Try again in a few minutes.");
    if (slot.direct !== direct) { await db.slot.update({ where: { id: slot.id }, data: { direct } }); return "switched" as const; }
    await db.slot.delete({ where: { id: slot.id } });
    return "removed" as const;
  }
  if (startsAt.getTime() < Date.now()) throw new AvailabilityError("That time is in the past.");
  await db.slot.create({ data: { mentorId, startsAt, endsAt: new Date(startsAt.getTime() + HOUR), direct } });
  return "added" as const;
}
