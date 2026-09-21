import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { fulfilOrder } from "@/server/checkout";
import { rzp, verifyCheckoutSignature } from "@/server/razorpay";
import { rateLimit } from "@/server/ratelimit";

export const runtime = "nodejs";

/** Browser callback after Razorpay Checkout. Verifies the signature, then fulfils (the webhook does the same, idempotently). */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`verify:${ip}`, 30, 600)).ok) return NextResponse.json({ error: "too many requests" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string; orderId?: string } | null;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!body || !secret) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { razorpay_order_id: rzOrder, razorpay_payment_id: rzPay, razorpay_signature: sig } = body;
  if (!rzOrder || !rzPay || !sig || !verifyCheckoutSignature(rzOrder, rzPay, sig, secret)) {
    return NextResponse.json({ error: "signature mismatch" }, { status: 400 });
  }
  try {
    let p = (await rzp().payments.fetch(rzPay)) as unknown as { id: string; order_id: string; amount: number; status: string; fee?: number; tax?: number; method?: string };
    if (p.order_id !== rzOrder) return NextResponse.json({ error: "order mismatch" }, { status: 400 });
    if (p.status === "authorized") p = (await rzp().payments.capture(rzPay, p.amount, "INR")) as unknown as typeof p;
    if (p.status !== "captured") return NextResponse.json({ error: `payment ${p.status}` }, { status: 402 });
    const r = await fulfilOrder(rzOrder, { id: p.id, amountPaise: p.amount, status: p.status, feePaise: p.fee ?? null, taxPaise: p.tax ?? null, method: p.method ?? null, raw: p as unknown as Prisma.InputJsonValue });
    return NextResponse.json({ ok: true, orderId: r.kind === "unknown" ? null : r.orderId });
  } catch (e) {
    console.error("verify failed", e);
    return NextResponse.json({ error: "could not confirm payment" }, { status: 500 });
  }
}
