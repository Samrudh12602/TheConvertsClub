"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PiFocus, SessionType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireStudent } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { audit } from "@/server/audit";
import { notify } from "@/server/notify";
import { availableTimesRange, BookingError, cancelSession, confirmBooking, holdSlot, joinGd, leaveGd, releaseHold, rescheduleSession } from "@/server/booking";
import { HOUR } from "@/server/scheduling";

type Ok<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => {
  if (e instanceof BookingError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};

const typeSchema = z.enum(["MOCK_PI", "STRATEGY_CALL", "GUIDANCE"]);
const focusSchema = z.enum(["HR_PROFILE", "ACADEMICS", "STRESS", "INSTITUTE_FINAL", "CURRENT_AFFAIRS", "CROSS_QUESTIONING"]).nullable();

async function guard(scope: string) {
  const user = await requireStudent();
  const rl = await rateLimit(`${scope}:${user.id}`, 60, 600);
  if (!rl.ok) throw new BookingError("Too many requests. Slow down for a minute.", "POLICY");
  return user;
}

/** All bookable times in the next 14 days for a type/focus. Grouped by day on the client. */
export async function getTimesAction(type: string, focus: string | null): Promise<Ok<{ times: string[] }>> {
  try {
    const user = await guard("times");
    const t = typeSchema.parse(type);
    const f = focusSchema.parse(t === "MOCK_PI" ? focus : null);
    const now = new Date();
    const times = await availableTimesRange(user.id, t, f as PiFocus | null, now, new Date(now.getTime() + 15 * 24 * HOUR));
    return { ok: true, times: times.map((d) => d.toISOString()) };
  } catch (e) { return fail(e); }
}

export async function holdAction(type: string, focus: string | null, iso: string): Promise<Ok<{ slotId: string; heldUntil: string }>> {
  try {
    const user = await guard("hold");
    const t = typeSchema.parse(type);
    const h = await holdSlot(user.id, t as SessionType, focusSchema.parse(t === "MOCK_PI" ? focus : null) as PiFocus | null, new Date(iso));
    return { ok: true, slotId: h.slotId, heldUntil: h.heldUntil.toISOString() };
  } catch (e) { return fail(e); }
}

export async function releaseHoldAction(slotId: string): Promise<Ok> {
  try { const user = await guard("hold"); await releaseHold(user.id, slotId); return { ok: true }; } catch (e) { return fail(e); }
}

export async function confirmBookingAction(slotId: string, type: string, focus: string | null): Promise<Ok<{ sessionId: string; status: string }>> {
  try {
    const user = await guard("book");
    const t = typeSchema.parse(type);
    const s = await confirmBooking(user.id, slotId, t as SessionType, focusSchema.parse(t === "MOCK_PI" ? focus : null) as PiFocus | null);
    revalidatePath("/student", "layout");
    return { ok: true, sessionId: s.id, status: s.status };
  } catch (e) { return fail(e); }
}

export async function rescheduleAction(sessionId: string, slotId: string): Promise<Ok> {
  try {
    const user = await guard("book");
    await rescheduleSession(user.id, sessionId, slotId);
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function cancelSessionAction(sessionId: string): Promise<Ok<{ outcome: "RELEASE" | "CONSUME" }>> {
  try {
    const user = await guard("book");
    const outcome = await cancelSession(user.id, sessionId);
    revalidatePath("/student", "layout");
    return { ok: true, outcome };
  } catch (e) { return fail(e); }
}

export async function joinGdAction(batchId: string): Promise<Ok<{ state: string }>> {
  try {
    const user = await guard("gd");
    const state = await joinGd(user.id, batchId);
    revalidatePath("/student", "layout");
    return { ok: true, state };
  } catch (e) { return fail(e); }
}

export async function leaveGdAction(batchId: string): Promise<Ok> {
  try { const user = await guard("gd"); await leaveGd(user.id, batchId); revalidatePath("/student", "layout"); return { ok: true }; } catch (e) { return fail(e); }
}

export async function rateSessionAction(sessionId: string, rating: number, comment?: string): Promise<Ok> {
  try {
    const user = await guard("rate");
    const r = z.number().int().min(1).max(5).parse(rating);
    const s = await db.session.findUnique({ where: { id: sessionId } });
    if (!s || s.studentId !== user.id || s.status !== "COMPLETED") throw new BookingError("You can rate a completed session.", "NOT_ALLOWED");
    await db.sessionRating.upsert({ where: { sessionId }, update: { rating: r, comment: comment?.slice(0, 500) }, create: { sessionId, studentId: user.id, rating: r, comment: comment?.slice(0, 500) } });
    revalidatePath(`/student/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) { return fail(e); }
}

const callSchema = z.object({ institute: z.string().trim().min(2).max(80), interviewDate: z.string().optional(), stage: z.string().trim().max(120).optional() });

export async function addCallAction(_prev: unknown, fd: FormData): Promise<Ok> {
  try {
    const user = await guard("calls");
    const p = callSchema.safeParse({ institute: fd.get("institute"), interviewDate: fd.get("interviewDate") || undefined, stage: fd.get("stage") || undefined });
    if (!p.success) return { ok: false, error: "Enter the institute name." };
    await db.callTracker.create({ data: { studentId: user.id, institute: p.data.institute, stage: p.data.stage, interviewDate: p.data.interviewDate ? new Date(`${p.data.interviewDate}T09:00:00+05:30`) : null, outcome: p.data.interviewDate ? "SCHEDULED" : "WAITING" } });
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function setCallOutcomeAction(callId: string, outcome: "SCHEDULED" | "WAITING" | "CONVERTED" | "REJECTED"): Promise<Ok> {
  try {
    const user = await guard("calls");
    await db.callTracker.updateMany({ where: { id: callId, studentId: user.id }, data: { outcome } });
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (e) { return fail(e); }
}

const onboardingSchema = z.object({
  college: z.string().trim().max(120).optional(), degree: z.string().trim().max(120).optional(),
  workExMonths: z.coerce.number().int().min(0).max(240).optional(),
  targetInstitutes: z.array(z.string().max(60)).max(20).default([]), weakAreas: z.array(z.string().max(60)).max(12).default([]),
  phone: z.string().trim().max(20).optional(),
});

export async function saveOnboardingAction(step: number, data: unknown): Promise<Ok> {
  try {
    const user = await guard("onboarding");
    const d = onboardingSchema.parse(data);
    const finished = step >= 4;
    await db.studentProfile.upsert({
      where: { userId: user.id },
      update: { ...d, onboardingStep: Math.max(step, 0), onboardedAt: finished ? new Date() : undefined },
      create: { userId: user.id, ...d, onboardingStep: step, onboardedAt: finished ? new Date() : null },
    });
    if (d.phone) await db.user.update({ where: { id: user.id }, data: { phone: d.phone } });
    if (d.targetInstitutes.length) {
      const have = new Set((await db.callTracker.findMany({ where: { studentId: user.id }, select: { institute: true } })).map((c) => c.institute));
      const fresh = d.targetInstitutes.filter((i) => !have.has(i));
      if (fresh.length) await db.callTracker.createMany({ data: fresh.map((institute) => ({ studentId: user.id, institute, outcome: "WAITING" as const })) });
    }
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (e) { return fail(e); }
}

/** DPDP-style deletion request: recorded, the admin is told, and uploads are purged within 30 days. */
export async function requestDeletionAction(): Promise<Ok> {
  try {
    const user = await guard("deletion");
    await audit({ actorId: user.id, action: "account.deletion_requested", entity: "User", entityId: user.id });
    const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    for (const a of admins) await notify(a.id, { title: `Deletion requested: ${user.email}`, href: `/admin/students/${user.id}` });
    return { ok: true };
  } catch (e) { return fail(e); }
}
