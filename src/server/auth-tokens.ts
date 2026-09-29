import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * Single-use, expiring proof that an inbox belongs to the person who signed up. Stored hashed in the
 * existing VerificationToken table, namespaced so it can't collide with Auth.js's own magic-link rows.
 */
const PURPOSE = "verify-email";
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const ident = (email: string) => `${PURPOSE}:${email.trim().toLowerCase()}`;

/** Issues a new token and invalidates any earlier live one for the same email. */
export async function createVerifyEmailToken(email: string, ttlHours = 48): Promise<string> {
  const identifier = ident(email);
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({ data: { identifier, token: hash(token), expires: new Date(Date.now() + ttlHours * 3_600_000) } });
  return token;
}

export async function createVerifyEmailLink(email: string, ttlHours = 48): Promise<string> {
  const token = await createVerifyEmailToken(email, ttlHours);
  return `${appUrl()}/verify-email?${new URLSearchParams({ token, email: email.trim().toLowerCase() })}`;
}

/** Atomic: only one caller can ever get `true` for a given token. */
export async function consumeVerifyEmailToken(email: string, token: string): Promise<boolean> {
  if (!token) return false;
  const { count } = await db.verificationToken.deleteMany({ where: { identifier: ident(email), token: hash(token), expires: { gt: new Date() } } });
  return count === 1;
}
