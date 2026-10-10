import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loadResult } from "@/server/mocks";
import { renderMockReport } from "@/server/mock-report-pdf";
import { loadReportImages } from "@/server/mock-report-images";
import { audit } from "@/server/audit";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The detailed analysis PDF for one finished attempt. Only its owner (or the admin) can download it, and it's stamped with their name. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to download this." }, { status: 401 });
  const att = await db.mockAttempt.findUnique({ where: { id: attemptId }, select: { userId: true, user: { select: { name: true, email: true } } } });
  if (!att || (att.userId !== user.id && user.role !== "ADMIN")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const view = await loadResult(att.userId, attemptId);
  if (!view) return NextResponse.json({ error: "This attempt isn't finished yet." }, { status: 409 });
  const pdf = await renderMockReport(view, { name: att.user.name ?? att.user.email, email: att.user.email }, undefined, await loadReportImages(view));
  await audit({ actorId: user.id, action: "mock.report_download", entity: "MockAttempt", entityId: attemptId });
  return new NextResponse(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${view.mock.slug}-analysis.pdf"`, "cache-control": "private, no-store" } });
}
