"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { findReferral, REF_COOKIE, REF_DAYS } from "@/server/referral";
import { rateLimit } from "@/server/ratelimit";

export type ReferralResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * The visitor types a mentor's code themselves; only then do prices show the mentor price. Nothing hands a code
 * out, and a wrong guess reveals nothing (same message for "unknown", "switched off" and "used up").
 */
export async function applyReferralAction(raw: string): Promise<ReferralResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`referral:${ip}`, 15, 600)).ok) return { ok: false, error: "Too many tries. Wait a few minutes." };
  const ref = await findReferral(raw.trim());
  if (!ref) return { ok: false, error: "That code isn't valid." };
  (await cookies()).set(REF_COOKIE, ref.code, { maxAge: REF_DAYS * 86_400, path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
  return { ok: true, message: `${ref.mentorFirst}'s code applied.` };
}
