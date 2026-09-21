import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fulfilOrder, markOrderFailed } from "@/server/checkout";
import { verifyWebhookSignature } from "@/server/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook: the source of truth for payments. Signature is verified against the RAW body, each event id is
 * stored so a retry is a no-op, and fulfilment itself is idempotent on top of that.
 * Enable events: payment.captured, payment.failed, refund.processed.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const eventId = req.headers.get("x-razorpay-event-id");
  if (!eventId) return NextResponse.json({ error: "missing event id" }, { status: 400 });

  const event = JSON.parse(raw) as { event: string; payload: Record<string, { entity: Record<string, unknown> }> };

  const seen = await db.webhookEvent.findUnique({ where: { id: eventId } });
  if (seen?.processedAt) return NextResponse.json({ ok: true, duplicate: true });
  if (!seen) await db.webhookEvent.create({ data: { id: eventId, type: event.event, payload: event as unknown as Prisma.InputJsonValue } }).catch(() => undefined);

  try {
    if (event.event === "payment.captured") {
      const p = event.payload.payment.entity as { id: string; order_id: string; amount: number; status: string; fee?: number; tax?: number; method?: string };
      await fulfilOrder(p.order_id, { id: p.id, amountPaise: p.amount, status: p.status, feePaise: p.fee ?? null, taxPaise: p.tax ?? null, method: p.method ?? null, raw: p as unknown as Prisma.InputJsonValue });
    } else if (event.event === "payment.failed") {
      const p = event.payload.payment.entity as { order_id: string };
      await markOrderFailed(p.order_id);
    } else if (event.event === "refund.processed") {
      const r = event.payload.refund.entity as { id: string; payment_id: string; amount: number };
      const payment = await db.payment.findUnique({ where: { razorpayPaymentId: r.payment_id } });
      if (payment) await db.refund.upsert({ where: { razorpayRefundId: r.id }, update: { status: "processed" }, create: { paymentId: payment.id, razorpayRefundId: r.id, amountPaise: r.amount, status: "processed", reason: "Refund via Razorpay dashboard" } });
    }
    await db.webhookEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook failed", eventId, e);
    // 500 makes Razorpay retry; the event row stays unprocessed so the retry runs again.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
