import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

/** Admin-only CSV of free-checklist sign-ups (real admins only; the demo admin gets nothing). */
export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN" || user.isDemo) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const rows = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  const csv = ["email,tips_ok,source,signed_up", ...rows.map((r) => `${r.email},${r.tipsConsent ? "yes" : "no"},${r.source},${r.createdAt.toISOString()}`)].join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="checklist-signups.csv"', "cache-control": "private, no-store" } });
}
