import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, Panel } from "@/components/portal/ui";
import { CreditBreakdown } from "@/components/portal/credit-breakdown";
import { PortalBuy } from "@/components/student/portal-buy";
import { getProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { priceView } from "@/lib/pricing";
import { getReferral, referralPrice } from "@/server/referral";
import { Users } from "lucide-react";
import { PANEL_UPGRADE_MAX, PANEL_UPGRADE_SLUG, panelUpgradeStatus } from "@/server/panel-upgrade";
import { paymentsConfigured } from "@/server/razorpay";
import { getCreditSummary, getEnrollmentBreakdown } from "@/server/credits";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await requireStudent();
  const sp = await searchParams;
  const [orders, products, enrollments, creditSummary] = await Promise.all([
    db.order.findMany({ where: { userId: user.id, status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true } }, payments: { select: { razorpayPaymentId: true } } } }),
    getProducts(),
    getEnrollmentBreakdown(db, user.id),
    getCreditSummary(db, user.id),
  ]);
  const enrolled = enrollments.filter((e) => e.status === "ACTIVE").length;
  const ref = await getReferral();
  const me = { name: user.name?.replace(/\s*\(demo\)/, "") ?? "", email: user.email, phone: user.phone ?? "" };
  const canPay = paymentsConfigured();
  // Top up is the enrolled-student shop, not the public a-la-carte catalog — only truly enrolled-only
  // products belong here, and only once actually enrolled. Everyone else buys singles at full price
  // from /services, same as a public visitor. Everything shows at MRP; a mentor's referral code (or
  // any other coupon) is what brings the price down, entered on the buy button below.
  const extra = enrolled > 0 ? products.filter((p) => p.kind === "SINGLE" && (p.enrolledOnly || p.withAdmin) && !p.slug.startsWith("trial-") && p.slug !== PANEL_UPGRADE_SLUG) : [];
  // Panel PI: buy it outright, or (Call Convert Plus only) swap one of your unused PIs for a Panel PI for Rs 199.
  const panel = products.find((p) => p.slug === "panel-pi");
  const upgrade = products.find((p) => p.slug === PANEL_UPGRADE_SLUG);
  const upStatus = enrolled > 0 && upgrade ? await panelUpgradeStatus(db, user.id) : null;
  const plusHolder = upStatus ? upStatus.eligible || upStatus.reason !== "This upgrade is for Call Convert Plus students." : false;

  return (
    <PortalPage width="max-w-[820px]">
      {sp.paid && <Flash tone="green">Payment received. Your credits are on the way and will appear in the sidebar in a moment.</Flash>}
      <CreditBreakdown summary={creditSummary} enrollments={enrollments} />
      {enrolled > 0 && panel && (
        <section className="overflow-hidden rounded-2xl bg-night p-5 text-white shadow-lift ring-1 ring-white/5" aria-label="Panel PI">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-white/10 text-gold"><Users className="size-5" aria-hidden /></span>
            <div className="min-w-[240px] flex-1">
              <p className="type-eyebrow text-gold">Closest to the real thing</p>
              <h2 className="mt-1.5 font-display text-[20px] font-bold leading-[1.2]">Panel PI: three interviewers, one hour</h2>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-dark-soft">You face a real panel together, then get a live debrief in the same hour. {formatPaise(priceView(panel).payablePaise)} {priceView(panel).strikePaise ? <span className="line-through opacity-70">{formatPaise(priceView(panel).strikePaise!)}</span> : null}</p>
            </div>
            <div className="flex flex-col items-start gap-2">
              {canPay && <PortalBuy slug="panel-pi" me={me} label={`Buy a Panel PI · ${formatPaise(priceView(panel).payablePaise)}`} variant="onDark" />}
            </div>
          </div>
          {plusHolder && upgrade && upStatus && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.07] p-3.5 ring-1 ring-white/10">
              <div className="min-w-[220px] flex-1">
                <p className="text-[13.5px] font-semibold">Upgrade one of your mock PIs for {formatPaise(priceView(upgrade).payablePaise)}</p>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-dark-soft">{upStatus.eligible ? `Turns an unused PI into a Panel PI. ${upStatus.left} of ${PANEL_UPGRADE_MAX} upgrades left.` : upStatus.reason}</p>
              </div>
              {upStatus.eligible && canPay && <PortalBuy slug={PANEL_UPGRADE_SLUG} me={me} label={`Upgrade · ${formatPaise(priceView(upgrade).payablePaise)}`} variant="onDark" />}
            </div>
          )}
        </section>
      )}
      {extra.length > 0 && (
        <Panel title="Top up">
          <div className="grid gap-px bg-line-soft" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
            {extra.map((p) => (
              <div key={p.slug} className="flex flex-col gap-2 bg-card p-3.5">
                <p className="text-[13px] font-semibold leading-[1.3] text-ink">{p.name}</p>
                <p className="tnum font-display text-lg font-bold text-ink">{formatPaise(priceView(p).payablePaise)}{p.earlyBird && p.earlyBird.seatsLeft > 0 && <span className="ml-2 text-[11px] font-semibold text-oxblood">Early bird · {p.earlyBird.seatsLeft} left</span>}</p>
                {referralPrice(p, ref) !== null && ref && <p className="tnum -mt-1 text-[12px] font-semibold text-green">{formatPaise(referralPrice(p, ref)!)} <span className="font-medium">with your code {ref.code}</span></p>}
                {canPay ? <PortalBuy slug={p.slug} me={me} label="Buy" variant="secondary" defaultCoupon={referralPrice(p, ref) !== null ? ref?.code : undefined} /> : null}
              </div>
            ))}
          </div>
        </Panel>
      )}
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
              <a href={`/api/receipts/${o.id}`} download className="text-xs font-semibold">PDF</a>
            </div>
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
