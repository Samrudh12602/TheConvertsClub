import { NextResponse, type NextRequest } from "next/server";
import { sendWeeklyDigest } from "@/server/automations";
import { cronGuard } from "@/server/cron-auth";

export const runtime = "nodejs";
/** Sundays 18:30 IST: one email to the owner with the week's numbers and what needs them. */
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await sendWeeklyDigest()) });
}
