import type { CreditKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { describeCredit } from "@/lib/pricing";
import { getSettings } from "@/lib/settings-db";
import { fmtDate } from "@/lib/format";
import { lockUser, adjustCredit } from "@/server/credits";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";

/** Marks the ledger rows this job writes, so they're never mistaken for a purchase or an admin correction. */
export const EXPIRY_REASON = "Credit expiry";
const DAY = 86_400_000;

/**
 * Pure. Credits are spent oldest-first, so whatever is still unspent and wasn't granted inside the validity
 * window is the old stock. `available` is the current spendable balance, `grantedInWindow` is the net amount
 * granted since the cutoff (purchases and admin top-ups, never this job's own expiry rows).
 * Anything reserved by a booked session is not "available", so a booked session never loses its credit.
 */
export function expiringAmount(available: number, grantedInWindow: number): number {
  return Math.max(0, available - Math.max(0, grantedInWindow));
}

interface Row { userId: string; kind: CreditKind }

async function perKind(userId: string, kind: CreditKind, cutoff: Date) {
  const [bal, recent] = await Promise.all([
    db.creditLedger.aggregate({ where: { userId, kind }, _sum: { delta: true } }),
    db.creditLedger.aggregate({ where: { userId, kind, type: { in: ["GRANT", "ADJUST"] }, createdAt: { gte: cutoff }, NOT: { reason: { startsWith: EXPIRY_REASON } } }, _sum: { delta: true } }),
  ]);
  return { available: bal._sum.delta ?? 0, recent: recent._sum.delta ?? 0 };
}

async function candidates(cutoff: Date): Promise<Row[]> {
  // Anyone who has ever been granted credit before the cutoff is a candidate.
  const rows = await db.creditLedger.groupBy({ by: ["userId", "kind"], where: { type: "GRANT", createdAt: { lt: cutoff } } });
  return rows.map((r) => ({ userId: r.userId, kind: r.kind }));
}

/**
 * Daily job. Does nothing unless the admin sets "Credit validity (days)" above zero in Settings.
 * 1. Expires unused credits older than the validity window (booked sessions are untouched).
 * 2. Warns, once, students whose credits will expire within the warning window.
 */
export async function runCreditExpiry(now = new Date()) {
  const s = await getSettings();
  const out = { expired: 0, warned: 0 };
  if (s.creditValidityDays <= 0) return out;

  // ── expire ──
  const cutoff = new Date(now.getTime() - s.creditValidityDays * DAY);
  const gone = new Map<string, { kind: CreditKind; quantity: number }[]>();
  for (const c of await candidates(cutoff)) {
    const took = await db.$transaction(async (tx) => {
      await lockUser(tx, c.userId);
      const a = await perKind(c.userId, c.kind, cutoff); // re-read under the lock
      const n = expiringAmount(a.available, a.recent);
      if (n > 0) await adjustCredit(tx, { userId: c.userId, kind: c.kind, delta: -n, reason: `${EXPIRY_REASON}: unused for over ${s.creditValidityDays} days`, createdById: "system" });
      return n;
    });
    if (took > 0) { gone.set(c.userId, [...(gone.get(c.userId) ?? []), { kind: c.kind, quantity: took }]); out.expired += took; }
  }
  for (const [userId, items] of gone) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    const list = items.map((i) => describeCredit(i, "short")).join(", ");
    if (user) await sendEmail({ template: "credits_expired", to: user.email, vars: { name: user.name?.split(" ")[0] ?? "there", credits: list, days: s.creditValidityDays }, url: "/contact" });
    await notify(userId, { title: `Credits expired: ${list}`, href: "/student/payments" });
  }

  // ── warn ──
  const warnCutoff = new Date(now.getTime() - (s.creditValidityDays - s.creditExpiryWarnDays) * DAY);
  if (s.creditExpiryWarnDays > 0 && s.creditExpiryWarnDays < s.creditValidityDays) {
    const soon = new Map<string, { kind: CreditKind; quantity: number }[]>();
    for (const c of await candidates(warnCutoff)) {
      const a = await perKind(c.userId, c.kind, warnCutoff);
      const n = expiringAmount(a.available, a.recent);
      if (n > 0) soon.set(c.userId, [...(soon.get(c.userId) ?? []), { kind: c.kind, quantity: n }]);
    }
    for (const [userId, items] of soon) {
      const already = await db.notification.findFirst({ where: { userId, title: { startsWith: "Credits expiring" }, createdAt: { gte: new Date(now.getTime() - (s.creditExpiryWarnDays + 1) * DAY) } } });
      if (already) continue;
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true, isDemo: true } });
      if (!user) continue;
      const list = items.map((i) => describeCredit(i, "short")).join(", ");
      await sendEmail({ template: "credits_expiring", to: user.email, vars: { name: user.name?.split(" ")[0] ?? "there", credits: list, date: fmtDate(new Date(now.getTime() + s.creditExpiryWarnDays * DAY)) }, url: "/student/book" });
      await notify(userId, { title: `Credits expiring soon: ${list}`, href: "/student/book" });
      out.warned++;
    }
  }
  return out;
}
