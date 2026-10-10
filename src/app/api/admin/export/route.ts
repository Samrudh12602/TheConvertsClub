import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/server/demo";
import { audit } from "@/server/audit";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV cells that start with = + - @ would run as formulas when opened in a spreadsheet; a leading apostrophe keeps them text. */
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: unknown[][]) => [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

/** Admin-only downloads: ?type=students or ?type=payments. Real data only unless the demo admin is asking. */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const type = req.nextUrl.searchParams.get("type");
  const db = await adminDb();
  let body: string;
  if (type === "students") {
    const rows = await db.user.findMany({ where: { role: "STUDENT" }, orderBy: { createdAt: "desc" }, include: { studentProfile: true, enrollments: { where: { status: "ACTIVE" }, include: { product: { select: { name: true } } } }, _count: { select: { studentSessions: true } } } });
    body = csv(["Name", "Email", "Phone", "College", "Status", "Plans", "Sessions", "Joined"], rows.map((u) => [u.name, u.email, u.phone, u.studentProfile?.college, u.status, u.enrollments.map((e) => e.product.name).join("; "), u._count.studentSessions, u.createdAt]));
  } else if (type === "payments") {
    const rows = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5000, include: { product: { select: { name: true } }, coupon: { select: { code: true } } } });
    body = csv(["Order", "Date", "Name", "Email", "Product", "Status", "List price (INR)", "Discount (INR)", "Paid (INR)", "Coupon", "Early bird"], rows.map((o) => [o.id, o.createdAt, o.guestName, o.guestEmail, o.product.name, o.status, o.listPricePaise / 100, o.discountPaise / 100, o.amountPaise / 100, o.coupon?.code, o.earlyBird ? "yes" : ""]));
  } else return NextResponse.json({ error: "unknown export" }, { status: 400 });
  await audit({ actorId: user.id, action: "admin.export", entity: "Export", entityId: type, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null });
  return new NextResponse(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="converts-club-${type}-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
}
