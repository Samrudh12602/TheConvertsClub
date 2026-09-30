import { db } from "@/lib/db";
import { describeCredit } from "@/lib/pricing";
import type { ReceiptData } from "@/server/receipt-pdf";

export const RECEIPT_STATUSES = ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
const HAS_RECEIPT = new Set<string>(RECEIPT_STATUSES);

/** Shapes one captured order into the plain data the PDF and the HTML receipt both render from.
 * A later refund doesn't erase the original receipt — it reflects what was actually paid. */
export async function loadReceiptData(orderId: string): Promise<ReceiptData | null> {
  const o = await db.order.findUnique({
    where: { id: orderId },
    include: { product: { select: { name: true, credits: { select: { kind: true, quantity: true } } } }, coupon: { select: { code: true } }, payments: { select: { razorpayPaymentId: true, capturedAt: true, method: true }, orderBy: { capturedAt: "desc" }, take: 1 } },
  });
  if (!o || !HAS_RECEIPT.has(o.status)) return null;
  const p = o.payments[0];
  return {
    orderId: o.id,
    buyerName: o.guestName,
    buyerEmail: o.guestEmail,
    productName: o.product.name,
    includes: o.product.credits.map((c) => describeCredit(c, "short")),
    listPricePaise: o.listPricePaise,
    discountPaise: o.discountPaise,
    amountPaise: o.amountPaise,
    couponCode: o.coupon?.code ?? null,
    paymentId: p?.razorpayPaymentId ?? null,
    paymentMethod: p?.method ?? null,
    paidAt: p?.capturedAt ?? o.createdAt,
  };
}
