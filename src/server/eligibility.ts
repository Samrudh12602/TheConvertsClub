import type { db as Db } from "@/lib/db";

/**
 * Who may buy what from inside the portal.
 *  - Additional PI: only students who came in through a single Mock PI, Call Convert or Call Convert Plus. Nothing else.
 *  - The Panel PI is promoted to students whose only purchase is the single Mock PI (one PI credit), the ones with the most
 *    to gain from a harder, more realistic round.
 */
export const ADDITIONAL_PI_SLUG = "additional-pi";
export const ADDITIONAL_PI_PLANS = ["mock-pi", "call-convert", "call-convert-plus"] as const;
export const ADDITIONAL_PI_NOT_ELIGIBLE = "Additional PI is for students who bought a Mock PI, Call Convert or Call Convert Plus.";

type Client = Pick<typeof Db, "enrollment">;

export async function canBuyAdditionalPi(client: Client, userId: string): Promise<boolean> {
  return (await client.enrollment.count({ where: { userId, status: "ACTIVE", product: { slug: { in: [...ADDITIONAL_PI_PLANS] } } } })) > 0;
}

/** True for a student whose only active purchase is the single Mock PI: they hold one PI credit and nothing bigger. */
export async function isSinglePiStudent(client: Client & Pick<typeof Db, "creditLedger">, userId: string): Promise<boolean> {
  const rows = await client.enrollment.findMany({ where: { userId, status: "ACTIVE" }, select: { product: { select: { slug: true } } } });
  if (rows.length === 0 || !rows.every((r) => r.product.slug === "mock-pi")) return false;
  const panel = await client.creditLedger.count({ where: { userId, kind: "PANEL_PI" } });
  return panel === 0;
}
