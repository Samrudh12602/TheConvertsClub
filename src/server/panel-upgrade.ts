import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { adjustCredit, getBalances, grantCredit } from "@/server/credits";

/**
 * Call Convert and Call Convert Plus students can turn up to two of their unused PIs into Panel PIs for a flat Rs 199 each.
 * (Call Convert Plus already includes one Panel PI.) The Rs 199 is a product (`panel-pi-upgrade`) bought from inside the
 * portal; on payment one PI credit is swapped for one Panel PI credit. Everyone else buys a Panel PI outright (`panel-pi`).
 */
export const PANEL_UPGRADE_SLUG = "panel-pi-upgrade";
export const PANEL_UPGRADE_MAX = 2;
const PLANS = ["call-convert", "call-convert-plus"];
export const NOT_ON_PLAN = "This upgrade is for Call Convert and Call Convert Plus students.";

type Client = Pick<typeof db, "enrollment" | "order" | "creditLedger">;

export interface UpgradeStatus { eligible: boolean; reason: string | null; used: number; left: number; piAvailable: number }

export async function panelUpgradeStatus(client: Client, userId: string): Promise<UpgradeStatus> {
  const [onPlan, used, bal] = await Promise.all([
    client.enrollment.count({ where: { userId, status: "ACTIVE", product: { slug: { in: PLANS } } } }),
    client.order.count({ where: { userId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] }, product: { slug: PANEL_UPGRADE_SLUG } } }),
    getBalances(client as Parameters<typeof getBalances>[0], userId),
  ]);
  const piAvailable = bal.PI?.available ?? 0;
  const left = Math.max(0, PANEL_UPGRADE_MAX - used);
  const reason = !onPlan ? NOT_ON_PLAN
    : left === 0 ? `You've already upgraded ${PANEL_UPGRADE_MAX} mock PIs to Panel PIs, which is the limit.`
    : piAvailable < 1 ? "You need an unused mock PI credit to upgrade."
    : null;
  return { eligible: reason === null, reason, used, left, piAvailable };
}

/** Inside the fulfilment transaction: swap one available PI credit for one Panel PI credit. False if there was no PI left to swap. */
export async function convertPiToPanel(tx: Prisma.TransactionClient, userId: string, enrollmentId: string): Promise<boolean> {
  const bal = await getBalances(tx, userId);
  if ((bal.PI?.available ?? 0) < 1) return false;
  await adjustCredit(tx, { userId, kind: "PI", delta: -1, reason: "Upgraded to a Panel PI", createdById: userId });
  await grantCredit(tx, { userId, kind: "PANEL_PI", quantity: 1, enrollmentId, reason: "Upgrade: mock PI to Panel PI" });
  return true;
}
