import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Public mentor photo — no login required, since it's meant to appear on the public /mentors page.
 * Still gated on the same visibility rules the page itself uses (active, public, not the admin's own
 * mentor mode), so an offboarded or hidden mentor's photo stops being servable too.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ mentorId: string }> }) {
  const { mentorId } = await ctx.params;
  const mentor = await db.mentorProfile.findUnique({ where: { id: mentorId }, select: { photoKey: true, status: true, publicVisible: true, isAdminMentor: true } });
  if (!mentor?.photoKey || mentor.status !== "ACTIVE" || !mentor.publicVisible || mentor.isAdminMentor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const blob = await get(mentor.photoKey, { access: "private" });
  if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(blob.stream, {
    headers: {
      "content-type": blob.headers.get("content-type") ?? "image/jpeg",
      // The key includes a random id, so a new upload gets a new URL — safe to cache hard.
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
