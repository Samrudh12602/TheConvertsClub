import { z } from "zod";

const email = z.string().trim().pipe(z.email("Enter a valid email address"));

/** Indian mobile: 10 digits starting 6-9, with optional +91 / 91 / 0 prefix and spaces or dashes. */
export const normalizeIndianPhone = (raw: string): string | null => {
  const digits = raw.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

const phone = z
  .string()
  .trim()
  .refine((v) => normalizeIndianPhone(v) !== null, "Enter a 10-digit Indian mobile number");

export const guestDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100, "That name is too long"),
  email,
  phone,
});
export type GuestDetails = z.infer<typeof guestDetailsSchema>;

export const loginEmailSchema = z.object({ email });
export type LoginEmail = z.infer<typeof loginEmailSchema>;

const password = z.string().min(8, "At least 8 characters");

export const passwordLoginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });
export type PasswordLogin = z.infer<typeof passwordLoginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(100),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "Passwords don't match", path: ["confirmPassword"] });
export type SignupInput = z.infer<typeof signupSchema>;

export const setPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { error: "Passwords don't match", path: ["confirmPassword"] });
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

const linkedinUrl = z
  .string()
  .trim()
  .pipe(z.url("Enter your LinkedIn profile URL"))
  .refine((u) => /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(u), "That doesn't look like a LinkedIn URL");

export const mentorApplicationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email,
  phone,
  institute: z.string().trim().min(3, "Tell us your institute and batch").max(120),
  callsConverted: z.string().trim().min(3, "Tell us which calls you converted").max(500),
  linkedinUrl,
  hoursPerWeek: z
    .string()
    .trim()
    .refine((v) => /^\d{1,2}$/.test(v) && Number(v) >= 1 && Number(v) <= 40, "Enter a number of hours between 1 and 40"),
});
export type MentorApplicationInput = z.infer<typeof mentorApplicationSchema>;
