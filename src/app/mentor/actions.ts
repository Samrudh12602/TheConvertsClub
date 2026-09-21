"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireMentor } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { AvailabilityError, addWindow, blockDate, copyPreviousWeek, toggleSlot, unblockDate } from "@/server/availability";
import { FeedbackError, markNoShow, submitReviewFeedback, submitSessionFeedback, type FeedbackInput } from "@/server/feedback";
import { encryptJson } from "@/server/crypto";
import { audit } from "@/server/audit";
import { RUBRIC } from "@/lib/labels";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const fail = (e: unknown): Result => {
  if (e instanceof AvailabilityError || e instanceof FeedbackError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{1,2}:\d{2}$/);

async function guard() {
  const m = await requireMentor();
  if (!(await rateLimit(`mentor:${m.user.id}`, 120, 600)).ok) throw new AvailabilityError("Too many requests. Slow down for a minute.");
  return m;
}
const refresh = () => { revalidatePath("/mentor", "layout"); revalidatePath("/student", "layout"); };

export async function addWindowAction(input: { date: string; from: string; to: string; repeatUntil?: string }): Promise<Result> {
  try {
    const { mentor } = await guard();
    const p = z.object({ date, from: time, to: time, repeatUntil: date.optional().or(z.literal("")) }).parse(input);
    const n = await addWindow(mentor.id, p.date, p.from, p.to, p.repeatUntil || undefined);
    refresh();
    return { ok: true, message: `${n} slot${n === 1 ? "" : "s"} added.` };
  } catch (e) { return fail(e); }
}

export async function copyWeekAction(weekStart: string): Promise<Result> {
  try { const { mentor } = await guard(); const n = await copyPreviousWeek(mentor.id, date.parse(weekStart)); refresh(); return { ok: true, message: `${n} slot${n === 1 ? "" : "s"} copied from last week.` }; } catch (e) { return fail(e); }
}

export async function blockDateAction(d: string, unblock = false): Promise<Result> {
  try { const { mentor } = await guard(); const n = unblock ? await unblockDate(mentor.id, date.parse(d)) : await blockDate(mentor.id, date.parse(d)); refresh(); return { ok: true, message: `${n} slot${n === 1 ? "" : "s"} ${unblock ? "reopened" : "blocked"}.` }; } catch (e) { return fail(e); }
}

export async function toggleSlotAction(iso: string): Promise<Result> {
  try { const { mentor } = await guard(); await toggleSlot(mentor.id, new Date(iso)); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

const fb = z.object({
  scores: z.record(z.string(), z.number().min(1).max(10)),
  strengths: z.string().max(4000), weaknesses: z.string().max(4000),
  redFlags: z.string().max(2000).optional(), answerFraming: z.string().max(4000).optional(), questionsToPrepare: z.string().max(2000).optional(),
  recommendation: z.enum(["READY", "NEARLY_THERE", "NEEDS_MORE_MOCKS", "REWORK_BASICS"]),
  privateNote: z.string().max(2000).optional(),
});

/** `id` is a session id or a review id; the server works out which and checks it's assigned to this mentor. */
export async function submitFeedbackAction(id: string, input: FeedbackInput): Promise<Result & { accruedPaise?: number }> {
  try {
    const { mentor } = await guard();
    const parsed: FeedbackInput = fb.parse(input);
    for (const r of RUBRIC) if (parsed.scores[r] === undefined) return { ok: false, error: `Score "${r}" is required.` };
    const session = await db.session.findUnique({ where: { id }, select: { id: true } });
    let accrued = 0;
    if (session) accrued = (await submitSessionFeedback(mentor.id, id, parsed)).accrued;
    else await submitReviewFeedback(mentor.id, id, parsed);
    refresh();
    return { ok: true, accruedPaise: accrued };
  } catch (e) { return fail(e); }
}

export async function noShowAction(sessionId: string): Promise<Result> {
  try { const { mentor } = await guard(); await markNoShow(sessionId, { mentorId: mentor.id }); refresh(); return { ok: true }; } catch (e) { return fail(e); }
}

const profile = z.object({ bio: z.string().max(300), meetingUrl: z.string().url().max(300).or(z.literal("")), status: z.enum(["ACTIVE", "PAUSED"]), upi: z.string().max(80).optional(), accountName: z.string().max(80).optional(), accountNumber: z.string().max(30).optional(), ifsc: z.string().max(15).optional() });

export async function saveProfileAction(input: unknown): Promise<Result> {
  try {
    const { user, mentor } = await guard();
    const p = profile.parse(input);
    const payout = p.upi || p.accountNumber ? encryptJson({ upi: p.upi || undefined, accountName: p.accountName || undefined, accountNumber: p.accountNumber || undefined, ifsc: p.ifsc || undefined }) : undefined;
    await db.mentorProfile.update({ where: { id: mentor.id }, data: { bio: p.bio, meetingUrl: p.meetingUrl || null, status: p.status, ...(payout ? { payoutEncrypted: payout } : {}) } });
    await audit({ actorId: user.id, action: "mentor.profile_update", entity: "MentorProfile", entityId: mentor.id, after: { status: p.status, payoutChanged: Boolean(payout) } });
    revalidatePath("/mentor", "layout");
    return { ok: true, message: "Saved." };
  } catch (e) { return fail(e); }
}
