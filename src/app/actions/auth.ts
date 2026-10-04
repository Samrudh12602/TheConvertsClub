"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { roleHome } from "@/lib/roles";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { setPasswordSchema } from "@/lib/validation/forms";
import { currentUser } from "@/server/session";
import { hashPassword, PasswordError, verifyPassword } from "@/server/password";
import { rateLimit } from "@/server/ratelimit";
import { audit } from "@/server/audit";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export type SetPasswordResult = { ok: true; message: string } | { ok: false; error: string };

/** Any signed-in user (student, mentor, admin) can set or change a password from their own account
 * settings — no old password needed, since they're already proven to own the account by being
 * signed in another way (magic link, Google, or an existing password). */
export async function setPasswordAction(_prev: SetPasswordResult | null, formData: FormData): Promise<SetPasswordResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "You need to be signed in." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`set-password:${user.id}`, 10, 900)).ok || !(await rateLimit(`set-password-ip:${ip}`, 20, 900)).ok) {
    return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  }
  const parsed = setPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your password." };
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await db.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false, tempPasswordExpiresAt: null } });
    await audit({ actorId: user.id, action: "auth.password_set", entity: "User", entityId: user.id, ip });
    return { ok: true, message: "Password saved. You can sign in with it from now on." };
  } catch (e) {
    if (e instanceof PasswordError) return { ok: false, error: e.message };
    console.error("setPasswordAction failed", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export type FirstPasswordState = { error?: string };

/**
 * First login with a temporary password: choose a permanent one. The temporary hash is overwritten (so it
 * can never be used again), the "must change" flag is cleared, and the person goes to their portal.
 */
export async function firstPasswordAction(_prev: FirstPasswordState, formData: FormData): Promise<FirstPasswordState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect(roleHome(user.role));
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`first-password:${user.id}`, 10, 900)).ok) return { error: "Too many attempts. Wait a few minutes and try again." };
  const parsed = setPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your password." };
  if (user.passwordHash && (await verifyPassword(parsed.data.password, user.passwordHash))) return { error: "Choose a new password, different from the temporary one." };
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await db.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false, tempPasswordExpiresAt: null } });
    await audit({ actorId: user.id, action: "auth.first_password_set", entity: "User", entityId: user.id, ip });
  } catch (e) {
    if (e instanceof PasswordError) return { error: e.message };
    console.error("firstPasswordAction failed", e);
    return { error: "Something went wrong. Please try again." };
  }
  redirect(roleHome(user.role));
}
