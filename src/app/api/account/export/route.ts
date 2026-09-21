import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/server/session";
import { audit } from "@/server/audit";

export const runtime = "nodejs";

/** DPDP-style data export: everything we hold about the signed-in student, as JSON. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const [profile, calls, sessions, reviews, orders, ledger] = await Promise.all([
    db.studentProfile.findUnique({ where: { userId: user.id } }),
    db.callTracker.findMany({ where: { studentId: user.id } }),
    db.session.findMany({ where: { studentId: user.id }, include: { feedback: { select: { scores: true, overall: true, strengths: true, weaknesses: true, redFlags: true, answerFraming: true, questionsToPrepare: true, recommendation: true, submittedAt: true } }, rating: true } }),
    db.review.findMany({ where: { studentId: user.id }, select: { kind: true, title: true, fileName: true, textBody: true, status: true, submittedAt: true, completedAt: true } }),
    db.order.findMany({ where: { userId: user.id }, include: { product: { select: { name: true } }, payments: { select: { razorpayPaymentId: true, amountPaise: true, status: true, capturedAt: true } } } }),
    db.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);
  await audit({ actorId: user.id, action: "account.export", entity: "User", entityId: user.id });
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, name: user.name, phone: user.phone, createdAt: user.createdAt }, profile, calls, sessions, reviews, orders, creditLedger: ledger }, null, 2);
  return new NextResponse(body, { headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="convert-club-my-data.json"', "cache-control": "private, no-store" } });
}
