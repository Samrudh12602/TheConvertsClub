import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

/** A profile photo: shown to its owner and to the admin only. (The public mentor photo is a separate, admin-controlled image.) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const viewer = await currentUser();
  if (!viewer || (viewer.id !== userId && viewer.role !== "ADMIN")) return new NextResponse("Not found", { status: 404 });
  const u = await db.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  if (!u?.avatarKey) return new NextResponse("Not found", { status: 404 });
  const blob = await get(u.avatarKey, { access: "private" });
  if (!blob) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(blob.stream, { headers: { "content-type": blob.headers.get("content-type") ?? "image/jpeg", "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff" } });
}
