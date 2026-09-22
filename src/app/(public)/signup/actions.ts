"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { safeNext } from "@/lib/roles";
import { signupSchema } from "@/lib/validation/forms";
import { hashPassword, PasswordError } from "@/server/password";
import { rateLimit } from "@/server/ratelimit";
import { sendEmail } from "@/server/email";
import { audit } from "@/server/audit";

export interface SignupState {
  error?: string;
}

/** Public self-registration. Always creates a STUDENT account — mentors are invited by Admin or
 * promoted from an application, never self-registered, so tier/screening stays in Admin's hands. */
export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`signup:${ip}`, 8, 3600)).ok) return { error: "Too many attempts. Wait a while and try again." };

  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  const { name, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Log in instead." };

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (e) {
    return { error: e instanceof PasswordError ? e.message : "Choose a different password." };
  }

  const user = await db.user.create({ data: { email, name: name.trim(), role: "STUDENT", passwordHash } });
  await db.studentProfile.create({ data: { userId: user.id } });
  await audit({ actorId: user.id, action: "auth.signup", entity: "User", entityId: user.id, ip });
  try {
    await sendEmail({ template: "welcome_account", to: email, vars: { name: name.trim() }, url: "/packages" });
  } catch (e) {
    console.error("welcome email failed", e);
  }

  const next = safeNext(String(formData.get("next") ?? "")) ?? "/student/onboarding";
  try {
    await signIn("password", { email, password, redirectTo: next });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Account created, but signing you in failed. Try logging in." };
    throw e; // NEXT_REDIRECT
  }
  return {};
}
