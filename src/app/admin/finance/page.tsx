import { PortalPage } from "@/components/portal/portal-page";
import { Banknote, Landmark, PiggyBank, Undo2, Wallet } from "lucide-react";
import { Avatar, Empty, Kpi, KpiGrid, Panel, StatusPill } from "@/components/portal/ui";
import { ExportLinks } from "@/components/admin/reassign-all";
import { RefundButton } from "@/components/admin/refund-form";
import { adminDb } from "@/server/demo";
import { fmtDate } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { gatewayCost } from "@/lib/gateway-fee";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finance" };

export default async function FinancePage() {
  const db = await adminDb();
  const [grossAgg, feeAgg, refundAgg, payableAgg, payments, byProduct] = await Promise.all([
    db.order.aggregate({ where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, _sum: { amountPaise: true } }),
    db.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amountPaise: true } }),
    db.refund.aggregate({ _sum: { amountPaise: true }, _count: true }),
    db.payoutAccrual.aggregate({ _sum: { amountPaise: true } }),
    db.order.findMany({ where: { status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } }, orderBy: { createdAt: "desc" }, take: 25, include: { product: { select: { name: true } }, payments: { select: { razorpayPaymentId: true } } } }),
    db.order.groupBy({ by: ["productId"], where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, _sum: { amountPaise: true }, orderBy: { _sum: { amountPaise: "desc" } } }),
  ]);
  const products = Object.fromEntries((await db.product.findMany({ select: { id: true, name: true } })).map((p) => [p.id, p.name]));
  const gross = grossAgg._sum.amountPaise ?? 0;
  // One rule everywhere: Razorpay keeps 2% plus 18% GST on that 2% (2.36% in all). Refunds don't return the gateway's fee.
  const gateway = gatewayCost(feeAgg._sum.amountPaise ?? 0);
  const fees = gateway.totalPaise;
  const refunds = refundAgg._sum.amountPaise ?? 0;
  const mentorCost = payableAgg._sum.amountPaise ?? 0;
  const net = gross - fees - refunds - mentorCost;
  const topAmount = byProduct[0]?._sum.amountPaise ?? 1;

  return (
    <PortalPage width="max-w-[1000px]">
      <KpiGrid>
        <Kpi label="Gross revenue" value={formatPaise(gross)} note="Season to date" icon={<Banknote />} accent="teal" />
        <Kpi label="Gateway cost" value={formatPaise(fees)} note={`2% fee ${formatPaise(gateway.feePaise)} + 18% GST ${formatPaise(gateway.gstPaise)}`} icon={<Landmark />} accent="stone" />
        <Kpi label="Refunds" value={formatPaise(refunds)} note={`${refundAgg._count} orders`} noteTone="oxblood" icon={<Undo2 />} />
        <Kpi label="Mentor cost" value={formatPaise(mentorCost)} note={gross ? `${((mentorCost / gross) * 100).toFixed(0)}% of gross` : ""} icon={<Wallet />} accent="indigo" />
        <Kpi label="Net" value={formatPaise(net)} note="After fees, refunds, payouts" noteTone="green" icon={<PiggyBank />} accent="teal" />
      </KpiGrid>

      {gross > 0 && (
        <Panel title="Where each ₹100 goes" flush={false}>
          {(() => {
            const parts = [
              { label: "You keep", v: Math.max(0, net), cls: "bg-teal" },
              { label: "Mentors", v: mentorCost, cls: "bg-indigo" },
              { label: "Gateway", v: fees, cls: "bg-ink-faint" },
              { label: "Refunds", v: refunds, cls: "bg-oxblood" },
            ];
            return (
              <>
                <div className="flex h-4 overflow-hidden rounded-full bg-line-soft" role="img" aria-label={parts.map((p) => `${p.label} ${((p.v / gross) * 100).toFixed(0)} percent`).join(", ")}>
                  {parts.map((p) => <div key={p.label} className={p.cls} style={{ width: `${Math.min(100, (p.v / gross) * 100)}%` }} />)}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]">
                  {parts.map((p) => <li key={p.label} className="flex items-center gap-2 text-ink-2"><span aria-hidden className={`size-2.5 rounded-full ${p.cls}`} />{p.label} <span className="tnum font-semibold text-ink">₹{((p.v / gross) * 100).toFixed(0)}</span></li>)}
                </ul>
              </>
            );
          })()}
        </Panel>
      )}

      <Panel title="Revenue by product" flush={false}>
        <div className="flex flex-col gap-3">
          {byProduct.map((p) => (
            <div key={p.productId}>
              <div className="flex justify-between gap-2 text-[12.5px]"><span className="text-ink-2">{products[p.productId] ?? "—"}</span><span className="tnum font-semibold text-ink">{formatPaise(p._sum.amountPaise ?? 0)}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-soft"><div className="h-full rounded-full bg-gradient-to-r from-oxblood to-oxblood-hover" style={{ width: `${((p._sum.amountPaise ?? 0) / topAmount) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Recent payments" action={<ExportLinks types={[{ type: "payments", label: "Export payments (CSV)" }]} />}>
        {payments.length === 0 ? <Empty art="chart">No payments yet.</Empty> : payments.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] transition-colors last:border-b-0 hover:bg-surface">
            <Avatar name={o.guestName} size={32} />
            <span className="min-w-0 flex-1 text-ink-body"><span className="font-medium text-ink">{o.guestName}</span> · {o.product.name}</span>
            <span className="text-ink-faint">{fmtDate(o.createdAt)}</span>
            <span className="tnum font-semibold text-ink">{formatPaise(o.amountPaise)}</span>
            {o.status === "PAID" && <RefundButton orderId={o.id} />}
            {o.status !== "PAID" && <StatusPill tone={o.status === "REFUNDED" ? "oxblood" : "amber"}>{o.status.replace("_", " ").toLowerCase()}</StatusPill>}
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
