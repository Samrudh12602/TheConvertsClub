import bcrypt from "bcryptjs";

export class PasswordError extends Error {}

const MIN_LENGTH = 8;

/** Same bar everywhere a password is set: at least 8 characters, not one of the most-guessed ones. */
const COMMON = new Set(["password", "password1", "12345678", "123456789", "qwertyui", "letmein1", "iloveyou", "convertclub", "convertsclub"]);

export function checkPasswordStrength(password: string): void {
  if (password.length < MIN_LENGTH) throw new PasswordError(`Password must be at least ${MIN_LENGTH} characters.`);
  if (COMMON.has(password.toLowerCase())) throw new PasswordError("That password is too common. Choose another.");
}

export async function hashPassword(password: string): Promise<string> {
  checkPasswordStrength(password);
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
