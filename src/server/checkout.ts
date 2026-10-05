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
import { adminInbox, sendEmail } from "@/server/email";
import { notify } from "@/server/notify";
import { audit } from "@/server/audit";
import { hasAcceptedCurrent } from "@/server/legal-acceptance";
import { LEGAL_VERSION, REQUIRED_DOCS } from "@/lib/legal";
import { loadReceiptData } from "@/server/receipt";
import { renderReceiptPdf } from "@/server/receipt-pdf";
import type { CreditKind } from "@/generated/prisma/client";

export class CheckoutError extends Error {}

/** Price for an order, always computed here from the database. The browser never supplies an amount. */
export async function quote(slug: string, couponCode?: string | null, now = new Date(), opts: { earlyBirdOpen?: boolean } = {}) {
  let product = await getProduct(slug);
  if (!product) throw new CheckoutError("That product isn't available.");
  // The caller can force the early-bird seat on or off (used inside the locked order creation, where the seat count is decided).
  if (product.earlyBird && opts.earlyBirdOpen !== undefined) product = { ...product, earlyBird: { ...product.earlyBird, seatsLeft: opts.earlyBirdOpen ? Math.max(1, product.earlyBird.seatsLeft) : 0 } };
  const v = priceView(product);
  const earlyBird = Boolean(product.earlyBird && product.earlyBird.seatsLeft > 0 && v.payablePaise === product.earlyBird.pricePaise && v.strikePaise !== null);
  let discountPaise = 0;
  let couponId: string | null = null;
  let couponMessage: string | null = null;
  if (couponCode?.trim()) {
    const c = await db.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    // Sessions with Samrudh are the owner's own time, so mentors' referral codes don't discount them (a general code still can).
    const r = c?.mentorId && product.withAdmin ? { ok: false as const, reason: "Mentor codes don't apply to sessions with Samrudh." } : checkCoupon(c, v.payablePaise, now, product.mentorPricePaise);
    if (r.ok) {
      discountPaise = r.discountPaise;
      couponId = c!.id;
      couponMessage = `Code applied · ${formatPaise(discountPaise)} off`;
    } else couponMessage = r.reason;
  }
  return { product, view: v, earlyBird, couponId, couponDiscountPaise: discountPaise, couponMessage, totalPaise: v.payablePaise - discountPaise };
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
export async function startCheckout(input: { slug: string; name: string; email: string; phone: string; coupon?: string | null; userId?: string | null; acceptTerms?: boolean; ip?: string | null }): Promise<CheckoutStart> {
  if (!paymentsConfigured()) throw new CheckoutError("Payments aren't enabled yet.");
  // Who is this purchase for? A signed-in STUDENT buys for their own account, and their email is fixed to it
  // (typing someone else's email can't redirect the receipt or credits). An admin or mentor who happens to be
  // signed in is NOT buying for themselves: the purchase belongs to whichever student the details name.
  const signedIn = input.userId ? await db.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true, isDemo: true, email: true, name: true } }) : null;
  const buyer = signedIn?.role === "STUDENT" ? signedIn : null;
  const parsed = guestDetailsSchema.safeParse({ name: buyer?.name?.trim() || input.name, email: buyer ? buyer.email : input.email, phone: input.phone });
  if (!parsed.success) throw new CheckoutError(parsed.error.issues[0]?.message ?? "Check your details.");
  // No purchase without agreement: either ticked now, or a signed-in student who has already accepted the current terms.
  if (!input.acceptTerms) {
    if (!buyer || !(await hasAcceptedCurrent(buyer))) throw new CheckoutError("Please accept the Terms of Use, Privacy Policy and Refund Policy to continue.");
  }
  let q = await quote(input.slug, input.coupon);
  if (q.product.enrolledOnly) {
    // Additional PI: only for enrolled students, bought from inside the portal.
    if (!buyer || !(await db.enrollment.count({ where: { userId: buyer.id, status: "ACTIVE" } }))) throw new CheckoutError("This is only for enrolled students. Log in to buy it.");
  }
  const email = parsed.data.email.toLowerCase();
  if (q.couponId) {
    // A mentor can't use their own referral code (the Terms say so; this is where it is enforced).
    const owner = await db.coupon.findUnique({ where: { id: q.couponId }, select: { mentor: { select: { userId: true, user: { select: { email: true } } } } } });
    if (owner?.mentor && (owner.mentor.userId === buyer?.id || owner.mentor.user.email.toLowerCase() === email)) throw new CheckoutError("You can't use your own referral code.");
  }
  const phone = normalizeIndianPhone(parsed.data.phone)!;
  const row = await db.product.findUnique({ where: { slug: q.product.slug }, select: { id: true } });
  // The early-bird seat is decided under a lock, so two people paying at the same moment can't both get the last seat.
  // A student gets the early-bird price once per product, and only while seats remain.
  const order = await db.$transaction(async (tx) => {
    if (q.product.earlyBird) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"earlybird:" + q.product.slug}))`;
      const taken = await tx.$queryRaw<{ n: number }[]>`
        SELECT COUNT(DISTINCT lower("guestEmail"))::int AS n FROM "Order"
        WHERE "productId" = ${row!.id} AND "earlyBird" = true AND lower("guestEmail") <> ${email}
          AND (status IN ('PAID','PARTIALLY_REFUNDED') OR (status = 'CREATED' AND "createdAt" > now() - interval '30 minutes'))`;
      const already = await tx.order.count({ where: { productId: row!.id, earlyBird: true, status: { in: ["PAID", "PARTIALLY_REFUNDED"] }, guestEmail: { equals: email, mode: "insensitive" } } });
      const open = already === 0 && (taken[0]?.n ?? 0) < q.product.earlyBird.limit;
      if (open !== q.earlyBird) q = await quote(input.slug, input.coupon, undefined, { earlyBirdOpen: open });
    }
    return tx.order.create({
      data: { productId: row!.id, userId: buyer?.id ?? null, couponId: q.couponId, listPricePaise: q.view.strikePaise ?? q.view.payablePaise, discountPaise: (q.view.strikePaise ? q.view.strikePaise - q.view.payablePaise : 0) + q.couponDiscountPaise, amountPaise: q.totalPaise, earlyBird: q.earlyBird, guestName: parsed.data.name.trim(), guestEmail: email, guestPhone: phone, termsVersion: LEGAL_VERSION, termsAcceptedAt: new Date(), termsIp: input.ip ?? null },
    });
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
    // The buyer agreed at checkout; carry that proof onto their account so they aren't asked again.
    if (order.termsVersion && user.role === "STUDENT") {
      await tx.legalAcceptance.createMany({
        data: REQUIRED_DOCS.STUDENT.map((document) => ({ userId: user!.id, document, version: order.termsVersion!, source: "checkout", ip: order.termsIp, acceptedAt: order.termsAcceptedAt ?? new Date() })),
        skipDuplicates: true,
      });
    }
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
      const receipt = await loadReceiptData(result.orderId);
      const attachments = receipt ? [{ filename: `receipt-${result.orderId}.pdf`, content: await renderReceiptPdf(receipt), contentType: "application/pdf" }] : undefined;
      await sendEmail({
        template: "welcome", to: result.user.email, url: link, vars: { package: result.product.name },
        details: [{ k: "Package", v: result.product.name }, { k: "Paid", v: formatPaise(result.amountPaise) }, { k: "Credits", v: result.product.credits.map((c) => describeCredit(c, "short")).join(" · ") }],
        attachments,
      });
      await notify(result.user.id, { title: `Payment confirmed: ${result.product.name}`, href: "/student" });
      if (result.product.withAdmin) await alertAdminDirectRequest(result);
    } catch (e) { console.error("post-fulfil side effects failed", e); }
  }
  return result;
}

/** A failed payment attempt only marks a still-unpaid order as failed. */
export async function markOrderFailed(razorpayOrderId: string) {
  await db.order.updateMany({ where: { razorpayOrderId, status: "CREATED" }, data: { status: "FAILED" } });
}

/**
 * Someone paid for a session directly with the owner (PI or strategy call). Tell the owner, specifically, the moment it
 * happens, by email and in the app, with who and what, so nothing waits for them to notice a new order.
 */
async function alertAdminDirectRequest(r: { orderId: string; user: { id: string; name: string | null; email: string; phone: string | null; isDemo: boolean }; product: { name: string }; amountPaise: number }) {
  try {
    const inbox = adminInbox();
    const label = r.product.name;
    if (inbox && !r.user.isDemo) {
      await sendEmail({
        template: "direct_request", to: inbox, replyTo: r.user.email, url: `/admin/students/${r.user.id}`,
        vars: { student: r.user.name ?? r.user.email, product: label },
        details: [{ k: "Student", v: r.user.name ?? "—" }, { k: "Email", v: r.user.email }, { k: "Phone", v: r.user.phone ?? "—" }, { k: "Asked for", v: label }, { k: "Paid", v: formatPaise(r.amountPaise) }],
      });
    }
    const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE", isDemo: r.user.isDemo }, select: { id: true } });
    await Promise.all(admins.map((a) => notify(a.id, { title: `${r.user.name ?? "A student"} asked for: ${label}`, body: "They'll book a slot with you next.", href: `/admin/students/${r.user.id}` })));
  } catch (e) { console.error("direct request alert failed", e); }
}

/**
 * Brings an order in line with the refunds recorded against it: order status, and on a full refund the enrollment and the
 * credits the student hasn't used. Safe to run any number of times and from any source (admin refund, Razorpay webhook,
 * a refund made in the Razorpay dashboard).
 */
export async function applyRefundState(tx: Prisma.TransactionClient, orderId: string, actorId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: { include: { refunds: true } }, enrollment: { include: { product: { include: { credits: true } } } } } });
  if (!order?.userId) return null;
  const payment = order.payments.find((p) => p.status === "CAPTURED");
  if (!payment) return null;
  const refunded = payment.refunds.reduce((n, r) => n + r.amountPaise, 0);
  if (refunded <= 0) return null;
  const full = refunded >= payment.amountPaise;
  await lockUser(tx, order.userId);
  await tx.order.update({ where: { id: order.id }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
  if (full && order.enrollment && order.enrollment.status === "ACTIVE") {
    await tx.enrollment.update({ where: { id: order.enrollment.id }, data: { status: "REFUNDED" } });
    const bal = await getBalances(tx, order.userId);
    for (const c of order.enrollment.product.credits) {
      const kind = c.kind as CreditKind;
      const unused = Math.min(c.quantity, Math.max(0, bal[kind]?.available ?? 0));
      if (unused > 0) await adjustCredit(tx, { userId: order.userId, kind, delta: -unused, reason: `Refund of ${order.enrollment.product.name}`, createdById: actorId });
    }
  }
  return { full, refunded };
}

/** Entry point for the webhook. */
export const reconcileRefund = (orderId: string) => db.$transaction((tx) => applyRefundState(tx, orderId, "system"));

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
  // Upsert, not create: Razorpay's webhook can record the same refund first, and that must not turn a refund that
  // already happened into an error here. applyRefundState is idempotent, so whichever runs second changes nothing.
  await db.$transaction(async (tx) => {
    await tx.refund.upsert({
      where: { razorpayRefundId: rzId },
      update: { reason, createdById: actor.id },
      create: { paymentId: payment.id, razorpayRefundId: rzId, amountPaise: amount, status: "processed", reason, createdById: actor.id },
    });
    await applyRefundState(tx, order.id, actor.id);
  });
  await audit({ actorId: actor.id, action: "order.refund", entity: "Order", entityId: order.id, after: { amountPaise: amount, reason, full } });
  await sendEmail({ template: "refund_processed", to: order.guestEmail, vars: { amount: formatPaise(amount) } });
  return { amountPaise: amount, full };
}

export const policyForCheckout = getPolicy;
