import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel } from "@/components/portal/ui";
import { RefundButton } from "@/components/admin/refund-form";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finance" };

export default async function FinancePage() {
  const [grossAgg, feeAgg, refundAgg, payableAgg, payments, byProduct] = await Promise.all([
    db.order.aggregate({ where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, _sum: { amountPaise: true } }),
    db.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { feePaise: true, taxPaise: true } }),
    db.refund.aggregate({ _sum: { amountPaise: true }, _count: true }),
    db.payoutAccrual.aggregate({ _sum: { amountPaise: true } }),
    db.order.findMany({ where: { status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } }, orderBy: { createdAt: "desc" }, take: 25, include: { product: { select: { name: true } }, payments: { select: { razorpayPaymentId: true } } } }),
    db.order.groupBy({ by: ["productId"], where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, _sum: { amountPaise: true }, orderBy: { _sum: { amountPaise: "desc" } } }),
  ]);
  const products = Object.fromEntries((await db.product.findMany({ select: { id: true, name: true } })).map((p) => [p.id, p.name]));
  const gross = grossAgg._sum.amountPaise ?? 0;
  const fees = feeAgg._sum.feePaise ?? 0;
  const refunds = refundAgg._sum.amountPaise ?? 0;
  const mentorCost = payableAgg._sum.amountPaise ?? 0;
  const net = gross - fees - refunds - mentorCost;
  const topAmount = byProduct[0]?._sum.amountPaise ?? 1;

  return (
    <PortalPage width="max-w-[1000px]">
      <KpiGrid>
        <Kpi label="Gross revenue" value={formatPaise(gross)} note="Season to date" />
        <Kpi label="Gateway fees" value={formatPaise(fees)} note={gross ? `${((fees / gross) * 100).toFixed(1)}% blended` : ""} />
        <Kpi label="Refunds" value={formatPaise(refunds)} note={`${refundAgg._count} orders`} noteTone="oxblood" />
        <Kpi label="Mentor cost" value={formatPaise(mentorCost)} note={gross ? `${((mentorCost / gross) * 100).toFixed(0)}% of gross` : ""} />
        <Kpi label="Net" value={formatPaise(net)} note="After fees, refunds, payouts" noteTone="green" />
      </KpiGrid>

      <Panel title="Revenue by product" flush={false}>
        <div className="flex flex-col gap-3">
          {byProduct.map((p) => (
            <div key={p.productId}>
              <div className="flex justify-between gap-2 text-[12.5px]"><span className="text-ink-2">{products[p.productId] ?? "—"}</span><span className="tnum font-semibold text-ink">{formatPaise(p._sum.amountPaise ?? 0)}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded bg-line-soft"><div className="h-full bg-oxblood" style={{ width: `${((p._sum.amountPaise ?? 0) / topAmount) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Recent payments">
        {payments.length === 0 ? <Empty>No payments yet.</Empty> : payments.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
            <span className="min-w-0 flex-1 text-ink-body">{o.guestName} · {o.product.name}</span>
            <span className="text-ink-faint">{fmtDate(o.createdAt)}</span>
            <span className="tnum font-semibold text-ink">{formatPaise(o.amountPaise)}</span>
            {o.status === "PAID" && <RefundButton orderId={o.id} />}
            {o.status !== "PAID" && <span className="text-[11px] text-ink-faint">{o.status}</span>}
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
