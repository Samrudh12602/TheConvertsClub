import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";

const HOUR = 3_600_000;

export interface ReferredOrder { studentKey: string; amountPaise: number; createdAt: Date }
export interface BonusBatch { batch: number; students: number; basePaise: number; amountPaise: number }

/**
 * Pure. A mentor earns `percent`% of the fees paid by every complete group of `every` referred students.
 * Students are counted once (a student who buys twice with the code is still one student), in the order they first
 * bought, and every referred order by those students counts towards the fees. Groups already awarded are skipped.
 */
export function referralBatches(orders: ReferredOrder[], every: number, percent: number, awarded: ReadonlySet<number> = new Set()): { students: number; batches: BonusBatch[] } {
  const firstSeen = new Map<string, number>();
  for (const o of [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) if (!firstSeen.has(o.studentKey)) firstSeen.set(o.studentKey, firstSeen.size);
  const students = firstSeen.size;
  if (every < 1 || percent <= 0) return { students, batches: [] };
  const spent = new Map<string, number>();
  for (const o of orders) spent.set(o.studentKey, (spent.get(o.studentKey) ?? 0) + o.amountPaise);
  const ordered = [...firstSeen.keys()]; // insertion order = order of first purchase
  const batches: BonusBatch[] = [];
  for (let b = 1; b * every <= ordered.length; b++) {
    if (awarded.has(b)) continue;
    const group = ordered.slice((b - 1) * every, b * every);
    const basePaise = group.reduce((n, k) => n + (spent.get(k) ?? 0), 0);
    batches.push({ batch: b, students: every, basePaise, amountPaise: Math.round((basePaise * percent) / 100) });
  }
  return { students, batches };
}

/** Paid, referral-code orders that are past the refund window, grouped by the mentor whose code was used. */
async function referredOrdersByMentor(now: Date) {
  const { refundWindowHours } = await getSettings();
  const cutoff = new Date(now.getTime() - refundWindowHours * HOUR);
  const rows = await db.order.findMany({
    where: { status: "PAID", createdAt: { lte: cutoff }, coupon: { mentorId: { not: null } } },
    select: { userId: true, guestEmail: true, amountPaise: true, createdAt: true, coupon: { select: { mentorId: true } } },
  });
  const by = new Map<string, ReferredOrder[]>();
  for (const r of rows) {
    const mentorId = r.coupon?.mentorId;
    if (!mentorId) continue;
    by.set(mentorId, [...(by.get(mentorId) ?? []), { studentKey: r.userId ?? r.guestEmail.toLowerCase(), amountPaise: r.amountPaise, createdAt: r.createdAt }]);
  }
  return by;
}

/**
 * Creates the referral bonuses that have become due. Safe to run any number of times (each mentor+group is unique).
 * A purchase only counts once its refund window has passed, so a refunded order never earns a bonus. Awards start as
 * "pending approval"; Admin approves them into a payout run on the Payouts screen.
 */
export async function accrueReferralBonuses(now = new Date()) {
  const { referralBonusEvery, referralBonusPercent } = await getSettings();
  const created: { mentorId: string; batch: number; amountPaise: number }[] = [];
  const by = await referredOrdersByMentor(now);
  for (const [mentorId, orders] of by) {
    const mentor = await db.mentorProfile.findUnique({ where: { id: mentorId }, select: { isAdminMentor: true } });
    if (!mentor || mentor.isAdminMentor) continue;
    const done = await db.bonusAward.findMany({ where: { mentorId, kind: "REFERRAL" }, select: { referralBatch: true } });
    const { batches } = referralBatches(orders, referralBonusEvery, referralBonusPercent, new Set(done.map((d) => d.referralBatch).filter((n): n is number => n !== null)));
    for (const b of batches) {
      if (b.amountPaise <= 0) continue;
      await db.bonusAward.create({ data: { mentorId, kind: "REFERRAL", referralBatch: b.batch, periodKey: `referral-${b.batch}`, amountPaise: b.amountPaise, basePaise: b.basePaise, percent: referralBonusPercent } }).catch(() => undefined); // unique per mentor+group
      created.push({ mentorId, batch: b.batch, amountPaise: b.amountPaise });
    }
  }
  return { created };
}

/** How far a mentor is toward their next bonus (counts only: mentors never see who the students are). */
export async function referralProgress(mentorId: string) {
  const { referralBonusEvery, referralBonusPercent } = await getSettings();
  const orders = await db.order.findMany({ where: { status: "PAID", coupon: { mentorId } }, select: { userId: true, guestEmail: true, amountPaise: true, createdAt: true } });
  const students = new Set(orders.map((o) => o.userId ?? o.guestEmail.toLowerCase())).size;
  const awards = await db.bonusAward.findMany({ where: { mentorId, kind: "REFERRAL" }, orderBy: { referralBatch: "asc" }, select: { referralBatch: true, amountPaise: true, status: true } });
  return { students, every: referralBonusEvery, percent: referralBonusPercent, toNext: students % referralBonusEvery === 0 ? referralBonusEvery : referralBonusEvery - (students % referralBonusEvery), awards };
}
