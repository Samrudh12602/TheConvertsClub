import type { Recommendation } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { RUBRIC, sessionTitle, REVIEW_LABEL } from "@/lib/labels";
import { fmtWhen } from "@/lib/format";
import { consumeCredit, lockUser, reviewCreditKind, sessionCreditKind } from "@/server/credits";
import { accrualFor, overallScore, serviceForReview, serviceForSession, type RateTable } from "@/server/payroll";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";

export class FeedbackError extends Error {}

export interface FeedbackInput {
  scores: Record<string, number>;
  strengths: string;
  weaknesses: string;
  redFlags?: string;
  answerFraming?: string;
  questionsToPrepare?: string;
  recommendation: Recommendation;
  privateNote?: string;
}

function validate(i: FeedbackInput) {
  for (const r of RUBRIC) {
    const v = i.scores[r];
    if (!Number.isFinite(v) || v < 1 || v > 10) throw new FeedbackError(`Score "${r}" must be between 1 and 10.`);
  }
  if (i.strengths.trim().length < 10) throw new FeedbackError("Strengths need a sentence or two.");
  if (i.weaknesses.trim().length < 10) throw new FeedbackError("Weaknesses need a sentence or two.");
}

async function rateTable(): Promise<RateTable> {
  const rows = await db.payRate.findMany();
  return Object.fromEntries(rows.map((r) => [`${r.tier}:${r.service}`, r.amountPaise])) as RateTable;
}

/**
 * Mentor submits feedback for a session. In ONE transaction: save feedback, mark the session completed,
 * use up the reserved credit, and snapshot the mentor's current rate as a PayoutAccrual. Pay accrues only here,
 * never at payment or booking time, and later rate or tier changes never alter it.
 */
export async function submitSessionFeedback(mentorId: string, sessionId: string, input: FeedbackInput) {
  validate(input);
  const settings = await getSettings();
  const rates = await rateTable();
  const done = await db.$transaction(async (tx) => {
    const s = await tx.session.findUnique({ where: { id: sessionId }, include: { mentor: true, feedback: true } });
    if (!s || s.mentorId !== mentorId || !s.studentId) throw new FeedbackError("Session not found.");
    if (s.feedback) throw new FeedbackError("Feedback was already submitted for this session.");
    if (s.status !== "CONFIRMED" && s.status !== "IN_PROGRESS") throw new FeedbackError("Only confirmed sessions can be completed.");
    if (s.startsAt && s.startsAt.getTime() > Date.now()) throw new FeedbackError("You can submit feedback once the session has started.");
    await lockUser(tx, s.studentId);
    const overall = overallScore(input.scores);
    await tx.feedback.create({ data: { sessionId, mentorId, scores: input.scores, overall, strengths: input.strengths.trim(), weaknesses: input.weaknesses.trim(), redFlags: input.redFlags?.trim() || null, answerFraming: input.answerFraming?.trim() || null, questionsToPrepare: input.questionsToPrepare?.trim() || null, recommendation: input.recommendation, privateNote: input.privateNote?.trim() || null } });
    await tx.session.update({ where: { id: sessionId }, data: { status: "COMPLETED" } });
    await consumeCredit(tx, { userId: s.studentId, kind: sessionCreditKind(s.type), sessionId });

    const service = serviceForSession(s.type);
    let accrued = 0;
    if (service && (!s.mentor?.isAdminMentor || settings.adminAccrues)) {
      // A GD batch pays once, when the first participant's feedback is submitted.
      const alreadyPaid = s.gdBatchId ? await tx.payoutAccrual.count({ where: { session: { gdBatchId: s.gdBatchId } } }) : 0;
      const a = alreadyPaid ? null : accrualFor(s.mentor!.tier, service, rates);
      if (a) {
        await tx.payoutAccrual.create({ data: { mentorId, sessionId, service, tierSnapshot: s.mentor!.tier, ...a } });
        accrued = a.amountPaise;
      }
    }
    return { sessionId, studentId: s.studentId, type: s.type, focus: s.focus, startsAt: s.startsAt, overall, accrued };
  });

  const student = await db.user.findUnique({ where: { id: done.studentId } });
  if (student) {
    const title = sessionTitle(done.type, done.focus);
    await sendEmail({ template: "feedback_published", to: student.email, vars: { session: title, score: done.overall.toFixed(1) }, url: `/student/sessions/${done.sessionId}`,
      details: [{ k: "Session", v: title }, { k: "Overall", v: done.overall.toFixed(1) }] });
    await notify(student.id, { title: `Feedback ready: ${title}`, href: `/student/sessions/${done.sessionId}` });
  }
  return done;
}

/** Same as above for an async WAT/SOP review. */
export async function submitReviewFeedback(mentorId: string, reviewId: string, input: FeedbackInput) {
  validate(input);
  const settings = await getSettings();
  const rates = await rateTable();
  const done = await db.$transaction(async (tx) => {
    const r = await tx.review.findUnique({ where: { id: reviewId }, include: { assignedMentor: true, feedback: true } });
    if (!r || r.assignedMentorId !== mentorId) throw new FeedbackError("Review not found.");
    if (r.feedback || r.status === "COMPLETED") throw new FeedbackError("This review is already complete.");
    await lockUser(tx, r.studentId);
    const overall = overallScore(input.scores);
    await tx.feedback.create({ data: { reviewId, mentorId, scores: input.scores, overall, strengths: input.strengths.trim(), weaknesses: input.weaknesses.trim(), redFlags: input.redFlags?.trim() || null, answerFraming: input.answerFraming?.trim() || null, questionsToPrepare: input.questionsToPrepare?.trim() || null, recommendation: input.recommendation, privateNote: input.privateNote?.trim() || null } });
    await tx.review.update({ where: { id: reviewId }, data: { status: "COMPLETED", completedAt: new Date() } });
    await consumeCredit(tx, { userId: r.studentId, kind: reviewCreditKind(r.kind), reviewId });
    const service = serviceForReview(r.kind);
    const a = !r.assignedMentor?.isAdminMentor || settings.adminAccrues ? accrualFor(r.assignedMentor!.tier, service, rates) : null;
    if (a) await tx.payoutAccrual.create({ data: { mentorId, reviewId, service, tierSnapshot: r.assignedMentor!.tier, ...a } });
    return { studentId: r.studentId, kind: r.kind, reviewId };
  });
  const student = await db.user.findUnique({ where: { id: done.studentId } });
  if (student) {
    await sendEmail({ template: "review_completed", to: student.email, vars: { session: REVIEW_LABEL[done.kind] }, url: "/student/reviews" });
    await notify(student.id, { title: `${REVIEW_LABEL[done.kind]} is ready`, href: "/student/reviews" });
  }
  return done;
}

/** No-show: the reserved credit is consumed. No mentor pay accrues (assumption, see docs/DECISIONS.md). */
export async function markNoShow(sessionId: string, actor: { mentorId?: string; isAdmin?: boolean }) {
  await db.$transaction(async (tx) => {
    const s = await tx.session.findUnique({ where: { id: sessionId } });
    if (!s || !s.studentId) throw new FeedbackError("Session not found.");
    if (!actor.isAdmin && s.mentorId !== actor.mentorId) throw new FeedbackError("Not your session.");
    if (s.status !== "CONFIRMED") throw new FeedbackError("Only confirmed sessions can be marked no-show.");
    if (s.startsAt && s.startsAt.getTime() > Date.now()) throw new FeedbackError("The session hasn't started yet.");
    await lockUser(tx, s.studentId);
    await tx.session.update({ where: { id: sessionId }, data: { status: "NO_SHOW" } });
    await consumeCredit(tx, { userId: s.studentId, kind: sessionCreditKind(s.type), sessionId, reason: "No-show" });
  });
}

export { fmtWhen };
