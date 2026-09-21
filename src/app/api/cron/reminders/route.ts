import { NextResponse, type NextRequest } from "next/server";
import { cronGuard } from "@/server/cron-auth";
import { sendReminders } from "@/server/reminders";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await sendReminders()) });
}
