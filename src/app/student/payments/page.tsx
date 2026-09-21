import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, Panel } from "@/components/portal/ui";
import { PortalBuy } from "@/components/student/portal-buy";
import { getProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { priceView } from "@/lib/pricing";
import { paymentsConfigured } from "@/server/razorpay";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await requireStudent();
  const sp = await searchParams;
  const [orders, products, enrolled] = await Promise.all([
    db.order.findMany({ where: { userId: user.id, status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true } }, payments: { select: { razorpayPaymentId: true } } } }),
    getProducts(),
    db.enrollment.count({ where: { userId: user.id, status: "ACTIVE" } }),
  ]);
  const me = { name: user.name?.replace(/\s*\(demo\)/, "") ?? "", email: user.email, phone: user.phone ?? "" };
  const canPay = paymentsConfigured();
  const extra = products.filter((p) => p.kind === "SINGLE" && (!p.enrolledOnly || enrolled > 0));
  const addl = products.find((p) => p.slug === "additional-pi");
  const pi = products.find((p) => p.slug === "mock-pi");

  return (
    <PortalPage width="max-w-[820px]">
      {sp.paid && <Flash tone="green">Payment received. Your credits are on the way and will appear in the sidebar in a moment.</Flash>}
      {addl && enrolled > 0 && (
        <div className="flex flex-wrap items-center gap-3.5 rounded-[11px] border border-line bg-card p-4">
          <div className="min-w-[240px] flex-1">
            <h2 className="font-display text-sm font-bold leading-[1.3] text-ink">Need another mock?</h2>
            <p className="mt-1 text-[12.5px] leading-normal text-ink-faint">Enrolled students pay {formatPaise(priceView(addl).payablePaise)} for an additional PI{pi ? ` instead of ${formatPaise(pi.pricePaise)}` : ""}.</p>
          </div>
          {canPay ? <PortalBuy slug="additional-pi" me={me} label={`Buy additional PI · ${formatPaise(priceView(addl).payablePaise)}`} /> : <span className="text-xs text-ink-faint">Payments aren&apos;t enabled yet.</span>}
        </div>
      )}
      <Panel title="Top up">
        <div className="grid gap-px bg-line-soft" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
          {extra.filter((p) => p.slug !== "additional-pi").map((p) => (
            <div key={p.slug} className="flex flex-col gap-2 bg-card p-3.5">
              <p className="text-[13px] font-semibold leading-[1.3] text-ink">{p.name}</p>
              <p className="tnum font-display text-lg font-bold text-ink">{formatPaise(priceView(p).payablePaise)}</p>
              {canPay ? <PortalBuy slug={p.slug} me={me} label="Buy" variant="secondary" /> : null}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Payment history">
        {orders.length === 0 ? <Empty>No payments yet.</Empty> : orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-[15px] py-[13px] last:border-b-0">
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-[1.3] text-ink-body">{o.product.name}{o.status !== "PAID" ? ` · ${o.status === "REFUNDED" ? "refunded" : "part-refunded"}` : ""}</p>
              <p className="mt-[3px] text-[11.5px] leading-[1.3] text-ink-faint">{fmtDate(o.createdAt)} · {o.payments[0]?.razorpayPaymentId.slice(0, 12)}…</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="tnum text-[13px] font-semibold text-ink">{formatPaise(o.amountPaise)}</span>
              <Link href={`/student/payments/${o.id}`} className="text-xs font-semibold">Receipt</Link>
            </div>
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
