import { describe, expect, it } from "vitest";
import { checkPasswordStrength, hashPassword, PasswordError, verifyPassword } from "./password";

describe("checkPasswordStrength", () => {
  it("rejects short passwords", () => expect(() => checkPasswordStrength("short1")).toThrow(PasswordError));
  it("rejects common passwords, case-insensitively", () => {
    expect(() => checkPasswordStrength("password")).toThrow(/too common/);
    expect(() => checkPasswordStrength("PASSWORD1")).toThrow(/too common/);
  });
  it("accepts a reasonable password", () => expect(() => checkPasswordStrength("correct-horse-battery")).not.toThrow());
});

describe("hashPassword / verifyPassword", () => {
  it("round-trips correctly", async () => {
    const hash = await hashPassword("a-fine-password-1");
    expect(hash).not.toContain("a-fine-password-1");
    expect(await verifyPassword("a-fine-password-1", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-1", hash)).toBe(false);
  });
  it("produces a different hash each time (salted)", async () => {
    const a = await hashPassword("a-fine-password-1");
    const b = await hashPassword("a-fine-password-1");
    expect(a).not.toBe(b);
  });
  it("refuses to hash a weak password", async () => {
    await expect(hashPassword("weak")).rejects.toThrow(PasswordError);
  });
});
