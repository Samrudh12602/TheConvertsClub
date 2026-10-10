import type { db as Db } from "@/lib/db";

export const SNAP_TEST_SLUG = "snap-test-mock";
export const SNAP_FIVE_SLUG = "snap-mocks-5";
export const SNAP_TEN_SLUG = "snap-mocks-10";
/** +5 mocks for someone who bought the 5-pack, taking them to 10. */
export const SNAP_UPGRADE_SLUG = "snap-upgrade-10";
export const SNAP_SERIES_TOTAL = 10;

export interface SnapStanding { test: boolean; five: boolean; ten: boolean; upgraded: boolean }

/** What a student has bought from the SNAP range (active purchases only: a refunded one doesn't count). */
export async function snapStanding(client: Pick<typeof Db, "enrollment">, userId: string): Promise<SnapStanding> {
  const rows = await client.enrollment.findMany({ where: { userId, status: "ACTIVE", product: { slug: { startsWith: "snap-" } } }, select: { product: { select: { slug: true } } } });
  const has = (slug: string) => rows.some((r) => r.product.slug === slug);
  return { test: has(SNAP_TEST_SLUG), five: has(SNAP_FIVE_SLUG), ten: has(SNAP_TEN_SLUG), upgraded: has(SNAP_UPGRADE_SLUG) };
}

/**
 * Which SNAP products to put in front of a student, in order:
 *  - nothing bought yet: the three plans
 *  - only the test mock: the 5-pack and the 10-pack
 *  - the 5-pack: the +5 upgrade to 10
 *  - the 10-pack (or the upgrade): nothing more to sell
 */
export function offerSlugs(st: SnapStanding): string[] {
  if (st.ten || st.upgraded) return [];
  if (st.five) return [SNAP_UPGRADE_SLUG];
  if (st.test) return [SNAP_FIVE_SLUG, SNAP_TEN_SLUG];
  return [SNAP_TEST_SLUG, SNAP_FIVE_SLUG, SNAP_TEN_SLUG];
}

/** Whether this student may buy the +5 upgrade: they hold the 5-pack and haven't already gone to 10. */
export function upgradeStatus(st: SnapStanding): { eligible: boolean; reason?: string } {
  if (st.ten || st.upgraded) return { eligible: false, reason: "You already have all 10 mocks." };
  if (!st.five) return { eligible: false, reason: "The upgrade is for students who bought the 5-mock pack." };
  return { eligible: true };
}

/** How many series mocks are live right now (the test mock is not counted). */
export async function seriesLive(client: Pick<typeof Db, "mock">): Promise<number> {
  return client.mock.count({ where: { status: "PUBLISHED", isTest: false, OR: [{ releaseAt: null }, { releaseAt: { lte: new Date() } }] } });
}
