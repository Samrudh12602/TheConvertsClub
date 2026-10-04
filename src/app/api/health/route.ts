import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * For a free uptime monitor (e.g. UptimeRobot): 200 only if the site AND its database both answer.
 * Reveals nothing but ok/not-ok and how long the database took.
 */
export async function GET() {
  const t = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, dbMs: Date.now() - t }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
