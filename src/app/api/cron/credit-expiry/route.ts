import { NextResponse, type NextRequest } from "next/server";
import { cronGuard } from "@/server/cron-auth";
import { runCreditExpiry } from "@/server/credit-expiry";

export const runtime = "nodejs";
/** Daily. A no-op until the admin turns on "Credit validity (days)" in Settings. */
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await runCreditExpiry()) });
}
