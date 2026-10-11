import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/server/session";
import { MailboxError, attachmentOf, type FolderKey } from "@/server/mailbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOLDERS = new Set<FolderKey>(["inbox", "sent", "spam", "trash"]);

/** An attachment of a message in the admin's mailbox. Admin only, and always downloaded (never shown in the page) so an HTML file cannot run here. */
export async function GET(req: NextRequest) {
  const viewer = await currentUser();
  if (!viewer || viewer.role !== "ADMIN") return new NextResponse("Not found", { status: 404 });
  const q = req.nextUrl.searchParams;
  const folder = q.get("folder") as FolderKey;
  const uid = Number(q.get("uid"));
  const index = Number(q.get("i"));
  if (!FOLDERS.has(folder) || !Number.isInteger(uid) || uid < 1 || !Number.isInteger(index) || index < 0) return new NextResponse("Not found", { status: 404 });
  try {
    const a = await attachmentOf(folder, uid, index);
    if (!a) return new NextResponse("Not found", { status: 404 });
    const name = a.filename.replace(/[^\w.\- ]+/g, "_");
    return new NextResponse(new Uint8Array(a.content), { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${name}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (e) {
    return new NextResponse(e instanceof MailboxError ? e.message : "Could not fetch the attachment.", { status: 502 });
  }
}
