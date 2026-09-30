import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

/** Every mentor's referral code gets this discount. A plain, ordinary Coupon row underneath —
 * change it per mentor later from /admin/products like any other coupon if you ever need to. */
export const MENTOR_REFERRAL_PERCENT = 10;

/** "Ananya Nair (demo)" -> "ANANAI", always exactly 5 letters, so the digits are the only thing that
 * has to differ between two mentors who happen to share a name. */
export function lettersFromName(name: string): string {
  const clean = name.replace(/\(.*?\)/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const first = (words[0] ?? "MENTOR").replace(/[^a-zA-Z]/g, "").toUpperCase();
  const last = (words.length > 1 ? words[words.length - 1] : first.slice(3)).replace(/[^a-zA-Z]/g, "").toUpperCase();
  const a = (first + "XXXXX").slice(0, 3);
  const b = (last + "XXXXX").slice(0, 2);
  return `${a}${b}`;
}

/** 5 letters from the mentor's own name + 3 digits = 8 characters, always. The digits are what
 * keeps two "Rohit Kulkarni"s from colliding — retried on a real collision, not just assumed unique. */
export async function generateMentorCouponCode(tx: Tx, name: string): Promise<string> {
  const letters = lettersFromName(name);
  for (let attempt = 0; attempt < 50; attempt++) {
    const digits = String(Math.floor(Math.random() * 900) + 100);
    const code = `${letters}${digits}`;
    const existing = await tx.coupon.findUnique({ where: { code }, select: { id: true } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique mentor coupon code after 50 attempts.");
}

/** Creates the one-per-mentor referral coupon. Call exactly once, right after a MentorProfile is
 * created (direct add, promoted application, or an accepted invite) — never on an update. */
export async function createMentorCoupon(tx: Tx, mentorId: string, mentorName: string) {
  const code = await generateMentorCouponCode(tx, mentorName);
  await tx.coupon.create({ data: { code, type: "PERCENT", value: MENTOR_REFERRAL_PERCENT, mentorId } });
}
