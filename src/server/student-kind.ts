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

/** The only portal pages a mock-only student needs. */
export const MOCK_ONLY_NAV = ["/student", "/student/mocks", "/student/messages", "/student/payments", "/student/settings", "/student/help"];
