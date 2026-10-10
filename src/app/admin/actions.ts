"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isFeaturable, testimonialWho } from "@/lib/testimonial";
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
import { AvailabilityError } from "@/server/availability";
import { adminAddHours, adminBookFor, adminBookSlot, adminTimesFor, enableAdminMentor, pauseAdminMentor } from "@/server/admin-mentor";
import { refundOrder, CheckoutError } from "@/server/checkout";
import { DocxError, parseMockDocx, type ParsedMock } from "@/lib/mock-docx";
import { MockImportError, createMockFromParsed, nextMockNumber, replaceMockPaper, slugify } from "@/server/mock-import";
import { PanelError, setPanelists } from "@/server/panel";
import { addMentorDirect, MentorAdminError, promoteApplication, resendMentorLogin } from "@/server/mentors";
import type { Settings } from "@/lib/settings";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const fail = (e: unknown): Result => {
  if (e instanceof AdminError || e instanceof BookingError || e instanceof CheckoutError || e instanceof MentorAdminError || e instanceof AvailabilityError || e instanceof PanelError || e instanceof MockImportError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};

/** A blank number input submits "" via FormData or controlled state, which z.coerce.number()
 * would turn into 0 rather than "absent" — strip it to undefined first so .optional() applies. */
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

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

/**
 * Bulk: move every upcoming session from one mentor to another (e.g. when a mentor goes on leave). Each move goes through the
 * same checks, emails and audit entry as a single assignment; the ones that can't move (a clash, a different kind of hour)
 * are left where they are and reported.
 */
export async function reassignMentorSessionsAction(fromMentorId: string, toMentorId: string): Promise<Result> {
  try {
    const actor = await guard("reassign-all");
    if (fromMentorId === toMentorId) throw new AdminError("Pick a different mentor to move them to.");
    const sessions = await db.session.findMany({ where: { mentorId: fromMentorId, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, select: { id: true } });
    if (!sessions.length) throw new AdminError("That mentor has no upcoming sessions to move.");
    let moved = 0; const stuck: string[] = [];
    for (const s of sessions) {
      try { await assignSession(actor, s.id, toMentorId); moved++; } catch (e) { stuck.push(e instanceof AdminError ? e.message : "failed"); }
    }
    await audit({ actorId: actor.id, action: "mentor.reassign_all", entity: "MentorProfile", entityId: fromMentorId, after: { toMentorId, moved, stuck: stuck.length } });
    refreshAll();
    if (!moved) return { ok: false, error: `Nothing could be moved. ${[...new Set(stuck)][0]}` };
    return { ok: true, message: `Moved ${moved} session${moved === 1 ? "" : "s"}.${stuck.length ? ` ${stuck.length} couldn't move (${[...new Set(stuck)][0]}); they're still with the original mentor.` : ""}` };
  } catch (e) { return fail(e); }
}

/** The owner picks the two other panelists for a Panel PI; each gets their hour held and an invite to accept. */
export async function setPanelistsAction(sessionId: string, mentorIds: string[]): Promise<Result> {
  try {
    const actor = await guard("panel");
    const r = await setPanelists(actor, z.string().min(1).max(40).parse(sessionId), z.array(z.string().min(1).max(40)).max(4).parse(mentorIds));
    await audit({ actorId: actor.id, action: "panel.set_panelists", entity: "Session", entityId: sessionId, after: { mentorIds } });
    refreshAll();
    return { ok: true, message: r.invited ? `Invites sent to ${r.invited} panelist${r.invited === 1 ? "" : "s"}.` : "Panel unchanged." };
  } catch (e) { return fail(e); }
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
    await cancelSession(s.studentId, sessionId, { byStaff: true });
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
  batchYear: z.preprocess(emptyToUndef, z.coerce.number().int().min(1990).max(2100).optional()),
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

export async function resendMentorLoginAction(mentorId: string): Promise<Result> {
  try {
    const actor = await guard("mentor-login");
    const r = await resendMentorLogin(actor, mentorId);
    revalidatePath(`/admin/mentors/${mentorId}`);
    return { ok: true, message: `Login details sent to ${r.email}.` };
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

/** Hides a mentor from /mentors without touching their status — they keep working, sessions keep
 * assigning to them, they just don't show on the public roster (e.g. still on trial, or asked to be left off). */
export async function setMentorPublicVisibleAction(mentorId: string, publicVisible: boolean): Promise<Result> {
  try {
    const actor = await guard("mentor-visibility");
    const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true } });
    if (!m) throw new AdminError("Mentor not found.");
    if (actor.isDemo && !m.user.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    await db.mentorProfile.update({ where: { id: mentorId }, data: { publicVisible } });
    await audit({ actorId: actor.id, action: "mentor.visibility_change", entity: "MentorProfile", entityId: mentorId, after: { publicVisible } });
    revalidatePath("/admin/mentors");
    revalidatePath(`/admin/mentors/${mentorId}`);
    revalidatePath("/mentors");
    return { ok: true, message: publicVisible ? "Now visible on the public site." : "Hidden from the public site." };
  } catch (e) { return fail(e); }
}

const mentorCouponAdminSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9]{4,16}$/, "4–16 letters and numbers, nothing else."),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.coerce.number().int().min(1),
  maxUses: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).optional()),
  active: z.boolean(),
});

/** Admin's complete control over one mentor's referral coupon — code, discount, a use cap, on/off.
 * Same coupon row a mentor can nudge their own code on; admin can change anything about it. */
export async function updateMentorCouponAction(mentorId: string, input: unknown): Promise<Result> {
  try {
    const actor = await guard("mentor-coupon");
    assertConfigWritable(actor, "mentor coupons");
    const m = await db.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true }, });
    if (!m) throw new AdminError("Mentor not found.");
    if (actor.isDemo && !m.user.isDemo) throw new AdminError("The demo admin can only work with demo data.");
    const p = mentorCouponAdminSchema.parse(input);
    const code = p.code.toUpperCase();
    const existing = await db.coupon.findUnique({ where: { code }, select: { mentorId: true } });
    if (existing && existing.mentorId !== mentorId) throw new AdminError("That code is already in use by another coupon.");
    await db.coupon.update({ where: { mentorId }, data: { code, type: p.type, value: p.value, maxUses: p.maxUses || null, active: p.active } });
    await audit({ actorId: actor.id, action: "mentor.coupon_update", entity: "MentorProfile", entityId: mentorId, after: p });
    revalidatePath(`/admin/mentors/${mentorId}`);
    revalidatePath("/admin/mentors");
    return { ok: true, message: "Saved." };
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

// ACCEPTED is set only by promoteApplication, so a stage change can never fake an approval.
const stageSchema = z.enum(["NEW", "SCREENING", "TRIAL_MOCK", "OFFER", "REJECTED"]);
export async function setApplicationStageAction(id: string, stage: unknown): Promise<Result> {
  try { const actor = await guard("app-stage"); assertConfigWritable(actor, "application stages"); const next = stageSchema.parse(stage); await db.mentorApplication.update({ where: { id }, data: { stage: next } }); await audit({ actorId: actor.id, action: "application.stage_change", entity: "MentorApplication", entityId: id, after: { stage: next } }); revalidatePath("/admin/applications"); return { ok: true }; } catch (e) { return fail(e); }
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
  try { await guard("preview-bonuses"); const r = await previewBonuses(); revalidatePath("/admin/payouts"); return { ok: true, message: `${r.created.length} new referral bonus${r.created.length === 1 ? "" : "es"} due.` }; } catch (e) { return fail(e); }
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

const productSchema = z.object({ id: z.string(), pricePaise: z.coerce.number().int().min(100), mrpPaise: z.coerce.number().int().min(0).optional(), mentorPricePaise: z.coerce.number().int().min(0).optional(), earlyBirdPricePaise: z.coerce.number().int().min(100).optional(), earlyBirdSeats: z.coerce.number().int().min(1).max(10000).optional(), active: z.boolean() }).refine((p) => (p.earlyBirdPricePaise === undefined) === (p.earlyBirdSeats === undefined), { message: "Set both the early-bird price and the number of seats, or leave both blank." }).refine((p) => p.earlyBirdPricePaise === undefined || p.earlyBirdPricePaise < p.pricePaise, { message: "The early-bird price must be lower than the normal price." });
export async function updateProductAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("product");
    assertConfigWritable(actor, "products");
    const p = productSchema.parse(input);
    await db.product.update({ where: { id: p.id }, data: { pricePaise: p.pricePaise, mrpPaise: p.mrpPaise || null, mentorPricePaise: p.mentorPricePaise || null, earlyBirdPricePaise: p.earlyBirdPricePaise ?? null, earlyBirdSeats: p.earlyBirdSeats ?? null, active: p.active } });
    await audit({ actorId: actor.id, action: "product.update", entity: "Product", entityId: p.id, after: p });
    revalidatePath("/", "layout"); revalidatePath("/admin/products");
    return { ok: true, message: "Saved." };
  } catch (e) { return fail(e); }
}

// A blank "max uses" input submits "" (from CouponForm's controlled state), which coerces to 0 and
// would pass min(0) silently — a brand-new coupon with maxUses 0 would read as "already fully used".
const couponSchema = z.object({ code: z.string().trim().min(3).max(24), type: z.enum(["PERCENT", "FLAT"]), value: z.coerce.number().int().min(1), maxUses: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).optional()), expiresAt: z.string().optional() });
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
  creditValidityDays: z.coerce.number().int().min(0).max(1095), creditExpiryWarnDays: z.coerce.number().int().min(0).max(180),
  gdCapacity: z.coerce.number().int().min(2).max(30), feedbackDueHours: z.coerce.number().int().min(1).max(168),
  gstEnabled: z.boolean(), adminAccrues: z.boolean(), demoEnabled: z.boolean(), gdpiComingSoon: z.boolean(), minLeadHours: z.coerce.number().int().min(0).max(48),
  bonusPeriod: z.enum(["SEASON", "MONTH"]), seasonStart: z.string(), seasonEnd: z.string(),
  referralBonusEvery: z.coerce.number().int().min(1).max(1000), referralBonusPercent: z.coerce.number().min(0).max(50),
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

/** One click: turn a consenting student's comment into a published testimonial (first name + college only). */
export async function publishRatingAsTestimonialAction(ratingId: string): Promise<Result> {
  try {
    const actor = await guard("content");
    assertConfigWritable(actor, "testimonials");
    const r = await db.sessionRating.findUnique({ where: { id: ratingId }, include: { student: { include: { studentProfile: true } } } });
    if (!r || !isFeaturable(r)) return { ok: false, error: "That comment can't be featured." };
    if (r.student.isDemo) return { ok: false, error: "That's demo data — it isn't published to the real site." };
    await db.testimonial.create({ data: { quote: r.comment!.trim(), who: testimonialWho(r.student.name, r.student.studentProfile?.college), published: true, ratingId } });
    await audit({ actorId: actor.id, action: "content.testimonial_from_rating", entity: "SessionRating", entityId: ratingId });
    revalidatePath("/admin/content"); revalidatePath("/results");
    return { ok: true, message: "Published." };
  } catch (e) { return fail(e); }
}

const testimonialSchema = z.object({ quote: z.string().trim().min(10).max(500), who: z.string().trim().min(2).max(100) });
export async function addTestimonialAction(input: unknown): Promise<Result> {
  try { const actor = await guard("content"); const p = testimonialSchema.parse(input); await db.testimonial.create({ data: { ...p, published: true } }); await audit({ actorId: actor.id, action: "content.testimonial_add", entity: "Testimonial" }); revalidatePath("/admin/content"); revalidatePath("/results"); return { ok: true, message: "Added." }; } catch (e) { return fail(e); }
}
export async function toggleTestimonialAction(id: string, published: boolean): Promise<Result> {
  try { await guard("content"); await db.testimonial.update({ where: { id }, data: { published } }); revalidatePath("/admin/content"); revalidatePath("/results"); return { ok: true }; } catch (e) { return fail(e); }
}

const seasonStatSchema = z.object({ value: z.string().trim().min(1).max(20), label: z.string().trim().min(3).max(80) });
export async function addSeasonStatAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("content");
    const p = seasonStatSchema.parse(input);
    const sortOrder = await db.seasonStat.count();
    await db.seasonStat.create({ data: { ...p, sortOrder } });
    await audit({ actorId: actor.id, action: "content.season_stat_add", entity: "SeasonStat" });
    revalidatePath("/admin/content");
    revalidatePath("/results");
    return { ok: true, message: "Added." };
  } catch (e) { return fail(e); }
}
export async function deleteSeasonStatAction(id: string): Promise<Result> {
  try {
    const actor = await guard("content");
    await db.seasonStat.delete({ where: { id } });
    await audit({ actorId: actor.id, action: "content.season_stat_delete", entity: "SeasonStat", entityId: id });
    revalidatePath("/admin/content");
    revalidatePath("/results");
    return { ok: true };
  } catch (e) { return fail(e); }
}
const faqSchema = z.object({ question: z.string().trim().min(5).max(200), answer: z.string().trim().min(5).max(1000) });
export async function addFaqAction(input: unknown): Promise<Result> {
  try { const actor = await guard("content"); const p = faqSchema.parse(input); await db.faqItem.create({ data: { ...p, published: true, sortOrder: 999 } }); await audit({ actorId: actor.id, action: "content.faq_add", entity: "FaqItem" }); revalidatePath("/admin/content"); revalidatePath("/faq"); return { ok: true, message: "Added." }; } catch (e) { return fail(e); }
}
export async function toggleFaqAction(id: string, published: boolean): Promise<Result> {
  try { await guard("content"); await db.faqItem.update({ where: { id }, data: { published } }); revalidatePath("/admin/content"); revalidatePath("/faq"); return { ok: true }; } catch (e) { return fail(e); }
}

const resourceSchema = z.object({
  audience: z.enum(["STUDENT", "MENTOR"]),
  kind: z.string().trim().min(2).max(30),
  title: z.string().trim().min(3).max(150),
  meta: z.string().trim().max(150).optional(),
  url: z.union([z.url(), z.literal("")]).optional(),
});
export async function addResourceAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("content");
    const p = resourceSchema.parse(input);
    const sortOrder = await db.resource.count({ where: { audience: p.audience } });
    await db.resource.create({ data: { audience: p.audience, kind: p.kind.toUpperCase(), title: p.title, meta: p.meta || null, url: p.url || null, sortOrder } });
    await audit({ actorId: actor.id, action: "content.resource_add", entity: "Resource", after: { audience: p.audience, title: p.title } });
    revalidatePath("/admin/content");
    revalidatePath("/student/library");
    revalidatePath("/mentor/resources");
    return { ok: true, message: "Added." };
  } catch (e) { return fail(e); }
}
export async function deleteResourceAction(id: string): Promise<Result> {
  try {
    const actor = await guard("content");
    await db.resource.delete({ where: { id } });
    await audit({ actorId: actor.id, action: "content.resource_delete", entity: "Resource", entityId: id });
    revalidatePath("/admin/content");
    revalidatePath("/student/library");
    revalidatePath("/mentor/resources");
    return { ok: true };
  } catch (e) { return fail(e); }
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

// ───────────── Mentor mode, hours for others, booking for students ─────────────

export async function setAdminMentorModeAction(on: boolean): Promise<Result> {
  try {
    const actor = await guard("mentor-mode");
    if (on) await enableAdminMentor(actor); else await pauseAdminMentor(actor);
    refreshAll();
    return { ok: true, message: on ? "Mentor mode is on." : "Mentor mode is paused." };
  } catch (e) { return fail(e); }
}

const hoursSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), from: z.string().regex(/^\d{1,2}:\d{2}$/), to: z.string().regex(/^\d{1,2}:\d{2}$/), repeatUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")) });
export async function adminAddHoursAction(mentorId: string, input: unknown): Promise<Result> {
  try {
    const actor = await guard("mentor-hours");
    const p = hoursSchema.parse(input);
    const n = await adminAddHours(actor, mentorId, p.date, p.from, p.to, p.repeatUntil || undefined);
    refreshAll();
    return { ok: true, message: `${n} slot${n === 1 ? "" : "s"} added.` };
  } catch (e) { return fail(e); }
}

const bookTypeSchema = z.enum(["MOCK_PI", "STRATEGY_CALL", "GUIDANCE", "PI_DIRECT", "STRATEGY_DIRECT", "TRIAL_GUIDANCE", "TRIAL_PI"]);
const bookFocusSchema = z.enum(["HR_PROFILE", "ACADEMICS", "STRESS", "INSTITUTE_FINAL", "CURRENT_AFFAIRS", "CROSS_QUESTIONING"]).nullable();
export async function adminTimesForStudentAction(studentId: string, type: unknown, focus: unknown): Promise<Result & { times?: string[] }> {
  try {
    const actor = await guard("book-times");
    const t = bookTypeSchema.parse(type);
    const times = await adminTimesFor(actor, studentId, t, t === "MOCK_PI" ? bookFocusSchema.parse(focus) : null);
    return { ok: true, times };
  } catch (e) { return fail(e); }
}
export async function adminBookForStudentAction(studentId: string, type: unknown, focus: unknown, startsAtIso: string): Promise<Result> {
  try {
    const actor = await guard("book-for");
    const t = bookTypeSchema.parse(type);
    await adminBookFor(actor, studentId, t, t === "MOCK_PI" ? bookFocusSchema.parse(focus) : null, z.string().min(10).parse(startsAtIso));
    refreshAll();
    return { ok: true, message: "Booked. The student has been emailed the confirmation." };
  } catch (e) { return fail(e); }
}

export async function adminBookSlotAction(studentId: string, slotId: string, type: unknown, focus: unknown): Promise<Result> {
  try {
    const actor = await guard("book-slot");
    const t = bookTypeSchema.parse(type);
    await adminBookSlot(actor, studentId, slotId, t, t === "MOCK_PI" ? bookFocusSchema.parse(focus) : null);
    refreshAll();
    return { ok: true, message: "Booked. The student and the mentor have been emailed." };
  } catch (e) { return fail(e); }
}

// ───────────── SNAP mocks ─────────────

const mockSchema = z.object({ id: z.string().min(1).max(40), status: z.enum(["DRAFT", "PUBLISHED"]), releaseAt: z.string().max(40).nullable() });

/** Publish or hide a mock and set when students can start it. Attempts already made are never touched. */
export async function setMockStatusAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("mocks");
    const p = mockSchema.parse(input);
    const at = p.releaseAt ? new Date(p.releaseAt) : null;
    if (at && Number.isNaN(at.getTime())) throw new AdminError("That release time isn't valid.");
    const m = await db.mock.findUnique({ where: { id: p.id }, include: { _count: { select: { questions: true } } } });
    if (!m) throw new AdminError("Mock not found.");
    if (p.status === "PUBLISHED" && m._count.questions === 0) throw new AdminError("This mock has no questions yet.");
    await db.mock.update({ where: { id: p.id }, data: { status: p.status, releaseAt: at } });
    await audit({ actorId: actor.id, action: "mock.set_status", entity: "Mock", entityId: p.id, after: { status: p.status, releaseAt: p.releaseAt } });
    revalidatePath("/admin/mocks"); revalidatePath("/mocks"); revalidatePath("/student/mocks");
    return { ok: true, message: p.status === "PUBLISHED" ? (at && at > new Date() ? "Published; opens at the time you set." : "Published. Students can start it now.") : "Hidden from students." };
  } catch (e) { return fail(e); }
}


// ───────────── SNAP mocks: upload a paper, edit, replace, delete ─────────────

const MAX_DOCX_BYTES = 6 * 1024 * 1024;
const refreshMocks = () => { for (const p of ["/admin/mocks", "/mocks", "/student/mocks", "/student", "/"]) revalidatePath(p); };

async function readPaper(fd: FormData): Promise<ParsedMock> {
  const f = fd.get("file");
  if (!(f instanceof File) || f.size === 0) throw new AdminError("Choose a Word file (.docx) first.");
  if (!f.name.toLowerCase().endsWith(".docx")) throw new AdminError("Please upload a Word document (.docx). Older .doc files and PDFs can't be read.");
  if (f.size > MAX_DOCX_BYTES) throw new AdminError("That file is too large (the limit is 6 MB).");
  try { return parseMockDocx(new Uint8Array(await f.arrayBuffer())); } catch (e) { if (e instanceof DocxError) throw new AdminError(e.message); throw e; }
}

export interface PaperSummary {
  detectedTitle: string | null; total: number; sections: { name: string; count: number }[]; solutions: number; problems: string[]; warnings: string[]; underlined: number[];
  sample: { number: number; section: string; stem: string; options: string[]; correct: number } | null;
  suggestedNumber: number; suggestedTitle: string; suggestedSlug: string;
}

/** Reads the uploaded paper and reports what it found, without saving anything. */
export async function inspectMockPaperAction(fd: FormData): Promise<({ ok: true } & PaperSummary) | { ok: false; error: string }> {
  try {
    await guard("mock-inspect");
    const p = await readPaper(fd);
    const first = p.sections.find((s) => s.questions.length)?.questions[0];
    const n = await nextMockNumber();
    return {
      ok: true, detectedTitle: p.title, total: p.total, sections: p.sections.map((s) => ({ name: s.name, count: s.questions.length })),
      solutions: p.sections.reduce((t, s) => t + s.questions.filter((q) => q.explanation).length, 0), problems: p.problems.slice(0, 12), warnings: p.warnings.slice(0, 12),
      underlined: p.sections.flatMap((s) => s.questions).filter((q) => /<u>/.test(q.stem + q.options.join("") + (q.context?.lines.join("") ?? ""))).map((q) => q.number),
      sample: first ? { number: first.number, section: p.sections.find((s) => s.questions.includes(first))!.name, stem: first.stem.slice(0, 280), options: first.options, correct: first.correct } : null,
      suggestedNumber: n, suggestedTitle: `SNAP 2026 Mock ${n}`, suggestedSlug: `snap-mock-${n}`,
    };
  } catch (e) { const r = fail(e); return r.ok ? { ok: false, error: "Something went wrong." } : r; }
}

const newMockSchema = z.object({
  title: z.string().trim().min(2).max(120), slug: z.string().trim().max(60).optional(), description: z.string().trim().max(400).optional(),
  durationMin: z.coerce.number().int().min(5).max(300), sortOrder: z.coerce.number().int().min(0).max(999), isTest: z.enum(["true", "false"]).transform((v) => v === "true"),
  marks: z.coerce.number().min(0.25).max(10), negative: z.coerce.number().min(0).max(10),
  publish: z.enum(["draft", "now", "schedule"]), releaseAt: z.string().max(40).optional(),
});

/** Creates a mock from the uploaded paper: parses it, tags topics, stores it, and publishes or schedules it if asked. */
export async function createMockFromPaperAction(fd: FormData): Promise<Result> {
  try {
    const actor = await guard("mock-create");
    const p = newMockSchema.parse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")));
    const paper = await readPaper(fd);
    let releaseAt: Date | null = null;
    if (p.publish === "schedule") { releaseAt = p.releaseAt ? new Date(p.releaseAt) : null; if (!releaseAt || Number.isNaN(releaseAt.getTime())) throw new AdminError("Pick the date and time the mock should open."); }
    const slug = slugify(p.slug || p.title);
    const mock = await createMockFromParsed(paper, { slug, title: p.title, description: p.description || null, durationMin: p.durationMin, isTest: p.isTest, sortOrder: p.sortOrder, status: p.publish === "draft" ? "DRAFT" : "PUBLISHED", releaseAt, marks: p.marks, negative: p.negative });
    await audit({ actorId: actor.id, action: "mock.create", entity: "Mock", entityId: mock.id, after: { slug, title: p.title, questions: paper.total, publish: p.publish } });
    refreshMocks();
    return { ok: true, message: p.publish === "draft" ? `“${p.title}” is saved as a draft with ${paper.total} questions. Preview it, then publish.` : p.publish === "now" ? `“${p.title}” is live with ${paper.total} questions.` : `“${p.title}” is scheduled with ${paper.total} questions.` };
  } catch (e) { return fail(e); }
}

const editMockSchema = z.object({
  id: z.string().min(1).max(40), title: z.string().trim().min(2).max(120), description: z.string().trim().max(400).nullable(),
  durationMin: z.number().int().min(5).max(300), sortOrder: z.number().int().min(0).max(999), isTest: z.boolean(),
});

/** Title, blurb, length, order and test/series. The test flag can't change once anyone has attempted it (it decides which credit is spent). */
export async function updateMockAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("mock-edit");
    const p = editMockSchema.parse(input);
    const m = await db.mock.findUnique({ where: { id: p.id }, include: { _count: { select: { attempts: true } } } });
    if (!m) throw new AdminError("Mock not found.");
    if (m.isTest !== p.isTest && m._count.attempts > 0) throw new AdminError("Students have already attempted this mock, so it can't change between test and series.");
    await db.mock.update({ where: { id: p.id }, data: { title: p.title, description: p.description || null, durationMin: p.durationMin, sortOrder: p.sortOrder, isTest: p.isTest } });
    await audit({ actorId: actor.id, action: "mock.edit", entity: "Mock", entityId: p.id, after: { title: p.title, durationMin: p.durationMin, sortOrder: p.sortOrder, isTest: p.isTest } });
    refreshMocks();
    return { ok: true, message: "Saved." };
  } catch (e) { return fail(e); }
}

const markingSchema = z.object({ id: z.string().min(1).max(40), marks: z.number().min(0.25).max(10), negative: z.number().min(0).max(10) });

/** Marks for a right answer and the penalty for a wrong one, for every question. Locked once there are attempts, so past scores never change. */
export async function setMockMarkingAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("mock-marking");
    const p = markingSchema.parse(input);
    const m = await db.mock.findUnique({ where: { id: p.id }, include: { _count: { select: { attempts: true } } } });
    if (!m) throw new AdminError("Mock not found.");
    if (m._count.attempts > 0) throw new AdminError("Students have already attempted this mock, so the marking can't change.");
    await db.mockQuestion.updateMany({ where: { mockId: p.id }, data: { marks: p.marks, negative: p.negative } });
    await audit({ actorId: actor.id, action: "mock.marking", entity: "Mock", entityId: p.id, after: { marks: p.marks, negative: p.negative } });
    refreshMocks();
    return { ok: true, message: `Marking set to +${p.marks} / −${p.negative}.` };
  } catch (e) { return fail(e); }
}

/** Replaces the questions of a mock with a new paper (a corrected version, say). Only while nobody has attempted it; the mock goes back to draft. */
export async function replaceMockPaperAction(fd: FormData): Promise<Result> {
  try {
    const actor = await guard("mock-replace");
    const id = z.string().min(1).max(40).parse(fd.get("id"));
    const paper = await readPaper(fd);
    const r = await replaceMockPaper(id, paper);
    await audit({ actorId: actor.id, action: "mock.replace", entity: "Mock", entityId: id, after: { questions: r.total } });
    refreshMocks();
    return { ok: true, message: `Replaced with ${r.total} questions.${r.hidden ? " The mock is now a draft: preview it, then publish again." : ""}` };
  } catch (e) { return fail(e); }
}

/** Deletes a mock that nobody has attempted. */
export async function deleteMockAction(input: unknown): Promise<Result> {
  try {
    const actor = await guard("mock-delete");
    const id = z.string().min(1).max(40).parse(input);
    const m = await db.mock.findUnique({ where: { id }, include: { _count: { select: { attempts: true } } } });
    if (!m) throw new AdminError("Mock not found.");
    if (m._count.attempts > 0) throw new AdminError("Students have attempted this mock, so it can't be deleted. Hide it instead.");
    await db.mock.delete({ where: { id } });
    await audit({ actorId: actor.id, action: "mock.delete", entity: "Mock", entityId: id, before: { slug: m.slug, title: m.title } });
    refreshMocks();
    return { ok: true, message: `Deleted “${m.title}”.` };
  } catch (e) { return fail(e); }
}
