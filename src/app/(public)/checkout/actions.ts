"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { CheckoutError, quote, startCheckout, type CheckoutStart } from "@/server/checkout";
import { PaymentsNotConfigured, paymentsConfigured } from "@/server/razorpay";
import { rateLimit } from "@/server/ratelimit";

export async function applyCouponAction(slug: string, code: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`coupon:${ip}`, 20, 600)).ok) return { message: "Too many tries. Wait a few minutes.", discountPaise: 0, totalPaise: null as number | null };
  try {
    const q = await quote(slug, code);
    return { message: q.couponMessage, discountPaise: q.couponDiscountPaise, totalPaise: q.totalPaise };
  } catch (e) {
    return { message: e instanceof CheckoutError ? e.message : "Couldn't check that code.", discountPaise: 0, totalPaise: null };
  }
}

export type StartResult = { ok: true; start: CheckoutStart } | { ok: false; error: string };

export async function startCheckoutAction(input: { slug: string; name: string; email: string; phone: string; coupon?: string }): Promise<StartResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`checkout:${ip}`, 10, 600)).ok) return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  if (!paymentsConfigured()) return { ok: false, error: "Payments aren't enabled in this environment yet, so nothing was charged." };
  try {
    const session = await auth();
    return { ok: true, start: await startCheckout({ ...input, userId: session?.user?.id ?? null }) };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    if (e instanceof PaymentsNotConfigured) return { ok: false, error: "Payments aren't enabled in this environment yet." };
    console.error("startCheckout", e);
    return { ok: false, error: "We couldn't start the payment. Please try again." };
  }
}
