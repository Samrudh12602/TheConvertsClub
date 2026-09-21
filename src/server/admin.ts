import type { AccrualStatus, MentorTier } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { bonusesDue, type BonusRuleLite } from "@/server/payroll";
import { HOUR, needsSenior, pickCandidate } from "@/server/scheduling";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";
import { audit } from "@/server/audit";

export class AdminError extends Error {}

export interface Actor { id: string; isDemo: boolean }

/** The shared demo admin may operate on demo data but must never change site configuration or touch real users. */
export function assertConfigWritable(actor: Actor, what: string) {
  if (actor.isDemo) throw new AdminError(`The demo admin is read-only for ${what}. Sign in as the real admin to change it.`);
}

// ───────────── assignment ─────────────

/** Best mentor for a session at its start time, using the same rules as booking. Returns a mentor profile id or null. */
export async function suggestMentor(sessionId: string): Promise<{ mentorId: string; name: string } | null> {
  const s = await db.session.findUnique({ where: { id: sessionId } });
  if (!s?.startsAt) return null;
  const settings = await getSettings();
  const slots = await db.slot.findMany({
    where: { startsAt: s.startsAt, status: "OPEN", mentor: { status: "ACTIVE", ...(s.type === "STRATEGY_CALL" ? { isAdminMentor: true } : {}) } },
    include: { mentor: { include: { user: { select: { name: true } } } } },
  });
  if (!slots.length) return null;
  const load = await db.session.groupBy({ by: ["mentorId"], where: { mentorId: { in: slots.map((x) => x.mentorId) }, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gte: new Date() } }, _count: true });
  const l = new Map(load.map((x) => [x.mentorId, x._count]));
  const pick = pickCandidate(slots.map((x) => ({ slotId: x.id, mentorId: x.mentorId, tier: x.mentor.tier, isAdminMentor: x.mentor.isAdminMentor, load: l.get(x.mentorId) ?? 0 })), needsSenior(s.type, s.focus, settings.seniorRequiredFocuses));
  const m = slots.find((x) => x.mentorId === pick?.mentorId)?.mentor;
  return pick && m ? { mentorId: pick.mentorId, name: m.user.name?.replace(/\s*\(demo\)/, "") ?? "Mentor" } : null;
}

/** Assign, reassign, or self-assign (pass the admin's own mentor profile id). Moves the session onto that mentor's slot. */
export async function assignSession(actor: Actor, sessionId: string, mentorId: string) {
  const out = await db.$transaction(async (tx) => {
    const s = await tx.session.findUnique({ where: { id: sessionId }, include: { student: true } });
    if (!s?.startsAt || !s.endsAt) throw new AdminError("Session not found.");
    if (!["CONFIRMED", "REQUESTED"].includes(s.status)) throw new AdminError("Only upcoming sessions can be assigned.");
    const mentor = await tx.mentorProfile.findUnique({ where: { id: mentorId }, include: { user: true } });
    if (!mentor || mentor.status !== "ACTIVE") throw new AdminError("That mentor isn't active.");
    if (actor.isDemo && (!mentor.user.isDemo || !s.student?.isDemo)) throw new AdminError("The demo admin can only work with demo data.");
    const clash = await tx.session.findFirst({ where: { mentorId, startsAt: s.startsAt, status: { in: ["CONFIRMED", "REQUESTED"] }, id: { not: s.id }, ...(s.gdBatchId ? { gdBatchId: { not: s.gdBatchId } } : {}) } });
    if (clash) throw new AdminError("That mentor already has a session at this time.");
    const oldMentorId = s.mentorId;
    if (s.slotId && oldMentorId !== mentorId) await tx.slot.update({ where: { id: s.slotId }, data: { status: "OPEN" } });
    const slot = await tx.slot.upsert({ where: { mentorId_startsAt: { mentorId, startsAt: s.startsAt } }, update: { status: "BOOKED", heldById: null, heldUntil: null }, create: { mentorId, startsAt: s.startsAt, endsAt: s.endsAt, status: "BOOKED" } });
    await tx.session.update({ where: { id: s.id }, data: { mentorId, slotId: s.gdBatchId ? null : slot.id, meetingUrl: mentor.meetingUrl, ...(s.status === "REQUESTED" ? { status: "CONFIRMED" } : {}) } });
    const old = oldMentorId && oldMentorId !== mentorId ? await tx.mentorProfile.findUnique({ where: { id: oldMentorId }, include: { user: true } }) : null;
    return { s, mentor, old };
  });
  const title = sessionTitle(out.s.type, out.s.focus);
  const when = fmtWhen(out.s.startsAt!);
  await sendEmail({ template: "mentor_assignment", to: out.mentor.user.email, vars: { student: out.s.student?.name ?? "A student", when, detail: `${title} with ${out.s.student?.name ?? "a student"}, ${when} IST.` }, url: `/mentor/sessions/${out.s.id}` });
  await notify(out.mentor.userId, { title: `Assigned: ${out.s.student?.name ?? "session"}, ${when}`, href: `/mentor/sessions/${out.s.id}` });
  if (out.old) {
    await sendEmail({ template: "mentor_availability_change", to: out.old.user.email, vars: { when, detail: `${title} on ${when} has been reassigned to another mentor.` }, url: "/mentor/sessions" });
    await notify(out.old.userId, { title: `Reassigned away: ${title}, ${when}`, href: "/mentor/sessions" });
  }
  if (out.s.student) await notify(out.s.student.id, { title: `Your ${title} is confirmed for ${when}`, href: `/student/sessions/${out.s.id}` });
  await audit({ actorId: actor.id, action: out.old ? "session.reassign" : "session.assign", entity: "Session", entityId: out.s.id, after: { mentorId } });
}

/** Approve a REQUESTED session (booking mode ADMIN_APPROVAL). */
export async function confirmRequested(actor: Actor, sessionId: string) {
  const s = await db.session.findUnique({ where: { id: sessionId }, include: { student: true, mentor: { include: { user: true } } } });
  if (!s || s.status !== "REQUESTED") throw new AdminError("That request was already handled.");
  if (actor.isDemo && !s.student?.isDemo) throw new AdminError("The demo admin can only work with demo data.");
  await db.session.update({ where: { id: sessionId }, data: { status: "CONFIRMED" } });
  if (s.student && s.startsAt) {
    await sendEmail({ template: "booking_confirmed", to: s.student.email, vars: { session: sessionTitle(s.type, s.focus), when: fmtWhen(s.startsAt), deadline: "" }, url: `/student/sessions/${s.id}` });
    await notify(s.student.id, { title: `Confirmed: ${sessionTitle(s.type, s.focus)}, ${fmtWhen(s.startsAt)}`, href: `/student/sessions/${s.id}` });
  }
  if (s.mentor) await notify(s.mentor.userId, { title: "A session was confirmed for you", href: `/mentor/sessions/${s.id}` });
  await audit({ actorId: actor.id, action: "session.confirm", entity: "Session", entityId: sessionId });
}

// ───────────── payouts ─────────────

const demoScope = (a: Actor) => (a.isDemo ? { mentor: { user: { isDemo: true } } } : {});

/** ACCRUED -> APPROVED for the given accruals (or all, if ids omitted). */
export async function approveAccruals(actor: Actor, ids?: string[]) {
  const r = await db.payoutAccrual.updateMany({ where: { status: "ACCRUED", ...(ids ? { id: { in: ids } } : {}), ...demoScope(actor) }, data: { status: "APPROVED" } });
  await audit({ actorId: actor.id, action: "payout.approve_accruals", entity: "PayoutAccrual", after: { count: r.count } });
  return r.count;
}

export async function approveBonuses(actor: Actor) {
  const r = await db.bonusAward.updateMany({ where: { status: "ACCRUED", ...demoScope(actor) }, data: { status: "APPROVED" } });
  await audit({ actorId: actor.id, action: "payout.approve_bonuses", entity: "BonusAward", after: { count: r.count } });
  return r.count;
}

/** Bundle every approved, unpaid accrual and bonus into one run with a Payout per mentor. Payment itself is manual. */
export async function createPayoutRun(actor: Actor, label: string) {
  return db.$transaction(async (tx) => {
    const accruals = await tx.payoutAccrual.findMany({ where: { status: "APPROVED", payoutId: null, ...demoScope(actor) } });
    const bonuses = await tx.bonusAward.findMany({ where: { status: "APPROVED", payoutId: null, ...demoScope(actor) } });
    if (!accruals.length && !bonuses.length) throw new AdminError("Nothing is approved and unpaid yet.");
    const run = await tx.payoutRun.create({ data: { label: actor.isDemo ? `[demo] ${label}` : label, status: "APPROVED" } });
    const mentors = new Set([...accruals.map((a) => a.mentorId), ...bonuses.map((b) => b.mentorId)]);
    for (const mentorId of mentors) {
      const a = accruals.filter((x) => x.mentorId === mentorId);
      const b = bonuses.filter((x) => x.mentorId === mentorId);
      const amountPaise = a.reduce((n, x) => n + x.amountPaise, 0) + b.reduce((n, x) => n + x.amountPaise, 0);
      const p = await tx.payout.create({ data: { runId: run.id, mentorId, amountPaise } });
      if (a.length) await tx.payoutAccrual.updateMany({ where: { id: { in: a.map((x) => x.id) } }, data: { payoutId: p.id } });
      if (b.length) await tx.bonusAward.updateMany({ where: { id: { in: b.map((x) => x.id) } }, data: { payoutId: p.id } });
    }
    await audit({ actorId: actor.id, action: "payout.run_created", entity: "PayoutRun", entityId: run.id, after: { mentors: mentors.size } });
    return run;
  });
}

/** Admin paid the mentor manually (bank/UPI) and enters the reference. Marks everything in that payout PAID. */
export async function markPayoutPaid(actor: Actor, payoutId: string, reference: string) {
  if (reference.trim().length < 4) throw new AdminError("Enter the UTR or payment reference.");
  const p = await db.payout.findUnique({ where: { id: payoutId }, include: { mentor: { include: { user: true } }, accruals: true, run: true } });
  if (!p) throw new AdminError("Payout not found.");
  if (p.paidAt) throw new AdminError("That payout is already marked paid.");
  if (actor.isDemo && !p.mentor.user.isDemo) throw new AdminError("The demo admin can only work with demo data.");
  await db.$transaction(async (tx) => {
    await tx.payout.update({ where: { id: payoutId }, data: { reference: reference.trim(), paidAt: new Date() } });
    await tx.payoutAccrual.updateMany({ where: { payoutId }, data: { status: "PAID" } });
    await tx.bonusAward.updateMany({ where: { payoutId }, data: { status: "PAID" } });
    const open = await tx.payout.count({ where: { runId: p.runId, paidAt: null, id: { not: payoutId } } });
    if (!open) await tx.payoutRun.update({ where: { id: p.runId }, data: { status: "PAID", paidAt: new Date() } });
  });
  const sessions = p.accruals.filter((a) => a.sessionId).length, reviews = p.accruals.filter((a) => a.reviewId).length;
  await sendEmail({ template: "payout_processed", to: p.mentor.user.email, vars: { amount: formatPaise(p.amountPaise), period: p.run.label.replace(/^\[demo\]\s*/, ""), detail: `${sessions} session${sessions === 1 ? "" : "s"} and ${reviews} review${reviews === 1 ? "" : "s"}, paid at your current rates.` }, url: "/mentor/earnings", details: [{ k: "Amount", v: formatPaise(p.amountPaise) }, { k: "Reference", v: reference.trim() }] });
  await notify(p.mentor.userId, { title: `${formatPaise(p.amountPaise)} sent`, href: "/mentor/earnings" });
  await audit({ actorId: actor.id, action: "payout.marked_paid", entity: "Payout", entityId: payoutId, after: { amountPaise: p.amountPaise, reference: reference.trim() } });
}

// ───────────── bonuses ─────────────

/** Start/end of the bonus period as UTC instants. SEASON uses the Season dates in Settings; MONTH is the current IST month. */
export function periodRange(period: "SEASON" | "MONTH", s: { seasonStart: string; seasonEnd: string }, now: Date) {
  if (period === "SEASON") return { from: new Date(`${s.seasonStart}T00:00:00+05:30`), to: new Date(`${s.seasonEnd}T23:59:59+05:30`), key: "season" };
  const ist = new Date(now.getTime() + 5.5 * HOUR);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth();
  const from = new Date(Date.UTC(y, m, 1) - 5.5 * HOUR), to = new Date(Date.UTC(y, m + 1, 1) - 5.5 * HOUR);
  return { from, to, key: `${y}-${String(m + 1).padStart(2, "0")}` };
}

/**
 * Compute milestone bonuses at period close. Awards are created as ACCRUED = "pending approval" (the preview);
 * Admin approves them into a payout run. Safe to run repeatedly: (mentor, rule, period) is unique.
 */
export async function previewBonuses(now = new Date()) {
  const settings = await getSettings();
  const { from, to, key } = periodRange(settings.bonusPeriod, settings, now);
  const rules = await db.bonusRule.findMany({ where: { period: settings.bonusPeriod, active: true } });
  const lite: BonusRuleLite[] = rules.map((r) => ({ id: r.id, tier: r.tier as MentorTier, threshold: r.threshold, amountPaise: r.amountPaise, active: r.active }));
  const mentors = await db.mentorProfile.findMany({ where: { status: { not: "OFFBOARDED" }, isAdminMentor: false } });
  const created: { mentorId: string; ruleId: string; amountPaise: number }[] = [];
  for (const m of mentors) {
    const types = [settings.mockCounts.includes("PI") && "MOCK_PI", settings.mockCounts.includes("GD") && "GD_BATCH"].filter(Boolean) as ("MOCK_PI" | "GD_BATCH")[];
    const [a, b] = await Promise.all([
      types.length ? db.session.count({ where: { mentorId: m.id, status: "COMPLETED", type: { in: types }, startsAt: { gte: from, lt: to } } }) : 0,
      settings.mockCounts.includes("WAT") ? db.review.count({ where: { assignedMentorId: m.id, status: "COMPLETED", kind: "WAT", completedAt: { gte: from, lt: to } } }) : 0,
    ]);
    const have = new Set((await db.bonusAward.findMany({ where: { mentorId: m.id, periodKey: key }, select: { ruleId: true } })).map((x) => x.ruleId));
    for (const r of bonusesDue(m.tier, a + b, lite, have)) {
      await db.bonusAward.create({ data: { mentorId: m.id, ruleId: r.id, periodKey: key, amountPaise: r.amountPaise, status: "ACCRUED" as AccrualStatus } }).catch(() => undefined);
      created.push({ mentorId: m.id, ruleId: r.id, amountPaise: r.amountPaise });
    }
  }
  return { periodKey: key, created };
}
