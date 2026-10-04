import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const TEMP_PASSWORD_DAYS = 7;
// No 0/O, 1/l/I: a password someone has to read off an email and type must survive being misread.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** A random 12-character password in three groups, e.g. "Kp7x-Q2mH-vN9r" (about 68 bits). */
export function generateTempPassword(): string {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

/**
 * Gives an account a fresh temporary password and marks it "must change". The plain password is returned
 * once, to be emailed; only its hash is stored. It stops working after a week, and the moment the person
 * sets their own (see `firstPasswordAction`), which replaces the hash.
 */
export async function issueTempPassword(userId: string, now = new Date()): Promise<{ password: string; expiresAt: Date }> {
  const password = generateTempPassword();
  const expiresAt = new Date(now.getTime() + TEMP_PASSWORD_DAYS * 86_400_000);
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true, tempPasswordExpiresAt: expiresAt } });
  return { password, expiresAt };
}

/** True when a temporary password is past its week and must no longer log anyone in. */
export const tempPasswordExpired = (u: { mustChangePassword: boolean; tempPasswordExpiresAt: Date | null }, now = new Date()) =>
  u.mustChangePassword && u.tempPasswordExpiresAt !== null && u.tempPasswordExpiresAt.getTime() < now.getTime();
