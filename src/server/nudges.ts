import type { CreditKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { describeCredit } from "@/lib/pricing";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";

const DAY = 86_400_000;
const first = (n?: string | null) => (n ?? "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "there";

/** One nudge per person per window: the in-app notification doubles as the "already sent" marker. */
async function alreadyNudged(userId: string, titlePrefix: string, days: number, now: Date) {
  return Boolean(await db.notification.findFirst({ where: { userId, title: { startsWith: titlePrefix }, createdAt: { gte: new Date(now.getTime() - days * DAY) } }, select: { id: true } }));
}

/** Pure: which credit kinds still have something to spend, in the order students think of them. */
export function unspentCredits(rows: { kind: CreditKind; delta: number }[]): { kind: CreditKind; quantity: number }[] {
  const sum = new Map<CreditKind, number>();
  for (const r of rows) sum.set(r.kind, (sum.get(r.kind) ?? 0) + r.delta);
  return [...sum].filter(([, q]) => q > 0).map(([kind, quantity]) => ({ kind, quantity }));
}

/**
 * Daily, gentle, never repeated inside its window, and real accounts only (demo and `.test` addresses never get mail):
 *  1. mentors with no open hours -> "publish your hours" (weekly)
 *  2. students holding unspent credits and nothing booked -> "your credits are waiting" (every 2 weeks)
 *  3. students who paid but never finished onboarding -> "finish your profile" (weekly, after 2 days)
 */
export async function runNudges(now = new Date()) {
  const out = { mentors: 0, credits: 0, onboarding: 0 };

  // 1 ── mentors
  const mentors = await db.mentorProfile.findMany({ where: { status: "ACTIVE", isAdminMentor: false, user: { isDemo: false, status: "ACTIVE" } }, select: { id: true, userId: true, user: { select: { name: true, email: true } } } });
  for (const m of mentors) {
    if (await db.slot.count({ where: { mentorId: m.id, status: "OPEN", startsAt: { gt: now } } })) continue;
    if (await alreadyNudged(m.userId, "Publish your hours", 7, now)) continue;
    await sendEmail({ template: "nudge_mentor_hours", to: m.user.email, vars: { name: first(m.user.name) }, url: "/mentor/availability" });
    await notify(m.userId, { title: "Publish your hours so students can book you", href: "/mentor/availability" });
    out.mentors++;
  }

  // 2 ── unspent credits
  const grants = await db.creditLedger.groupBy({ by: ["userId", "kind"], _sum: { delta: true }, where: { user: { isDemo: false, status: "ACTIVE", role: "STUDENT" } } });
  const byUser = new Map<string, { kind: CreditKind; delta: number }[]>();
  for (const g of grants) byUser.set(g.userId, [...(byUser.get(g.userId) ?? []), { kind: g.kind, delta: g._sum.delta ?? 0 }]);
  for (const [userId, rows] of byUser) {
    const left = unspentCredits(rows);
    if (left.length === 0) continue;
    const [lastGrant, upcoming] = await Promise.all([
      db.creditLedger.findFirst({ where: { userId, type: "GRANT" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      db.session.count({ where: { studentId: userId, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: now } } }),
    ]);
    if (upcoming > 0 || !lastGrant || lastGrant.createdAt > new Date(now.getTime() - 5 * DAY)) continue;
    if (await alreadyNudged(userId, "You have credits waiting", 14, now)) continue;
    const u = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!u) continue;
    const list = left.map((c) => describeCredit(c, "short")).join(", ");
    // "...and your call is in 14 days": the one piece of context that turns a reminder into urgency.
    const call = await db.callTracker.findFirst({ where: { studentId: userId, outcome: "SCHEDULED", interviewDate: { gt: now } }, orderBy: { interviewDate: "asc" } });
    const days = call?.interviewDate ? Math.ceil((call.interviewDate.getTime() - now.getTime()) / DAY) : null;
    await sendEmail({ template: "nudge_credits", to: u.email, vars: { name: first(u.name), credits: list }, url: "/student/book", details: call && days !== null ? [{ k: "Your next call", v: `${call.institute} in ${days} day${days === 1 ? "" : "s"}` }] : undefined });
    await notify(userId, { title: `You have credits waiting: ${list}`, href: "/student/book" });
    out.credits++;
  }

  // 3 ── paid but not onboarded
  const stalled = await db.user.findMany({
    where: { role: "STUDENT", isDemo: false, status: "ACTIVE", studentProfile: { onboardedAt: null }, enrollments: { some: { status: "ACTIVE", createdAt: { lt: new Date(now.getTime() - 2 * DAY) } } } },
    select: { id: true, name: true, email: true },
  });
  for (const u of stalled) {
    if (await alreadyNudged(u.id, "Finish your profile", 7, now)) continue;
    await sendEmail({ template: "nudge_onboarding", to: u.email, vars: { name: first(u.name) }, url: "/student/onboarding" });
    await notify(u.id, { title: "Finish your profile so your mentor can prepare", href: "/student/onboarding" });
    out.onboarding++;
  }
  return out;
}
