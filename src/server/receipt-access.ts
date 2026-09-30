import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * Lets the checkout success page link straight to a receipt PDF before the buyer has necessarily
 * logged in yet. Deliberately NOT the bare order id as a bearer credential (an order id is guessable
 * enough, and a receipt carries a real name, email and amount) — a random token is hashed at rest,
 * scoped to one order, and expires. Re-usable (not single-use) within its window: someone may
 * reasonably download the same receipt more than once. A signed-in owner never needs this at all —
 * the API route checks real session ownership first and only falls back to the token.
 */
const PURPOSE = "receipt";
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const ident = (orderId: string) => `${PURPOSE}:${orderId}`;

export async function createReceiptToken(orderId: string, ttlHours = 72): Promise<string> {
  const identifier = ident(orderId);
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({ data: { identifier, token: hash(token), expires: new Date(Date.now() + ttlHours * 3_600_000) } });
  return token;
}

export async function createReceiptLink(orderId: string, ttlHours = 72): Promise<string> {
  const token = await createReceiptToken(orderId, ttlHours);
  return `${appUrl()}/api/receipts/${orderId}?token=${token}`;
}

export async function verifyReceiptToken(orderId: string, token: string): Promise<boolean> {
  if (!token) return false;
  const row = await db.verificationToken.findFirst({ where: { identifier: ident(orderId), token: hash(token), expires: { gt: new Date() } } });
  return Boolean(row);
}
