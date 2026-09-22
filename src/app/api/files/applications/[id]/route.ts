import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";
import { audit } from "@/server/audit";

export const runtime = "nodejs";

/** Admin-only: the photo an applicant submitted. Never public until (and unless) they're promoted to a mentor. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const app = await db.mentorApplication.findUnique({ where: { id } });
  if (!app?.photoKey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blob = await get(app.photoKey, { access: "private" });
  if (!blob) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit({ actorId: user.id, action: "application.photo_view", entity: "MentorApplication", entityId: app.id });
  return new NextResponse(blob.stream, {
    headers: {
      "content-type": blob.headers.get("content-type") ?? "image/jpeg",
      "content-disposition": `inline; filename="${(app.photoFileName ?? "photo").replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
