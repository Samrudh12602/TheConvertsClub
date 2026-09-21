"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { loginEmailSchema } from "@/lib/validation/forms";
import { safeNext } from "@/lib/roles";
import { rateLimit } from "@/server/ratelimit";

export interface LoginState {
  error?: string;
}

const dest = (formData: FormData) => safeNext(String(formData.get("next") ?? "")) ?? "/go";

export async function googleSignIn(formData: FormData) {
  await signIn("google", { redirectTo: dest(formData) });
}

export async function emailSignIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" };
  const email = parsed.data.email.toLowerCase();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const [byIp, byEmail] = await Promise.all([rateLimit(`login-ip:${ip}`, 10, 900), rateLimit(`login-email:${email}`, 5, 900)]);
  if (!byIp.ok || !byEmail.ok) return { error: "Too many attempts. Wait a few minutes and try again." };
  try {
    await signIn("resend", { email, redirectTo: dest(formData) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "We couldn't send the login email. Try again, or use another way to sign in." };
    throw e; // NEXT_REDIRECT
  }
  return {};
}

export async function demoSignIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("demo", { email: formData.get("email"), passcode: formData.get("passcode"), redirectTo: dest(formData) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "That email and passcode don't match a demo account." };
    throw e;
  }
  return {};
}
