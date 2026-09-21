import { NextResponse, type NextRequest } from "next/server";
import { previewBonuses } from "@/server/admin";
import { cronGuard } from "@/server/cron-auth";

export const runtime = "nodejs";
/** Computes milestone bonuses for the current period as "pending approval". Admin approves them on the Payouts screen. */
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  const r = await previewBonuses();
  return NextResponse.json({ ok: true, periodKey: r.periodKey, created: r.created.length });
}
