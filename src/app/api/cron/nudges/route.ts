import { NextResponse, type NextRequest } from "next/server";
import { cronGuard } from "@/server/cron-auth";
import { runNudges } from "@/server/nudges";

export const runtime = "nodejs";
/** Daily: reminders to mentors with no hours, and to students with unused credits or an unfinished profile. */
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await runNudges()) });
}
