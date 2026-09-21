import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

export class PaymentsNotConfigured extends Error {
  constructor() {
    super("Payments are not configured in this environment.");
  }
}

export const paymentsConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export function rzp(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new PaymentsNotConfigured();
  return new Razorpay({ key_id, key_secret });
}

const hmacHex = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

function safeHexEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Checkout success callback: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;
  return safeHexEqual(hmacHex(secret, `${orderId}|${paymentId}`), signature);
}

/** Webhook: signature = HMAC_SHA256(raw request body, webhook_secret). Must be the raw, unparsed body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  return safeHexEqual(hmacHex(secret, rawBody), signature);
}

export const signForTest = hmacHex;
