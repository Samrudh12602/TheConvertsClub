import type { PiFocus, SessionType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { addWindow } from "@/server/availability";
import { availableTimesRange, confirmBooking, holdSlot, releaseHold } from "@/server/booking";
import { AdminError, assertConfigWritable, type Actor } from "@/server/admin";
import { HOUR } from "@/server/scheduling";

/**
 * "Mentor mode" for the owner: a mentor profile flagged `isAdminMentor`. It is what lets you take sessions
 * yourself, and it is the ONLY kind of profile a Strategy call can be booked against, so the packages'
 * "strategy call with Samrudh" needs it. Sessions you take accrue no mentor pay (the whole fee stays with you)
 * unless "Admin's own sessions accrue pay" is switched on in Settings.
 */
export async function enableAdminMentor(actor: Actor) {
  assertConfigWritable(actor, "mentor mode");
  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user || user.role !== "ADMIN") throw new AdminError("Only the admin can turn on mentor mode.");
  const profile = await db.mentorProfile.upsert({
    where: { userId: user.id },
    update: { status: "ACTIVE", isAdminMentor: true },
    create: { userId: user.id, tier: "SENIOR", status: "ACTIVE", isAdminMentor: true, college: "Founder", bio: "Runs the strategy calls and everything behind the scenes.", publicVisible: false },
  });
  await audit({ actorId: actor.id, action: "admin.mentor_mode_on", entity: "MentorProfile", entityId: profile.id });
  return profile;
}

export async function pauseAdminMentor(actor: Actor) {
  assertConfigWritable(actor, "mentor mode");
  const p = await db.mentorProfile.findFirst({ where: { userId: actor.id, isAdminMentor: true } });
  if (!p) throw new AdminError("Mentor mode isn't on.");
  await db.mentorProfile.update({ where: { id: p.id }, data: { status: "PAUSED" } });
  await audit({ actorId: actor.id, action: "admin.mentor_mode_off", entity: "MentorProfile", entityId: p.id });
}

/** Publish hours on another mentor's behalf (same rules and slot splitting as when they do it themselves). */
export async function adminAddHours(actor: Actor, mentorId: string, date: string, from: string, to: string, repeatUntil?: string) {
  assertConfigWritable(actor, "mentor hours");
  const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: { select: { isDemo: true } } } });
  if (!m) throw new AdminError("Mentor not found.");
  if (m.status !== "ACTIVE") throw new AdminError("That mentor isn't active.");
  const n = await addWindow(mentorId, date, from, to, repeatUntil);
  await audit({ actorId: actor.id, action: "mentor.hours_added_by_admin", entity: "MentorProfile", entityId: mentorId, after: { date, from, to, repeatUntil: repeatUntil ?? null, slots: n } });
  return n;
}

async function studentFor(actor: Actor, studentId: string) {
  const s = await db.user.findUnique({ where: { id: studentId } });
  if (!s || s.role !== "STUDENT") throw new AdminError("Student not found.");
  if (actor.isDemo && !s.isDemo) throw new AdminError("The demo admin can only work with demo data.");
  return s;
}

/** Times (next 15 days) at which this student could be booked for the type: same rules the student sees. */
export async function adminTimesFor(actor: Actor, studentId: string, type: SessionType, focus: PiFocus | null) {
  await studentFor(actor, studentId);
  const now = new Date();
  return (await availableTimesRange(studentId, type, focus, now, new Date(now.getTime() + 15 * 24 * HOUR))).map((d) => d.toISOString());
}

/**
 * Book a session for a student without their involvement. It is the student's normal booking (the best
 * eligible mentor is picked, a credit from THEIR balance is reserved, they get the confirmation email),
 * so nothing here bypasses credits. Use Adjust a credit first if they have none.
 */
export async function adminBookFor(actor: Actor, studentId: string, type: SessionType, focus: PiFocus | null, startsAtIso: string) {
  await studentFor(actor, studentId);
  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) throw new AdminError("Pick a time.");
  const held = await holdSlot(studentId, type, focus, startsAt);
  try {
    const session = await confirmBooking(studentId, held.slotId, type, focus);
    await audit({ actorId: actor.id, action: "session.booked_by_admin", entity: "Session", entityId: session.id, after: { studentId, type, startsAt: startsAtIso } });
    return session;
  } catch (e) {
    await releaseHold(studentId, held.slotId);
    throw e;
  }
}
