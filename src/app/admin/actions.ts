"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { audit } from "@/server/audit";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";
import { sha256 } from "@/server/crypto";
import { appUrl } from "@/lib/env";
import { AdminError, approveAccruals, approveBonuses, assertConfigWritable, assignSession, confirmRequested, createPayoutRun, markPayoutPaid, previewBonuses, type Actor } from "@/server/admin";
import { cancelSession, BookingError } from "@/server/booking";
import { refundOrder, CheckoutError } from "@/server/checkout";
import { addMentorDirect, MentorAdminError, promoteApplication } from "@/server/mentors";
import type { Settings } from "@/lib/settings";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const fail = (e: unknown): Result => {
  if (e instanceof AdminError || e instanceof BookingError || e instanceof CheckoutError || e instanceof MentorAdminError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};

async function guard(scope: string): Promise<Actor> {
  const user = await requireAdmin();
  if (!(await rateLimit(`admin:${scope}:${user.id}`, 200, 600)).ok) throw new AdminError("Too many requests. Slow down for a minute.");
  return { id: user.id, isDemo: user.isDemo };
}
const refreshAll = () => { revalidatePath("/admin", "layout"); revalidatePath("/student", "layout"); revalidatePath("/mentor", "layout"); };

// ───────────── Scheduling ─────────────

export async function assignSessionAction(sessionId: string, mentorId: string): Promise<Result> {
  try { const actor = await guard("assign"); await assignSession(actor, sessionId, mentorId); refreshAll(); return { ok: true, message: "Assigned." }; } catch (e) { return fail(e); }
}

export async function confirmRequestedAction(sessionId: string): Promise<Result> {
  try { const actor = await guard("confirm"); await confirmRequested(actor, sessionId); refreshAll(); return { ok: true, message: "Confirmed." }; } catch (e) { return fail(e); }
}

export async function adminCancelSessionAction(sessionId: string): Promise<Result> {
  try {
    const actor = await guard("cancel");
    const s = await db.session.findUnique({ where: { id: sessionId }, select: { studentId: true, student: { select: { isDemo: true } } } });
    if (!s?.studentId) throw new AdminError("Session not found.");
    if (actor.isDemo && !s.student?.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    await cancelSession(s.studentId, sessionId);
    await audit({ actorId: actor.id, action: "session.admin_cancel", entity: "Session", entityId: sessionId });
    refreshAll();
    return { ok: true, message: "Cancelled." };
  } catch (e) { return fail(e); }
}

// ───────────── People ─────────────

const inviteSchema = z.object({ email: z.email(), tier: z.enum(["JUNIOR", "SENIOR"]) });

export async function inviteMentorAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("invite");
    assertConfigWritable(actor, "mentor invites");
    const p = inviteSchema.parse(input);
    const email = p.email.trim().toLowerCase();
    const existing = await db.mentorProfile.findFirst({ where: { user: { email } } });
    if (existing) throw new AdminError("That email is already a mentor.");
    const token = randomBytes(24).toString("hex");
    await db.mentorInvite.create({ data: { email, tokenHash: sha256(token), tier: p.tier, expiresAt: new Date(Date.now() + 7 * 86_400_000) } });
    await sendEmail({ template: "mentor_invite", to: email, url: `${appUrl()}/invite/${token}` });
    await audit({ actorId: actor.id, action: "mentor.invited", entity: "MentorInvite", after: { email, tier: p.tier } });
    return { ok: true, message: `Invite sent to ${email}.` };
  } catch (e) { return fail(e); }
}

const addMentorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  tier: z.enum(["JUNIOR", "SENIOR"]),
  college: z.string().trim().max(120).optional(),
  batchYear: z.coerce.number().int().min(1990).max(2100).optional(),
  bio: z.string().trim().max(300).optional(),
  meetingUrl: z.union([z.url(), z.literal("")]).optional(),
  linkedinUrl: z.union([z.url(), z.literal("")]).optional(),
  photoUrl: z.union([z.url(), z.literal("")]).optional(),
});

/** Bound directly to a <form action={...}>, so it can receive a File in the FormData. */
export async function addMentorDirectAction(_prev: Result | null, formData: FormData): Promise<Result> {
  try {
    const actor = await guard("mentor-add");
    const p = addMentorSchema.parse(Object.fromEntries(formData.entries()));
    const file = formData.get("photo");
    await addMentorDirect(actor, {
      ...p,
      photo: file instanceof File && file.size > 0 ? { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) } : undefined,
    });
    revalidatePath("/admin/mentors");
    revalidatePath("/mentors");
    return { ok: true, message: `${p.name} is set up. A login link has been emailed to them.` };
  } catch (e) {
    return fail(e);
  }
}

export async function promoteApplicationAction(applicationId: string, tier: unknown): Promise<Result> {
  try {
    const actor = await guard("app-promote");
    const t = z.enum(["JUNIOR", "SENIOR"]).parse(tier);
    await promoteApplication(actor, applicationId, t);
    revalidatePath("/admin/applications");
    revalidatePath("/admin/mentors");
    revalidatePath("/mentors");
    return { ok: true, message: "Promoted to mentor. A login link has been emailed to them." };
  } catch (e) { return fail(e); }
}

const tierSchema = z.enum(["JUNIOR", "SENIOR"]);
export async function setMentorTierAction(mentorId: string, tier: unknown): Promise<Result> {
  try {
    const actor = await guard("mentor-tier");
    const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true } });
    if (!m) throw new AdminError("Mentor not found.");
    if (actor.isDemo && !m.user.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    const before = m.tier;
    const nextTier = tierSchema.parse(tier);
    await db.mentorProfile.update({ where: { id: mentorId }, data: { tier: nextTier } });
    await audit({ actorId: actor.id, action: "mentor.tier_change", entity: "MentorProfile", entityId: mentorId, before: { tier: before }, after: { tier: nextTier } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Tier updated." };
  } catch (e) { return fail(e); }
}

const statusSchema = z.enum(["ACTIVE", "PAUSED", "OFFBOARDED"]);
export async function setMentorStatusAction(mentorId: string, status: unknown): Promise<Result> {
  try {
    const actor = await guard("mentor-status");
    const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true } });
    if (!m) throw new AdminError("Mentor not found.");
    if (actor.isDemo && !m.user.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    const nextStatus = statusSchema.parse(status);
    await db.mentorProfile.update({ where: { id: mentorId }, data: { status: nextStatus } });
    await audit({ actorId: actor.id, action: "mentor.status_change", entity: "MentorProfile", entityId: mentorId, after: { status: nextStatus } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Status updated." };
  } catch (e) { return fail(e); }
}

export async function setStudentStatusAction(userId: string, status: unknown): Promise<Result> {
  try {
    const actor = await guard("student-status");
    const s = await db.user.findUnique({ where: { id: userId } });
    if (!s) throw new AdminError("Student not found.");
    if (actor.isDemo && !s.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    const nextStatus = z.enum(["ACTIVE", "SUSPENDED"]).parse(status);
    await db.user.update({ where: { id: userId }, data: { status: nextStatus } });
    await audit({ actorId: actor.id, action: "student.status_change", entity: "User", entityId: userId, after: { status: nextStatus } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Updated." };
  } catch (e) { return fail(e); }
}

const adjustSchema = z.object({ userId: z.string(), kind: z.enum(["PI", "GD", "WAT", "SOP_BASIC", "SOP_DETAILED", "SOP_REVISION", "STRATEGY", "GUIDANCE"]), delta: z.coerce.number().int().min(-50).max(50), reason: z.string().trim().min(3).max(300) });
export async function adjustCreditAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("credit-adjust");
    const p = adjustSchema.parse(input);
    const student = await db.user.findUnique({ where: { id: p.userId } });
    if (!student) throw new AdminError("Student not found.");
    if (actor.isDemo && !student.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    const { adjustCredit, lockUser } = await import("@/server/credits");
    await db.$transaction(async (tx) => { await lockUser(tx, p.userId); await adjustCredit(tx, { userId: p.userId, kind: p.kind, delta: p.delta, reason: p.reason, createdById: actor.id }); });
    await audit({ actorId: actor.id, action: "credit.adjust", entity: "User", entityId: p.userId, after: p });
    revalidatePath("/admin", "layout"); revalidatePath("/student", "layout");
    return { ok: true, message: "Adjusted." };
  } catch (e) { return fail(e); }
}

const stageSchema = z.enum(["NEW", "SCREENING", "TRIAL_MOCK", "OFFER", "ACCEPTED", "REJECTED"]);
export async function setApplicationStageAction(id: string, stage: unknown): Promise<Result> {
  try { const actor = await guard("app-stage"); const next = stageSchema.parse(stage); await db.mentorApplication.update({ where: { id }, data: { stage: next } }); await audit({ actorId: actor.id, action: "application.stage_change", entity: "MentorApplication", entityId: id, after: { stage: next } }); revalidatePath("/admin/applications"); return { ok: true }; } catch (e) { return fail(e); }
}

// ───────────── Reviews (async WAT/SOP assignment) ─────────────

export async function assignReviewAction(reviewId: string, mentorId: string): Promise<Result> {
  try {
    const actor = await guard("assign-review");
    const r = await db.review.findUnique({ where: { id: reviewId }, include: { student: true } });
    if (!r) throw new AdminError("Review not found.");
    const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true } });
    if (!m || m.status !== "ACTIVE") throw new AdminError("That mentor isn't active.");
    if (actor.isDemo && (!m.user.isDemo || !r.student.isDemo)) throw new AdminError("The demo admin can only work with demo data.");
    await db.review.update({ where: { id: reviewId }, data: { assignedMentorId: mentorId, status: "ASSIGNED" } });
    await notify(m.userId, { title: "New review assigned to you", href: "/mentor/reviews" });
    await audit({ actorId: actor.id, action: "review.assign", entity: "Review", entityId: reviewId, after: { mentorId } });
    revalidatePath("/admin/reviews"); revalidatePath("/mentor/reviews");
    return { ok: true, message: "Assigned." };
  } catch (e) { return fail(e); }
}

// ───────────── Money ─────────────

export async function approveAccrualsAction(ids?: string[]): Promise<Result> {
  try { const actor = await guard("approve-accruals"); const n = await approveAccruals(actor, ids); revalidatePath("/admin/payouts"); return { ok: true, message: `${n} accrual${n === 1 ? "" : "s"} approved.` }; } catch (e) { return fail(e); }
}
export async function approveBonusesAction(): Promise<Result> {
  try { const actor = await guard("approve-bonuses"); const n = await approveBonuses(actor); revalidatePath("/admin/payouts"); return { ok: true, message: `${n} bonus${n === 1 ? "" : "es"} approved.` }; } catch (e) { return fail(e); }
}
export async function previewBonusesAction(): Promise<Result> {
  try { await guard("preview-bonuses"); const r = await previewBonuses(); revalidatePath("/admin/payouts"); return { ok: true, message: `${r.created.length} new bonus award${r.created.length === 1 ? "" : "s"} for ${r.periodKey}.` }; } catch (e) { return fail(e); }
}
export async function createPayoutRunAction(label: string): Promise<Result> {
  try { const actor = await guard("payout-run"); await createPayoutRun(actor, label.trim() || `Payout ${new Date().toISOString().slice(0, 10)}`); revalidatePath("/admin/payouts"); return { ok: true, message: "Run created." }; } catch (e) { return fail(e); }
}
export async function markPayoutPaidAction(payoutId: string, reference: string): Promise<Result> {
  try { const actor = await guard("mark-paid"); await markPayoutPaid(actor, payoutId, reference); revalidatePath("/admin/payouts"); return { ok: true, message: "Marked paid." }; } catch (e) { return fail(e); }
}

const refundSchema = z.object({ orderId: z.string(), amountPaise: z.coerce.number().int().min(0).optional(), reason: z.string().trim().min(3).max(300) });
export async function refundOrderAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("refund");
    const p = refundSchema.parse(input);
    const r = await refundOrder(actor, p.orderId, p.amountPaise || null, p.reason);
    revalidatePath("/admin/finance"); revalidatePath("/student", "layout");
    return { ok: true, message: `Refunded ${(r.amountPaise / 100).toFixed(2)} INR.` };
  } catch (e) { return fail(e); }
}

// ───────────── Products & coupons ─────────────

const productSchema = z.object({ id: z.string(), pricePaise: z.coerce.number().int().min(100), mrpPaise: z.coerce.number().int().min(0).optional(), active: z.boolean() });
export async function updateProductAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("product");
    assertConfigWritable(actor, "products");
    const p = productSchema.parse(input);
    await db.product.update({ where: { id: p.id }, data: { pricePaise: p.pricePaise, mrpPaise: p.mrpPaise || null, active: p.active } });
    await audit({ actorId: actor.id, action: "product.update", entity: "Product", entityId: p.id, after: p });
    revalidatePath("/", "layout"); revalidatePath("/admin/products");
    return { ok: true, message: "Saved." };
  } catch (e) { return fail(e); }
}

const couponSchema = z.object({ code: z.string().trim().min(3).max(24), type: z.enum(["PERCENT", "FLAT"]), value: z.coerce.number().int().min(1), maxUses: z.coerce.number().int().min(0).optional(), expiresAt: z.string().optional() });
export async function createCouponAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("coupon");
    assertConfigWritable(actor, "coupons");
    const p = couponSchema.parse(input);
    await db.coupon.create({ data: { code: p.code.toUpperCase(), type: p.type, value: p.value, maxUses: p.maxUses || null, expiresAt: p.expiresAt ? new Date(p.expiresAt) : null } });
    await audit({ actorId: actor.id, action: "coupon.create", entity: "Coupon", after: p });
    revalidatePath("/admin/products");
    return { ok: true, message: "Coupon created." };
  } catch (e) { return fail(e); }
}
export async function toggleCouponAction(id: string, active: boolean): Promise<Result> {
  try { const actor = await guard("coupon-toggle"); assertConfigWritable(actor, "coupons"); await db.coupon.update({ where: { id }, data: { active } }); revalidatePath("/admin/products"); return { ok: true }; } catch (e) { return fail(e); }
}

// ───────────── Settings ─────────────

const settingsSchema = z.object({
  bookingMode: z.enum(["AUTO_CONFIRM", "ADMIN_APPROVAL"]), holdMinutes: z.coerce.number().int().min(2).max(60),
  cancelNoticeHours: z.coerce.number().int().min(1).max(72), maxReschedules: z.coerce.number().int().min(0).max(10),
  refundWindowHours: z.coerce.number().int().min(1).max(168), recordingRetentionDays: z.coerce.number().int().min(0).max(365),
  gdCapacity: z.coerce.number().int().min(2).max(30), feedbackDueHours: z.coerce.number().int().min(1).max(168),
  gstEnabled: z.boolean(), adminAccrues: z.boolean(), minLeadHours: z.coerce.number().int().min(0).max(48),
  bonusPeriod: z.enum(["SEASON", "MONTH"]), seasonStart: z.string(), seasonEnd: z.string(),
  seniorRequiredFocuses: z.array(z.string()), mockCounts: z.array(z.string()),
});
export async function saveSettingsAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("settings");
    assertConfigWritable(actor, "settings");
    const p = settingsSchema.parse(input) as Settings;
    await db.$transaction(Object.entries(p).map(([key, value]) => db.setting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never } })));
    await audit({ actorId: actor.id, action: "settings.update", entity: "Setting", after: p as never });
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved." };
  } catch (e) { return fail(e); }
}
// ───────────── Content ─────────────

const testimonialSchema = z.object({ quote: z.string().trim().min(10).max(500), who: z.string().trim().min(2).max(100) });
export async function addTestimonialAction(input: unknown): Promise<Result> {
  try { const actor = await guard("content"); const p = testimonialSchema.parse(input); await db.testimonial.create({ data: { ...p, published: true } }); await audit({ actorId: actor.id, action: "content.testimonial_add", entity: "Testimonial" }); revalidatePath("/admin/content"); revalidatePath("/results"); return { ok: true, message: "Added." }; } catch (e) { return fail(e); }
}
export async function toggleTestimonialAction(id: string, published: boolean): Promise<Result> {
  try { await guard("content"); await db.testimonial.update({ where: { id }, data: { published } }); revalidatePath("/admin/content"); revalidatePath("/results"); return { ok: true }; } catch (e) { return fail(e); }
}
const faqSchema = z.object({ question: z.string().trim().min(5).max(200), answer: z.string().trim().min(5).max(1000) });
export async function addFaqAction(input: unknown): Promise<Result> {
  try { const actor = await guard("content"); const p = faqSchema.parse(input); await db.faqItem.create({ data: { ...p, published: true, sortOrder: 999 } }); await audit({ actorId: actor.id, action: "content.faq_add", entity: "FaqItem" }); revalidatePath("/admin/content"); revalidatePath("/faq"); return { ok: true, message: "Added." }; } catch (e) { return fail(e); }
}
export async function toggleFaqAction(id: string, published: boolean): Promise<Result> {
  try { await guard("content"); await db.faqItem.update({ where: { id }, data: { published } }); revalidatePath("/admin/content"); revalidatePath("/faq"); return { ok: true }; } catch (e) { return fail(e); }
}

// ───────────── Communications ─────────────

const broadcastSchema = z.object({ audience: z.enum(["ALL_STUDENTS", "ALL_MENTORS"]), subject: z.string().trim().min(3).max(150), body: z.string().trim().min(10).max(5000) });
export async function sendBroadcastAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("broadcast");
    assertConfigWritable(actor, "broadcasts");
    const p = broadcastSchema.parse(input);
    const recipients = p.audience === "ALL_STUDENTS" ? await db.user.findMany({ where: { role: "STUDENT", status: "ACTIVE", isDemo: false }, select: { email: true } }) : await db.user.findMany({ where: { role: "MENTOR", status: "ACTIVE", isDemo: false }, select: { email: true } });
    if (!recipients.length) return { ok: false, error: "No recipients match that audience (demo accounts are excluded)." };
    let sent = 0;
    for (const r of recipients) { const res = await sendEmail({ template: "broadcast", to: r.email, vars: { subject: p.subject, body: p.body } }); if (res.status === "SENT") sent++; }
    await audit({ actorId: actor.id, action: "comms.broadcast", after: { audience: p.audience, subject: p.subject, recipients: recipients.length, sent } });
    return { ok: true, message: `Sent to ${sent} of ${recipients.length} recipients.` };
  } catch (e) { return fail(e); }
}
