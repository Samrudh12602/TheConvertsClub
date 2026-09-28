import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "private, no-store" };

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401, headers: noStore });
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 15, select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return NextResponse.json({ unread, items }, { headers: noStore });
}

/** Body: `{ all: true }` or `{ id: "<notification id>" }`. Scoped to the signed-in user, so ids can't touch anyone else's. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401, headers: noStore });
  const body = (await req.json().catch(() => null)) as { all?: boolean; id?: string } | null;
  const now = new Date();
  if (body?.all) await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: now } });
  else if (typeof body?.id === "string") await db.notification.updateMany({ where: { id: body.id, userId: user.id, readAt: null }, data: { readAt: now } });
  else return NextResponse.json({ error: "Bad request" }, { status: 400, headers: noStore });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
