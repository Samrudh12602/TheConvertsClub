import type { db as Db } from "@/lib/db";

/** SNAP mock products are sold as `snap-…`. Everything else is part of the GDPI prep offering. */
export const isSnapSlug = (slug: string) => slug.startsWith("snap-");

/**
 * True when the student bought anything from the GDPI prep offering. Someone who only bought SNAP mocks has no use for the
 * interview-prep screens (booking, GD batches, onboarding), so the portal keeps them to the mocks.
 */
export async function hasGdpiPlan(client: Pick<typeof Db, "enrollment">, userId: string): Promise<boolean> {
  return (await client.enrollment.count({ where: { userId, status: "ACTIVE", product: { slug: { not: { startsWith: "snap-" } } } } })) > 0;
}

/** True for a student who only ever bought SNAP mocks and has no GDPI plan, session or review. */
export async function isMockOnly(client: Pick<typeof Db, "enrollment" | "session" | "review">, userId: string): Promise<boolean> {
  const [snap, gdpi, sessions, reviews] = await Promise.all([
    client.enrollment.count({ where: { userId, status: "ACTIVE", product: { slug: { startsWith: "snap-" } } } }),
    hasGdpiPlan(client, userId),
    client.session.count({ where: { studentId: userId } }),
    client.review.count({ where: { studentId: userId } }),
  ]);
  return snap > 0 && !gdpi && sessions === 0 && reviews === 0;
}

/** Pages everyone sees. A student who hasn't bought anything yet sees only these: they are there to buy mocks. */
export const NEW_STUDENT_NAV = ["/student", "/student/mocks", "/student/library", "/student/messages", "/student/payments", "/student/settings", "/student/help"];

/**
 * Where a student is in their journey, which decides what the portal shows them:
 *  - "new":   hasn't bought anything. Plans, and a push to buy a SNAP mock.
 *  - "mocks": bought SNAP mocks only. Everything else is listed, locked ("coming soon" or "buy a plan").
 *  - "gdpi":  has an interview-prep plan, a session or a review. The full portal.
 */
export type StudentStage = "new" | "mocks" | "gdpi";

export async function studentStage(client: Pick<typeof Db, "enrollment" | "session" | "review" | "creditLedger" | "mockAttempt">, userId: string): Promise<StudentStage> {
  const [gdpiPlan, sessions, reviews, gdpiCredits, snapPlan, snapCredits, attempts] = await Promise.all([
    hasGdpiPlan(client, userId),
    client.session.count({ where: { studentId: userId } }),
    client.review.count({ where: { studentId: userId } }),
    client.creditLedger.count({ where: { userId, type: "GRANT", kind: { notIn: ["SNAP_MOCK", "SNAP_TEST_MOCK"] } } }),
    client.enrollment.count({ where: { userId, status: "ACTIVE", product: { slug: { startsWith: "snap-" } } } }),
    client.creditLedger.count({ where: { userId, type: "GRANT", kind: { in: ["SNAP_MOCK", "SNAP_TEST_MOCK"] } } }),
    client.mockAttempt.count({ where: { userId } }),
  ]);
  if (gdpiPlan || sessions > 0 || reviews > 0 || gdpiCredits > 0) return "gdpi";
  if (snapPlan > 0 || snapCredits > 0 || attempts > 0) return "mocks";
  return "new";
}

/** The interview-prep screens a mocks-only student sees locked. The key is the last part of the real route. */
export const LOCKED_FEATURES = {
  book: { path: "/student/book", label: "Book a session", blurb: "One-hour mock interviews with mentors who converted the same calls last season, with written feedback." },
  gd: { path: "/student/gd", label: "GD / GE batches", blurb: "Live group discussions with a moderator who interrupts like a real panel, and notes for you alone." },
  sessions: { path: "/student/sessions", label: "My sessions", blurb: "Your booked sessions, joining links, recordings and the feedback from each." },
  reviews: { path: "/student/reviews", label: "WAT & SOP", blurb: "Upload an essay or your SOP and get it marked, with the weakest paragraph rewritten." },
  progress: { path: "/student/progress", label: "Progress", blurb: "How your interview scores trend from session to session." },
  calls: { path: "/student/calls", label: "My calls", blurb: "Track every interview date and outcome in one place." },
} as const;
export type LockedKey = keyof typeof LOCKED_FEATURES;
export const lockedKeyFor = (href: string): LockedKey | null => (Object.entries(LOCKED_FEATURES).find(([, v]) => v.path === href)?.[0] as LockedKey | undefined) ?? null;
