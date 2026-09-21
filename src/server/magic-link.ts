import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * One-click login link, compatible with Auth.js's email provider: it stores sha256(token + AUTH_SECRET) and
 * consumes it at /api/auth/callback/resend. Used for the post-purchase "Set up my account" email.
 */
export async function createLoginLink(email: string, callbackPath = "/go"): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const identifier = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: { identifier, token: createHash("sha256").update(`${token}${secret}`).digest("hex"), expires: new Date(Date.now() + 24 * 3_600_000) },
  });
  const qs = new URLSearchParams({ callbackUrl: `${appUrl()}${callbackPath}`, token, email: identifier });
  return `${appUrl()}/api/auth/callback/resend?${qs}`;
}
