import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

const TYPES = new Set(["image/png", "image/jpeg"]);

/**
 * A picture from a mock paper. A picture inside a question is served to a student who has started that mock; a picture inside a solution
 * only once they have submitted it (so a solution can't be seen early by opening its link). The admin can see everything, for previews.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const user = await currentUser();
  if (!user) return new NextResponse("Sign in to view this.", { status: 401 });
  const img = await db.mockImage.findUnique({ where: { id } });
  if (!img || !TYPES.has(img.contentType)) return new NextResponse("Not found", { status: 404 });
  if (user.role !== "ADMIN") {
    const att = user.role === "STUDENT" ? await db.mockAttempt.findUnique({ where: { userId_mockId: { userId: user.id, mockId: img.mockId } }, select: { status: true } }) : null;
    const allowed = att && (img.scope === "QUESTION" || att.status === "SUBMITTED");
    if (!allowed) return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(img.bytes), {
    headers: { "content-type": img.contentType, "cache-control": "private, max-age=86400, immutable", "x-content-type-options": "nosniff", "content-length": String(img.bytes.length) },
  });
}
