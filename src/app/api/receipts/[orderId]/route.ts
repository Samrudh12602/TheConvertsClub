import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loadReceiptData, RECEIPT_STATUSES } from "@/server/receipt";
import { renderReceiptPdf } from "@/server/receipt-pdf";
import { verifyReceiptToken } from "@/server/receipt-access";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

/**
 * Serves the receipt PDF for one order. Two ways in, both scoped to this exact order — never a bare
 * "any order id works": the signed-in owner (checked against the real order row, the normal path once
 * someone has logged in), or a short-lived signed token (?token=...) for the checkout success page,
 * which may load before a first-time guest buyer has ever signed in. Rendered locally; nothing about
 * the buyer's name, email or amount is sent to a third party.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const [user, order] = await Promise.all([currentUser(), db.order.findUnique({ where: { id: orderId }, select: { userId: true, status: true } })]);
  if (!order || !(RECEIPT_STATUSES as readonly string[]).includes(order.status)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const owns = Boolean(user && user.id === order.userId);
  const tokenOk = !owns && (await verifyReceiptToken(orderId, req.nextUrl.searchParams.get("token") ?? ""));
  if (!owns && !tokenOk) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const receipt = await loadReceiptData(orderId);
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const pdf = await renderReceiptPdf(receipt);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="receipt-${orderId}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
