import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/server/crypto";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Anything else is refused. */
export function cronGuard(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !safeEqual(given, secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
