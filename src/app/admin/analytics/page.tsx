import { PortalPage } from "@/components/portal/portal-page";
import { Notice } from "@/components/ui/notice";
import { IndianRupee, Percent, ShoppingBag, Sparkles } from "lucide-react";
import { Kpi, KpiGrid, Panel, Section } from "@/components/portal/ui";
import { BarChart } from "@/components/ui/charts";
import { formatPaise } from "@/lib/money";
import { adminDb } from "@/server/demo";

type Db = Awaited<ReturnType<typeof adminDb>>;

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

/**
 * Everything here is computed from real rows. "Site visitors" and "packages viewed" aren't shown:
 * they need a page-analytics tool (e.g. Vercel Analytics), which isn't wired up — see docs/DECISIONS.md.
 */
export default async function AnalyticsPage() {
  const db = await adminDb();
  const rev = await revenueReport(db);
  const [checkoutStarted, paid, onboarded, avgConverted, avgOther, ratingAvg, feedbackTotal, feedbackOnTime, repeatBuyers, totalBuyers] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } } }),
    db.studentProfile.count({ where: { onboardedAt: { not: null } } }),
    mockAvg(db, true),
    mockAvg(db, false),
    db.sessionRating.aggregate({ _avg: { rating: true } }),
    db.feedback.count(),
    onTimeFeedback(db),
    db.order.groupBy({ by: ["userId"], where: { status: "PAID", userId: { not: null } }, having: { userId: { _count: { gt: 1 } } } }),
    db.order.groupBy({ by: ["userId"], where: { status: "PAID", userId: { not: null } } }),
  ]);
  const funnel = [
    { label: "Checkout started", value: checkoutStarted },
    { label: "Paid", value: paid },
    { label: "Onboarded", value: onboarded },
  ];
  const top = funnel[0]?.value || 1;
  const outcomes = [
    { label: "Avg mocks, converted students", value: avgConverted.toFixed(1) },
    { label: "Avg mocks, others", value: avgOther.toFixed(1) },
    { label: "Session rating, all mentors", value: ratingAvg._avg.rating ? `${ratingAvg._avg.rating.toFixed(1)} / 5` : "—" },
    { label: "Feedback within SLA", value: feedbackTotal ? `${Math.round((feedbackOnTime / feedbackTotal) * 100)}%` : "—" },
    { label: "Repeat purchase rate", value: totalBuyers.length ? `${Math.round((repeatBuyers.length / totalBuyers.length) * 100)}%` : "—" },
  ];

  return (
    <PortalPage width="max-w-[1000px]">
      <Notice>&quot;Site visitors&quot; and &quot;packages viewed&quot; need a page-analytics tool (not wired up yet). Everything below comes from real orders and sessions.</Notice>
      <KpiGrid>
        <Kpi label="Revenue, 8 weeks" value={formatPaise(rev.total)} note={`${rev.orders} paid orders`} icon={<IndianRupee />} accent="teal" />
        <Kpi label="Best week" value={formatPaise(rev.best)} note="Highest of the last 8" noteTone="green" icon={<ShoppingBag />} accent="gold" />
        <Kpi label="Trial buyers" value={rev.trialBuyers} note="Paid ₹10 or ₹50 trials" icon={<Sparkles />} accent="indigo" />
        <Kpi label="Trial to paid" value={rev.trialBuyers ? `${Math.round((rev.trialConverted / rev.trialBuyers) * 100)}%` : "\u2014"} note={`${rev.trialConverted} of ${rev.trialBuyers} bought a full plan`} noteTone={rev.trialConverted ? "green" : "muted"} icon={<Percent />} accent="oxblood" />
      </KpiGrid>
      <Panel title="Revenue by week" flush={false}>
        <BarChart data={rev.weeks} tone="teal" />
      </Panel>
      <Panel title="Revenue by product" flush={false}>
        {rev.byProduct.length === 0 ? <p className="text-[12.5px] text-ink-faint">No paid orders yet.</p> : (
          <div className="flex flex-col gap-3">
            {rev.byProduct.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between gap-3 text-[12.5px]"><span className="min-w-0 truncate text-ink-2">{p.name} <span className="text-ink-faint">· {p.orders} order{p.orders === 1 ? "" : "s"}</span></span><span className="tnum flex-none font-semibold text-ink">{formatPaise(p.paise)}</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-soft"><div className="h-full rounded-full bg-gradient-to-r from-oxblood to-oxblood-hover" style={{ width: `${(p.paise / (rev.byProduct[0]?.paise || 1)) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Section cols={280}>
        <Panel title="Funnel" flush={false}>
          <div className="flex flex-col gap-3">{funnel.map((f) => (
            <div key={f.label}><div className="flex justify-between text-[12.5px]"><span className="text-ink-2">{f.label}</span><span className="tnum font-semibold text-ink">{f.value}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded bg-line-soft"><div className="h-full bg-oxblood" style={{ width: `${(f.value / top) * 100}%` }} /></div></div>
          ))}</div>
        </Panel>
        <Panel title="Outcomes" flush={false}>
          <div className="flex flex-col gap-2.5">{outcomes.map((o) => <div key={o.label} className="flex justify-between text-[12.5px]"><span className="text-ink-2">{o.label}</span><span className="tnum font-semibold text-ink">{o.value}</span></div>)}</div>
        </Panel>
      </Section>
    </PortalPage>
  );
}

async function mockAvg(db: Db, converted: boolean) {
  const ids = (await db.callTracker.findMany({ where: { outcome: converted ? "CONVERTED" : { not: "CONVERTED" } }, select: { studentId: true }, distinct: ["studentId"] })).map((c) => c.studentId);
  if (!ids.length) return 0;
  const counts = await db.session.groupBy({ by: ["studentId"], where: { studentId: { in: ids }, status: "COMPLETED" }, _count: true });
  if (!counts.length) return 0;
  return counts.reduce((n, c) => n + c._count, 0) / ids.length;
}

async function onTimeFeedback(db: Db) {
  const rows = await db.feedback.findMany({ select: { submittedAt: true, session: { select: { startsAt: true } } } });
  const settings = await (await import("@/lib/settings-db")).getSettings();
  return rows.filter((r) => !r.session?.startsAt || r.submittedAt.getTime() - r.session.startsAt.getTime() <= settings.feedbackDueHours * 3_600_000).length;
}

/** Paid revenue for the last eight weeks, per product, and how many trial buyers went on to buy a full plan. */
async function revenueReport(db: Db) {
  const WEEK = 7 * 86_400_000;
  const start = new Date(Date.now() - 8 * WEEK);
  const paid = await db.order.findMany({ where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] }, createdAt: { gte: start } }, select: { amountPaise: true, createdAt: true, product: { select: { name: true } } } });
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = start.getTime() + i * WEEK;
    const paise = paid.filter((o) => o.createdAt.getTime() >= from && o.createdAt.getTime() < from + WEEK).reduce((n, o) => n + o.amountPaise, 0);
    const d = new Date(from + WEEK - 1);
    return { label: new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(d), value: paise, text: `\u20b9${Math.round(paise / 100).toLocaleString("en-IN")}` };
  });
  const per = new Map<string, { paise: number; orders: number }>();
  for (const o of paid) { const a = per.get(o.product.name) ?? { paise: 0, orders: 0 }; a.paise += o.amountPaise; a.orders++; per.set(o.product.name, a); }
  const trials = await db.order.findMany({ where: { status: "PAID", product: { slug: { startsWith: "trial-" } } }, select: { guestEmail: true } });
  const emails = [...new Set(trials.map((t) => t.guestEmail.toLowerCase()))];
  let trialConverted = 0;
  for (const e of emails) if (await db.order.count({ where: { status: "PAID", guestEmail: { equals: e, mode: "insensitive" }, product: { slug: { not: { startsWith: "trial-" } } } } })) trialConverted++;
  return {
    weeks, total: paid.reduce((n, o) => n + o.amountPaise, 0), orders: paid.length, best: Math.max(0, ...weeks.map((w) => w.value)),
    byProduct: [...per].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.paise - a.paise),
    trialBuyers: emails.length, trialConverted,
  };
}
