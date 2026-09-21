import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { checkCoupon, describeCredit, priceView } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import { getPolicy } from "@/lib/settings-db";
import { guestDetailsSchema, normalizeIndianPhone } from "@/lib/validation/forms";
import { grantCredit, lockUser, getBalances, adjustCredit } from "@/server/credits";
import { paymentsConfigured, rzp } from "@/server/razorpay";
import { createLoginLink } from "@/server/magic-link";
import { sendEmail } from "@/server/email";
import { notify } from "@/server/notify";
import { audit } from "@/server/audit";
import type { CreditKind } from "@/generated/prisma/client";

export class CheckoutError extends Error {}

/** Price for an order, always computed here from the database. The browser never supplies an amount. */
export async function quote(slug: string, couponCode?: string | null, now = new Date()) {
  const product = await getProduct(slug);
  if (!product) throw new CheckoutError("That product isn't available.");
  const v = priceView(product, now);
  let discountPaise = 0;
  let couponId: string | null = null;
  let couponMessage: string | null = null;
  if (couponCode?.trim()) {
    const c = await db.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    const r = checkCoupon(c, v.payablePaise, now);
    if (r.ok) {
      discountPaise = r.discountPaise;
      couponId = c!.id;
      couponMessage = `Code applied · ${formatPaise(discountPaise)} off`;
    } else couponMessage = r.reason;
  }
  return { product, view: v, couponId, couponDiscountPaise: discountPaise, couponMessage, totalPaise: v.payablePaise - discountPaise };
}

export interface CheckoutStart {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  keyId: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

/** Guest (or signed-in) checkout: creates our Order row and the Razorpay order. */
export async function startCheckout(input: { slug: string; name: string; email: string; phone: string; coupon?: string | null; userId?: string | null }): Promise<CheckoutStart> {
  if (!paymentsConfigured()) throw new CheckoutError("Payments aren't enabled yet.");
  const parsed = guestDetailsSchema.safeParse({ name: input.name, email: input.email, phone: input.phone });
  if (!parsed.success) throw new CheckoutError(parsed.error.issues[0]?.message ?? "Check your details.");
  const q = await quote(input.slug, input.coupon);
  if (q.product.enrolledOnly) {
    // Additional PI: only for enrolled students, bought from inside the portal.
    if (!input.userId || !(await db.enrollment.count({ where: { userId: input.userId, status: "ACTIVE" } }))) throw new CheckoutError("This is only for enrolled students. Log in to buy it.");
  }
  const email = parsed.data.email.toLowerCase();
  const phone = normalizeIndianPhone(parsed.data.phone)!;
  const row = await db.product.findUnique({ where: { slug: q.product.slug }, select: { id: true } });
  const order = await db.order.create({
    data: { productId: row!.id, userId: input.userId ?? null, couponId: q.couponId, listPricePaise: q.view.strikePaise ?? q.view.payablePaise, discountPaise: (q.view.strikePaise ? q.view.strikePaise - q.view.payablePaise : 0) + q.couponDiscountPaise, amountPaise: q.totalPaise, guestName: parsed.data.name.trim(), guestEmail: email, guestPhone: phone },
  });
  const rz = await rzp().orders.create({ amount: q.totalPaise, currency: "INR", receipt: order.id.slice(0, 40), notes: { orderId: order.id, product: q.product.slug } });
  await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rz.id } });
  return {
    orderId: order.id, razorpayOrderId: rz.id, amountPaise: q.totalPaise, keyId: process.env.RAZORPAY_KEY_ID!,
    name: "The Convert Club", description: q.product.name, prefill: { name: parsed.data.name.trim(), email, contact: `+91${phone}` },
  };
}

export interface PaymentFacts {
  id: string;
  amountPaise: number;
  status: string;
  feePaise?: number | null;
  taxPaise?: number | null;
  method?: string | null;
  raw?: Prisma.InputJsonValue;
}

/**
 * Turn a captured payment into an enrollment plus credits, exactly once. Safe to call from the verify endpoint
 * AND the webhook, in any order, any number of times: the Order row is locked, and a second call sees PAID and returns.
 */
export async function fulfilOrder(razorpayOrderId: string, pay: PaymentFacts) {
  const result = await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Order" WHERE "razorpayOrderId" = ${razorpayOrderId} FOR UPDATE`;
    if (!rows.length) return { kind: "unknown" as const };
    const order = await tx.order.findUniqueOrThrow({ where: { id: rows[0].id }, include: { product: { include: { credits: true } } } });
    if (order.status === "PAID" || order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED") return { kind: "already" as const, orderId: order.id };
    if (pay.amountPaise !== order.amountPaise) {
      await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      throw new CheckoutError(`Amount mismatch on order ${order.id}: paid ${pay.amountPaise}, expected ${order.amountPaise}`);
    }
    // Attach to the existing account for this email, or create a student account.
    let user = order.userId ? await tx.user.findUnique({ where: { id: order.userId } }) : await tx.user.findUnique({ where: { email: order.guestEmail } });
    const created = !user;
    if (!user) user = await tx.user.create({ data: { email: order.guestEmail, name: order.guestName, phone: order.guestPhone, role: "STUDENT" } });
    else if (!user.phone) await tx.user.update({ where: { id: user.id }, data: { phone: order.guestPhone } });
    await lockUser(tx, user.id);
    await tx.payment.upsert({
      where: { razorpayPaymentId: pay.id },
      update: {},
      create: { orderId: order.id, razorpayPaymentId: pay.id, status: "CAPTURED", amountPaise: pay.amountPaise, feePaise: pay.feePaise ?? null, taxPaise: pay.taxPaise ?? null, method: pay.method ?? null, capturedAt: new Date(), raw: pay.raw },
    });
    await tx.order.update({ where: { id: order.id }, data: { status: "PAID", userId: user.id } });
    const enrollment = await tx.enrollment.create({ data: { userId: user.id, productId: order.productId, orderId: order.id } });
    for (const c of order.product.credits) await grantCredit(tx, { userId: user.id, kind: c.kind, quantity: c.quantity, enrollmentId: enrollment.id, reason: `Purchase: ${order.product.name}` });
    if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
    await tx.studentProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    return { kind: "fulfilled" as const, orderId: order.id, user, created, product: order.product, amountPaise: order.amountPaise };
  });

  if (result.kind === "fulfilled") {
    // Best-effort side effects after the money and credits are safely committed.
    try {
      const link = await createLoginLink(result.user.email, "/student/onboarding");
      await sendEmail({
        template: "welcome", to: result.user.email, url: link, vars: { package: result.product.name },
        details: [{ k: "Package", v: result.product.name }, { k: "Paid", v: formatPaise(result.amountPaise) }, { k: "Credits", v: result.product.credits.map((c) => describeCredit(c, "short")).join(" · ") }],
      });
      await notify(result.user.id, { title: `Payment confirmed: ${result.product.name}`, href: "/student" });
    } catch (e) { console.error("post-fulfil side effects failed", e); }
  }
  return result;
}

/** A failed payment attempt only marks a still-unpaid order as failed. */
export async function markOrderFailed(razorpayOrderId: string) {
  await db.order.updateMany({ where: { razorpayOrderId, status: "CREATED" }, data: { status: "FAILED" } });
}

/** Admin refund. Reverses only credits the student has not used; everything is audited. */
export async function refundOrder(actor: { id: string; isDemo: boolean }, orderId: string, amountPaise: number | null, reason: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: { include: { refunds: true } }, user: true, enrollment: { include: { product: { include: { credits: true } } } } } });
  if (!order || !order.userId) throw new CheckoutError("Order not found.");
  if (actor.isDemo && !order.user?.isDemo) throw new CheckoutError("Demo admins can only refund demo orders.");
  const payment = order.payments.find((p) => p.status === "CAPTURED");
  if (!payment) throw new CheckoutError("There's no captured payment on this order.");
  const already = payment.refunds.reduce((n, r) => n + r.amountPaise, 0);
  const amount = amountPaise ?? payment.amountPaise - already;
  if (amount < 100 || amount + already > payment.amountPaise) throw new CheckoutError("Refund amount is out of range.");

  let rzId: string;
  if (payment.razorpayPaymentId.startsWith("demo_")) rzId = `demo_refund_${Date.now()}`; // demo data never touches Razorpay
  else {
    const r = await rzp().payments.refund(payment.razorpayPaymentId, { amount, notes: { orderId, reason: reason.slice(0, 200) } });
    rzId = r.id;
  }
  const full = amount + already === payment.amountPaise;
  await db.$transaction(async (tx) => {
    await lockUser(tx, order.userId!);
    await tx.refund.create({ data: { paymentId: payment.id, razorpayRefundId: rzId, amountPaise: amount, status: "processed", reason, createdById: actor.id } });
    await tx.order.update({ where: { id: order.id }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    if (full && order.enrollment) {
      await tx.enrollment.update({ where: { id: order.enrollment.id }, data: { status: "REFUNDED" } });
      const bal = await getBalances(tx, order.userId!);
      for (const c of order.enrollment.product.credits) {
        const kind = c.kind as CreditKind;
        const unused = Math.min(c.quantity, Math.max(0, bal[kind]?.available ?? 0));
        if (unused > 0) await adjustCredit(tx, { userId: order.userId!, kind, delta: -unused, reason: `Refund of ${order.enrollment.product.name}`, createdById: actor.id });
      }
    }
  });
  await audit({ actorId: actor.id, action: "order.refund", entity: "Order", entityId: order.id, after: { amountPaise: amount, reason, full } });
  await sendEmail({ template: "refund_processed", to: order.guestEmail, vars: { amount: formatPaise(amount) } });
  return { amountPaise: amount, full };
}

export const policyForCheckout = getPolicy;
