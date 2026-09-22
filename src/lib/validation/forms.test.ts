import { describe, expect, it } from "vitest";
import { guestDetailsSchema, mentorApplicationSchema, normalizeIndianPhone, setPasswordSchema, signupSchema } from "./forms";

describe("normalizeIndianPhone", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["91-9876543210", "9876543210"],
    ["09876543210", "9876543210"],
  ])("accepts %s", (input, out) => expect(normalizeIndianPhone(input)).toBe(out));

  it.each(["12345", "5876543210", "98765432101", "abcdefghij", ""])("rejects %s", (input) =>
    expect(normalizeIndianPhone(input)).toBeNull(),
  );
});

describe("guestDetailsSchema", () => {
  it("accepts good details", () => {
    expect(guestDetailsSchema.safeParse({ name: "Ananya Nair", email: " a@b.co ", phone: "+91 9876543210" }).success).toBe(true);
  });
  it("reports each bad field", () => {
    const r = guestDetailsSchema.safeParse({ name: "A", email: "nope", phone: "1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(r.error.flatten().fieldErrors).sort()).toEqual(["email", "name", "phone"]);
  });
});

describe("mentorApplicationSchema", () => {
  const base = { name: "Rohit K", email: "r@x.in", phone: "9876543210", institute: "IIM L, 2026", callsConverted: "IIM A, 2025", linkedinUrl: "https://linkedin.com/in/rohitk", hoursPerWeek: "4" };
  it("accepts a complete application", () => expect(mentorApplicationSchema.safeParse(base).success).toBe(true));
  it.each(["0", "41", "abc", "", "4.5"])("rejects hours %s", (h) =>
    expect(mentorApplicationSchema.safeParse({ ...base, hoursPerWeek: h }).success).toBe(false),
  );
  it.each(["https://twitter.com/rohitk", "not-a-url", ""])("rejects a non-LinkedIn URL: %s", (u) =>
    expect(mentorApplicationSchema.safeParse({ ...base, linkedinUrl: u }).success).toBe(false),
  );
  it.each(["https://linkedin.com/in/rohitk", "https://www.linkedin.com/in/rohitk", "https://in.linkedin.com/in/rohitk"])("accepts LinkedIn variants: %s", (u) =>
    expect(mentorApplicationSchema.safeParse({ ...base, linkedinUrl: u }).success).toBe(true),
  );
});

describe("signupSchema", () => {
  const base = { name: "Ananya Nair", email: "ananya@example.com", password: "correct-horse-1", confirmPassword: "correct-horse-1" };
  it("accepts matching passwords", () => expect(signupSchema.safeParse(base).success).toBe(true));
  it("rejects mismatched confirmation", () => {
    const r = signupSchema.safeParse({ ...base, confirmPassword: "different-1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });
  it("rejects a password under 8 characters", () => expect(signupSchema.safeParse({ ...base, password: "short1", confirmPassword: "short1" }).success).toBe(false));
});

describe("setPasswordSchema", () => {
  it("accepts matching passwords", () => expect(setPasswordSchema.safeParse({ password: "a-fine-password-1", confirmPassword: "a-fine-password-1" }).success).toBe(true));
  it("rejects mismatched confirmation", () => expect(setPasswordSchema.safeParse({ password: "a-fine-password-1", confirmPassword: "nope" }).success).toBe(false));
});
