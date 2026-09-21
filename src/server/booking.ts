import type { PiFocus, SessionType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { fmtDay, fmtTime, fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { getBalances, InsufficientCreditsError, lockUser, releaseCredit, consumeCredit, reserveCredit, sessionCreditKind } from "@/server/credits";
import { canReschedule, cancelOutcome, HOUR, istDayRange, needsSenior, pickCandidate, type Candidate } from "@/server/scheduling";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";

export class BookingError extends Error {
  constructor(message: string, public code: "NO_CREDIT" | "TAKEN" | "HOLD_EXPIRED" | "NOT_ALLOWED" | "NOT_FOUND" | "POLICY") {
    super(message);
  }
}

const now = () => new Date();
const openOrExpiredHold = (t: Date) => ({ OR: [{ status: "OPEN" as const }, { status: "HELD" as const, heldUntil: { lt: t } }] });

/** Mentors whose slots can serve this session type. Strategy calls are Samrudh's; everything else any active mentor. */
const mentorFilter = (type: SessionType) => ({ status: "ACTIVE" as const, ...(type === "STRATEGY_CALL" ? { isAdminMentor: true } : {}) });

async function candidatesAt(tx: Pick<typeof db, "slot" | "session">, type: SessionType, startsAt: Date): Promise<Candidate[]> {
  const t = now();
  const slots = await tx.slot.findMany({
    where: { startsAt, ...openOrExpiredHold(t), mentor: mentorFilter(type) },
    include: { mentor: { select: { id: true, tier: true, isAdminMentor: true } } },
  });
  if (!slots.length) return [];
  const load = await tx.session.groupBy({
    by: ["mentorId"],
    where: { mentorId: { in: slots.map((s) => s.mentorId) }, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gte: t } },
    _count: true,
  });
  const loadOf = new Map(load.map((l) => [l.mentorId, l._count]));
  return slots.map((s) => ({ slotId: s.id, mentorId: s.mentorId, tier: s.mentor.tier, isAdminMentor: s.mentor.isAdminMentor, load: loadOf.get(s.mentorId) ?? 0 }));
}

/** Bookable start times between two instants (mentor identity and tier are never exposed). Sorted ascending. */
export async function availableTimesRange(studentId: string, type: SessionType, focus: PiFocus | null, rangeFrom: Date, rangeTo: Date) {
  const s = await getSettings();
  const t = now();
  const earliest = new Date(Math.max(rangeFrom.getTime(), t.getTime() + s.minLeadHours * HOUR));
  if (earliest >= rangeTo) return [];
  const slots = await db.slot.findMany({
    where: { startsAt: { gte: earliest, lt: rangeTo }, ...openOrExpiredHold(t), mentor: mentorFilter(type) },
    include: { mentor: { select: { id: true, tier: true, isAdminMentor: true } } },
    orderBy: { startsAt: "asc" },
  });
  const mine = await db.session.findMany({ where: { studentId, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gte: earliest, lt: rangeTo } }, select: { startsAt: true } });
  const busy = new Set(mine.map((m) => m.startsAt?.getTime()));
  const seniorRequired = needsSenior(type, focus, s.seniorRequiredFocuses);

  const byTime = new Map<number, Candidate[]>();
  for (const sl of slots) {
    const list = byTime.get(sl.startsAt.getTime()) ?? [];
    list.push({ slotId: sl.id, mentorId: sl.mentorId, tier: sl.mentor.tier, isAdminMentor: sl.mentor.isAdminMentor, load: 0 });
    byTime.set(sl.startsAt.getTime(), list);
  }
  return [...byTime.entries()].filter(([ms, c]) => !busy.has(ms) && pickCandidate(c, seniorRequired) !== null).map(([ms]) => new Date(ms));
}

export async function availableTimes(studentId: string, type: SessionType, focus: PiFocus | null, day: string) {
  const { from, to } = istDayRange(day);
  return availableTimesRange(studentId, type, focus, from, to);
}

/** Step 1: put one mentor's slot on a short hold for this student. Replaces any earlier hold they had. */
export async function holdSlot(studentId: string, type: SessionType, focus: PiFocus | null, startsAt: Date) {
  const s = await getSettings();
  if (startsAt.getTime() < now().getTime() + s.minLeadHours * HOUR) throw new BookingError("That time is too soon to book.", "POLICY");
  return db.$transaction(async (tx) => {
    await lockUser(tx, studentId);
    const bal = (await getBalances(tx, studentId))[sessionCreditKind(type)];
    if (!bal || bal.available < 1) throw new BookingError("You have no credit left for this session type.", "NO_CREDIT");

    await tx.slot.updateMany({ where: { heldById: studentId, status: "HELD" }, data: { status: "OPEN", heldById: null, heldUntil: null } });

    let cands = await candidatesAt(tx, type, startsAt);
    const seniorRequired = needsSenior(type, focus, s.seniorRequiredFocuses);
    const heldUntil = new Date(now().getTime() + s.holdMinutes * 60_000);
    while (cands.length) {
      const pick = pickCandidate(cands, seniorRequired);
      if (!pick) break;
      // Conditional update: only one of two racing students can flip the slot to HELD.
      const r = await tx.slot.updateMany({ where: { id: pick.slotId, ...openOrExpiredHold(now()) }, data: { status: "HELD", heldById: studentId, heldUntil } });
      if (r.count === 1) return { slotId: pick.slotId, heldUntil };
      cands = cands.filter((c) => c.slotId !== pick.slotId);
    }
    throw new BookingError("Someone just took that time. Pick another.", "TAKEN");
  });
}

export async function releaseHold(studentId: string, slotId: string) {
  await db.slot.updateMany({ where: { id: slotId, heldById: studentId, status: "HELD" }, data: { status: "OPEN", heldById: null, heldUntil: null } });
}

/** Step 2: confirm a held slot. Reserves the credit, creates the session, then auto-confirms or queues for approval. */
export async function confirmBooking(studentId: string, slotId: string, type: SessionType, focus: PiFocus | null) {
  const s = await getSettings();
  const session = await db.$transaction(async (tx) => {
    await lockUser(tx, studentId);
    const slot = await tx.slot.findUnique({ where: { id: slotId }, include: { mentor: true } });
    if (!slot || slot.heldById !== studentId || slot.status !== "HELD" || !slot.heldUntil || slot.heldUntil < now()) {
      throw new BookingError("Your hold on that slot expired. Pick a time again.", "HOLD_EXPIRED");
    }
    try {
      const created = await tx.session.create({
        data: {
          type, focus, studentId, mentorId: slot.mentorId, slotId: slot.id, startsAt: slot.startsAt, endsAt: slot.endsAt,
          meetingUrl: slot.mentor.meetingUrl, status: s.bookingMode === "AUTO_CONFIRM" ? "CONFIRMED" : "REQUESTED",
        },
      });
      await reserveCredit(tx, { userId: studentId, kind: sessionCreditKind(type), sessionId: created.id });
      await tx.slot.update({ where: { id: slot.id }, data: { status: "BOOKED", heldUntil: null } });
      return { ...created, mentorUserId: slot.mentor.userId };
    } catch (e) {
      if (e instanceof InsufficientCreditsError) throw new BookingError("You have no credit left for this session type.", "NO_CREDIT");
      throw e;
    }
  });

  await afterBooked(session.id, "new");
  return session;
}

/** Emails and in-app notices after a booking or move. Never affects the booking itself. */
async function afterBooked(sessionId: string, kind: "new" | "moved") {
  const s = await db.session.findUnique({ where: { id: sessionId }, include: { student: true, mentor: { include: { user: true } } } });
  if (!s || !s.startsAt || !s.student) return;
  const settings = await getSettings();
  const title = sessionTitle(s.type, s.focus);
  const deadline = fmtWhen(new Date(s.startsAt.getTime() - settings.cancelNoticeHours * HOUR));
  const vars = { session: title, when: fmtWhen(s.startsAt), time: fmtTime(s.startsAt), deadline };
  if (s.status === "CONFIRMED") {
    await sendEmail({ template: kind === "new" ? "booking_confirmed" : "session_rescheduled", to: s.student.email, vars: { ...vars, detail: `Your ${title} is now ${vars.when} IST.` }, url: `/student/sessions/${s.id}`,
      details: [{ k: "Session", v: title }, { k: "When", v: `${vars.when} IST` }] });
  } else {
    await sendEmail({ template: "booking_requested", to: s.student.email, vars, url: "/student/sessions" });
  }
  await notify(s.student.id, { title: s.status === "CONFIRMED" ? `${title} confirmed — ${vars.when}` : `Request received — ${title}, ${vars.when}`, href: `/student/sessions/${s.id}` });
  if (s.mentor && s.status === "CONFIRMED") {
    await sendEmail({ template: "mentor_assignment", to: s.mentor.user.email, vars: { student: s.student.name ?? "A student", when: vars.when, detail: `${title} with ${s.student.name ?? "a student"}, ${vars.when} IST. Feedback is due ${settings.feedbackDueHours} hours after the session.` }, url: `/mentor/sessions/${s.id}` });
    await notify(s.mentor.userId, { title: `New session: ${s.student.name ?? "Student"}, ${vars.when}`, href: `/mentor/sessions/${s.id}` });
  }
}

export async function cancelSession(studentId: string, sessionId: string) {
  const s = await getSettings();
  const t = now();
  const result = await db.$transaction(async (tx) => {
    await lockUser(tx, studentId);
    const sess = await tx.session.findUnique({ where: { id: sessionId } });
    if (!sess || sess.studentId !== studentId) throw new BookingError("Session not found.", "NOT_FOUND");
    if (sess.status !== "CONFIRMED" && sess.status !== "REQUESTED") throw new BookingError("This session can't be cancelled.", "NOT_ALLOWED");
    if (!sess.startsAt) throw new BookingError("Session has no time.", "NOT_ALLOWED");
    const outcome = cancelOutcome(sess.startsAt, t, s.cancelNoticeHours);
    const kind = sessionCreditKind(sess.type);
    await tx.session.update({ where: { id: sess.id }, data: { status: "CANCELLED", cancelledAt: t } });
    if (sess.slotId) await tx.slot.update({ where: { id: sess.slotId }, data: { status: "OPEN", heldById: null, heldUntil: null } });
    if (outcome === "RELEASE") await releaseCredit(tx, { userId: studentId, kind, sessionId: sess.id, reason: "Cancelled with notice" });
    else await consumeCredit(tx, { userId: studentId, kind, sessionId: sess.id, reason: `Late cancel (under ${s.cancelNoticeHours}h)` });
    if (sess.gdBatchId) await tx.gdParticipant.updateMany({ where: { batchId: sess.gdBatchId, studentId }, data: { status: "LEFT" } });
    return { sess, outcome };
  });
  await afterCancel(result.sess.id, result.outcome);
  if (result.sess.gdBatchId) await promoteWaitlist(result.sess.gdBatchId);
  return result.outcome;
}

async function afterCancel(sessionId: string, outcome: "RELEASE" | "CONSUME") {
  const s = await db.session.findUnique({ where: { id: sessionId }, include: { student: true, mentor: { include: { user: true } } } });
  if (!s?.startsAt || !s.student) return;
  const title = sessionTitle(s.type, s.focus);
  const settings = await getSettings();
  await sendEmail({ template: "session_cancelled", to: s.student.email, vars: { session: title, when: fmtWhen(s.startsAt), detail: outcome === "RELEASE" ? "Your credit has been returned." : `Cancelled under ${settings.cancelNoticeHours} hours before the start, so the credit was used.` }, url: "/student/book" });
  if (s.mentor) {
    await sendEmail({ template: "mentor_availability_change", to: s.mentor.user.email, vars: { when: fmtWhen(s.startsAt), detail: `${s.student.name ?? "A student"} cancelled ${title} on ${fmtWhen(s.startsAt)}. The slot is open again.` }, url: "/mentor/availability" });
    await notify(s.mentor.userId, { title: `Cancelled: ${s.student.name ?? "student"}, ${fmtWhen(s.startsAt)}`, href: "/mentor/sessions" });
  }
}

/** Move a confirmed session to a new held slot. The credit stays reserved; limits and notice come from Settings. */
export async function rescheduleSession(studentId: string, sessionId: string, newSlotId: string) {
  const s = await getSettings();
  const t = now();
  await db.$transaction(async (tx) => {
    await lockUser(tx, studentId);
    const sess = await tx.session.findUnique({ where: { id: sessionId } });
    if (!sess || sess.studentId !== studentId || !sess.startsAt) throw new BookingError("Session not found.", "NOT_FOUND");
    if (sess.status !== "CONFIRMED" && sess.status !== "REQUESTED") throw new BookingError("This session can't be moved.", "NOT_ALLOWED");
    if (sess.type === "GD_BATCH") throw new BookingError("GD batches can't be rescheduled. Leave and join another.", "NOT_ALLOWED");
    if (!canReschedule(sess.startsAt, t, s.cancelNoticeHours, sess.rescheduleCount, s.maxReschedules)) {
      throw new BookingError(`Rescheduling is free up to ${s.cancelNoticeHours} hours before, and ${s.maxReschedules} times per session.`, "POLICY");
    }
    const slot = await tx.slot.findUnique({ where: { id: newSlotId }, include: { mentor: true } });
    if (!slot || slot.heldById !== studentId || slot.status !== "HELD" || !slot.heldUntil || slot.heldUntil < t) throw new BookingError("Your hold on that slot expired.", "HOLD_EXPIRED");
    if (sess.slotId) await tx.slot.update({ where: { id: sess.slotId }, data: { status: "OPEN" } });
    await tx.session.update({
      where: { id: sess.id },
      data: { slotId: slot.id, mentorId: slot.mentorId, startsAt: slot.startsAt, endsAt: slot.endsAt, meetingUrl: slot.mentor.meetingUrl, rescheduleCount: { increment: 1 }, reminder24Sent: false, reminder1Sent: false },
    });
    await tx.slot.update({ where: { id: slot.id }, data: { status: "BOOKED", heldUntil: null } });
  });
  await afterBooked(sessionId, "moved");
}

// ───────────── GD / GE batches ─────────────

export async function joinGd(studentId: string, batchId: string) {
  const s = await getSettings();
  const out = await db.$transaction(async (tx) => {
    await lockUser(tx, studentId);
    const batch = await tx.gdBatch.findUnique({ where: { id: batchId }, include: { participants: true } });
    if (!batch || batch.status === "CANCELLED" || batch.startsAt < now()) throw new BookingError("This batch isn't open.", "NOT_FOUND");
    const mine = batch.participants.find((p) => p.studentId === studentId);
    if (mine && mine.status !== "LEFT") return { state: mine.status as "JOINED" | "WAITLISTED", sessionId: null as string | null };
    const joined = batch.participants.filter((p) => p.status === "JOINED").length;
    const state = joined < (batch.capacity || s.gdCapacity) ? "JOINED" : "WAITLISTED";
    if (mine) await tx.gdParticipant.update({ where: { id: mine.id }, data: { status: state, joinedAt: now() } });
    else await tx.gdParticipant.create({ data: { batchId, studentId, status: state } });
    if (state === "WAITLISTED") return { state, sessionId: null };
    const bal = (await getBalances(tx, studentId)).GD;
    if (!bal || bal.available < 1) throw new BookingError("You have no GD credit left.", "NO_CREDIT");
    const sess = await tx.session.create({ data: { type: "GD_BATCH", status: "CONFIRMED", studentId, mentorId: batch.moderatorId, startsAt: batch.startsAt, endsAt: batch.endsAt, gdBatchId: batch.id, meetingUrl: batch.meetingUrl } });
    await reserveCredit(tx, { userId: studentId, kind: "GD", sessionId: sess.id });
    return { state, sessionId: sess.id };
  });
  if (out.sessionId) await afterBooked(out.sessionId, "new");
  return out.state;
}

/** Promote waitlisted students (oldest first) while seats are free and they hold a GD credit. */
export async function promoteWaitlist(batchId: string) {
  const batch = await db.gdBatch.findUnique({ where: { id: batchId }, include: { participants: { orderBy: { joinedAt: "asc" } } } });
  if (!batch) return;
  let free = batch.capacity - batch.participants.filter((p) => p.status === "JOINED").length;
  for (const p of batch.participants.filter((x) => x.status === "WAITLISTED")) {
    if (free <= 0) break;
    try {
      const sessionId = await db.$transaction(async (tx) => {
        await lockUser(tx, p.studentId);
        const bal = (await getBalances(tx, p.studentId)).GD;
        if (!bal || bal.available < 1) return null;
        await tx.gdParticipant.update({ where: { id: p.id }, data: { status: "JOINED" } });
        const sess = await tx.session.create({ data: { type: "GD_BATCH", status: "CONFIRMED", studentId: p.studentId, mentorId: batch.moderatorId, startsAt: batch.startsAt, endsAt: batch.endsAt, gdBatchId: batch.id, meetingUrl: batch.meetingUrl } });
        await reserveCredit(tx, { userId: p.studentId, kind: "GD", sessionId: sess.id });
        return sess.id;
      });
      if (sessionId) { free--; await afterBooked(sessionId, "new"); await notify(p.studentId, { title: `A seat opened: ${batch.topic}`, href: "/student/gd" }); }
    } catch (e) { console.error("promote failed", e); }
  }
}

/** Leaving a batch = cancelling the student's GD session (same notice rules as any other cancellation). */
export async function leaveGd(studentId: string, batchId: string) {
  const sess = await db.session.findFirst({ where: { studentId, gdBatchId: batchId, status: { in: ["CONFIRMED", "REQUESTED"] } } });
  if (sess) return cancelSession(studentId, sess.id);
  await db.gdParticipant.updateMany({ where: { batchId, studentId, status: "WAITLISTED" }, data: { status: "LEFT" } });
  return "RELEASE" as const;
}

/** Cron: free every hold that timed out. */
export async function expireHolds() {
  const r = await db.slot.updateMany({ where: { status: "HELD", heldUntil: { lt: now() } }, data: { status: "OPEN", heldById: null, heldUntil: null } });
  return r.count;
}

export { fmtDay };
