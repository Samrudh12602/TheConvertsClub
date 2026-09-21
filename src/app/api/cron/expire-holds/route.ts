import { NextResponse, type NextRequest } from "next/server";
import { expireHolds } from "@/server/booking";
import { cronGuard } from "@/server/cron-auth";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const denied = cronGuard(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, released: await expireHolds() });
}
