import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";
import { audit } from "@/server/audit";

export const runtime = "nodejs";

/**
 * Private file download. Allowed: the student who uploaded it, the mentor it's assigned to, and Admin.
 * The blob store is private, so there is no public URL to leak; this route is the only way in.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const review = await db.review.findUnique({ where: { id: reviewId }, include: { assignedMentor: true } });
  if (!review?.fileKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = user.role === "ADMIN" || review.studentId === user.id || review.assignedMentor?.userId === user.id;
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blob = await get(review.fileKey, { access: "private" });
  if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "ADMIN") await audit({ actorId: user.id, action: "file.view", entity: "Review", entityId: review.id });
  return new NextResponse(blob.stream, {
    headers: {
      "content-type": blob.headers.get("content-type") ?? "application/octet-stream",
      "content-disposition": `attachment; filename="${(review.fileName ?? "file").replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
