import { z } from "zod";
import { normalizeIndianPhone } from "@/lib/validation/forms";

export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Outside India",
] as const;
export const EXAMS = ["CAT", "XAT", "NMAT", "SNAP", "CMAT", "IIFT", "MAT", "GMAT", "MAH-CET", "TISSNET", "Other"] as const;
export const BOARDS = ["CBSE", "ICSE / ISC", "State board", "IB", "Other"] as const;
export const DOC_KINDS = { CALL_LETTER: "Call letter", ADMIT_LETTER: "Admit letter", EXAM_RESULT: "Exam result", OTHER: "Other" } as const;
export type DocKind = keyof typeof DOC_KINDS;

const text = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v)).nullable().optional();
const percent = z.union([z.number(), z.string()]).transform((v) => (v === "" || v === null ? null : Number(v))).refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 100), "A percentage is between 0 and 100").nullable().optional();
const thisYear = () => new Date().getFullYear();
const year = (min: number) => z.union([z.number(), z.string()]).transform((v) => (v === "" || v === null ? null : Number(v))).refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= thisYear() + 1), "Enter a valid year").nullable().optional();

export const basicsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100, "That name is too long"),
  phone: z.string().trim().refine((v) => v === "" || normalizeIndianPhone(v) !== null, "Enter a 10-digit Indian mobile number").transform((v) => (v === "" ? null : normalizeIndianPhone(v))),
});

export const studentBackgroundSchema = z.object({
  dob: z.string().trim().refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "Enter a valid date of birth").refine((v) => {
    if (v === "") return true;
    const age = (Date.now() - Date.parse(v)) / (365.25 * 86_400_000);
    return age >= 14 && age <= 70;
  }, "That date of birth doesn't look right").transform((v) => (v === "" ? null : new Date(`${v}T00:00:00.000Z`))),
  state: z.string().trim().refine((v) => v === "" || (STATES as readonly string[]).includes(v), "Pick a state from the list").transform((v) => (v === "" ? null : v)),
  city: text(80),
  examsAppearing: z.array(z.string().trim().min(1).max(30)).max(10),
  tenthBoard: text(40), tenthPercent: percent, tenthYear: year(1985),
  twelfthBoard: text(40), twelfthStream: text(40), twelfthPercent: percent, twelfthYear: year(1985),
  college: text(120), degree: text(120), gradYear: year(1985), gradScore: text(30),
  workExMonths: z.union([z.number(), z.string()]).transform((v) => (v === "" || v === null ? null : Number(v))).refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 600), "Work experience is in whole months, 0 to 600").nullable().optional(),
  company: text(100), jobRole: text(100), industry: text(100),
  about: text(600),
});
export type StudentBackgroundInput = z.input<typeof studentBackgroundSchema>;

export const mentorAboutSchema = z.object({
  convertedInstitutes: z.array(z.string().trim().min(1).max(60)).max(12),
  examScores: text(200), company: text(100), jobRole: text(100),
});

export const documentSchema = z.object({
  kind: z.enum(["CALL_LETTER", "ADMIT_LETTER", "EXAM_RESULT", "OTHER"]),
  title: z.string().trim().min(2, "Say which exam or institute this is for").max(100),
  year: year(1990),
  score: text(60), note: text(300),
});

/** How complete a student's profile is, and what's still missing, so the page can nudge without nagging. */
export function studentCompleteness(p: { dob?: Date | null; state?: string | null; examsAppearing?: string[]; tenthPercent?: number | null; twelfthPercent?: number | null; college?: string | null; workExMonths?: number | null; about?: string | null } | null, docCount: number, hasPhoto: boolean): { pct: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ["a photo", hasPhoto],
    ["your date of birth", Boolean(p?.dob)],
    ["your state", Boolean(p?.state)],
    ["the exams you're giving", (p?.examsAppearing?.length ?? 0) > 0],
    ["your school marks (10th or 12th)", p?.tenthPercent != null || p?.twelfthPercent != null],
    ["your graduation", Boolean(p?.college)],
    ["your work experience (0 if you're a fresher)", p?.workExMonths != null],
    ["a few lines about you", Boolean(p?.about)],
    ["an exam result or call letter", docCount > 0],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([k]) => k) };
}
