import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

/** A call letter, admit letter or result file. Only the person who added it, or the admin, can open it. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewer = await currentUser();
  if (!viewer) return new NextResponse("Sign in to view this.", { status: 401 });
  const d = await db.profileDocument.findUnique({ where: { id } });
  if (!d?.fileKey || (d.userId !== viewer.id && viewer.role !== "ADMIN")) return new NextResponse("Not found", { status: 404 });
  const blob = await get(d.fileKey, { access: "private" });
  if (!blob) return new NextResponse("Not found", { status: 404 });
  if (viewer.id !== d.userId) await audit({ actorId: viewer.id, action: "profile.doc_view", entity: "ProfileDocument", entityId: d.id });
  const name = (d.fileName ?? "document").replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(blob.stream, { headers: { "content-type": d.contentType ?? "application/octet-stream", "content-disposition": `inline; filename="${name}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
