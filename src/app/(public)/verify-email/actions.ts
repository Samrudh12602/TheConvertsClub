"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createVerifyEmailLink } from "@/server/auth-tokens";
import { sendEmail } from "@/server/email";
import { rateLimit } from "@/server/ratelimit";

export type ResendState = { sent?: boolean; error?: string };

export async function resendVerifyEmailAction(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!email) return { error: "Missing email." };
  if (!(await rateLimit(`verify-resend:${ip}`, 6, 900)).ok || !(await rateLimit(`verify-resend-email:${email}`, 3, 900)).ok) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }
  const user = await db.user.findUnique({ where: { email }, select: { emailVerified: true } });
  // Same response whether or not the account exists, so this can't be used to probe for signups.
  if (user && !user.emailVerified) {
    const link = await createVerifyEmailLink(email);
    await sendEmail({ template: "verify_email", to: email, url: link });
  }
  return { sent: true };
}
