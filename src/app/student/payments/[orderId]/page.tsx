import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { RECEIPT_STATUSES } from "@/server/receipt";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipt" };

export default async function Receipt({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireStudent();
  const { orderId } = await params;
  const o = await db.order.findUnique({ where: { id: orderId }, include: { product: true, payments: true } });
  if (!o || o.userId !== user.id) notFound();
  const p = o.payments[0];
  const rows: [string, string][] = [["Receipt for", o.guestName], ["Email", o.guestEmail], ["Item", o.product.name], ["List price", formatPaise(o.listPricePaise)], ["Discounts", formatPaise(-o.discountPaise)], ["Total paid", formatPaise(o.amountPaise)], ["Date", p?.capturedAt ? fmtWhen(p.capturedAt) + " IST" : fmtWhen(o.createdAt) + " IST"], ["Payment id", p?.razorpayPaymentId ?? "—"], ["Order id", o.id]];
  const hasReceipt = (RECEIPT_STATUSES as readonly string[]).includes(o.status);
  return (
    <PortalPage width="max-w-[560px]">
      <div className="rounded-xl border border-line bg-card p-6 print:border-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-lg font-bold text-ink">The Convert Club · Receipt</p>
          {hasReceipt && <ButtonLink href={`/api/receipts/${o.id}`} variant="secondary" className="print:hidden">Download PDF</ButtonLink>}
        </div>
        <dl className="mt-4 flex flex-col gap-2">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-line-soft py-2 text-[13px] last:border-0"><dt className="text-ink-muted">{k}</dt><dd className="tnum text-right font-medium text-ink">{v}</dd></div>)}
        </dl>
        <p className="mt-4 text-[11px] leading-normal text-ink-faint">No GST applicable.</p>
      </div>
    </PortalPage>
  );
}
