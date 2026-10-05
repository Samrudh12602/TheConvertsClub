import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { checkCoupon, priceView, type CatalogProduct, type CouponLite } from "@/lib/pricing";

/** Cookie holding the code the visitor typed in. Set only by `applyReferralAction`. */
export const REF_COOKIE = "cc_ref";
export const REF_DAYS = 30;
const CODE = /^[A-Za-z0-9]{4,16}$/;

export interface Referral { code: string; mentorFirst: string; coupon: CouponLite }

/** Looks a code up and returns it only if it is a live mentor referral coupon. */
export async function findReferral(raw: string): Promise<Referral | null> {
  if (!CODE.test(raw)) return null;
  const c = await db.coupon.findUnique({ where: { code: raw.toUpperCase() }, include: { mentor: { include: { user: { select: { name: true } } } } } });
  if (!c || !c.mentor || c.mentor.status !== "ACTIVE") return null;
  if (!c.active || (c.expiresAt && c.expiresAt < new Date()) || (c.maxUses !== null && c.usedCount >= c.maxUses)) return null;
  const first = (c.mentor.user.name ?? "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || "your mentor";
  return { code: c.code, mentorFirst: first, coupon: { type: c.type, value: c.value, expiresAt: c.expiresAt, maxUses: c.maxUses, usedCount: c.usedCount, active: c.active, mentorId: c.mentorId } };
}

/** The code this visitor typed in earlier, if it is still a valid mentor code. Cached per request. */
export const getReferral = cache(async (): Promise<Referral | null> => {
  const raw = (await cookies()).get(REF_COOKIE)?.value;
  return raw ? findReferral(raw) : null;
});

/** What this product costs with the referral applied, or null when it makes no difference. */
export function referralPrice(product: CatalogProduct, ref: Referral | null): number | null {
  if (!ref || product.withAdmin) return null; // sessions with Samrudh are never discounted by a mentor code
  const payable = priceView(product).payablePaise;
  const r = checkCoupon(ref.coupon, payable, new Date(), product.mentorPricePaise);
  return r.ok ? payable - r.discountPaise : null;
}
