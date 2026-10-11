import Link from "next/link";
import { BadgePercent, CalendarClock, FileCheck2, IndianRupee, Mail, Percent, ShoppingBag, Target, Users } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel, Section } from "@/components/portal/ui";
import { Donut } from "@/components/admin/viz/donut";
import { Funnel } from "@/components/admin/viz/funnel";
import { HBars } from "@/components/admin/viz/hbars";
import { Heatmap } from "@/components/admin/viz/heatmap";
import { RANGES, RangeTabs } from "@/components/admin/viz/range-tabs";
import { ScoreHistogram } from "@/components/admin/viz/score-histogram";
import { StatTile } from "@/components/admin/viz/stat-tile";
import { TrendChart } from "@/components/admin/viz/trend-chart";
import { compactInr, histogram } from "@/lib/metrics";
import { loadAudience, loadFunnel, loadMockBoard, loadMoney, loadTrends } from "@/server/admin-metrics";
import { adminDb } from "@/server/demo";
import { requireAdmin } from "@/server/session";

type Db = Awaited<ReturnType<typeof adminDb>>;

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

/** Everything here is computed from your real orders, students, mock attempts and emails. Page visitors need a page-analytics tool, which is a separate thing. */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin();
  const db = await adminDb();
  const sp = await searchParams;
  const range = RANGES.find((r) => r.key === sp.range) ?? RANGES[1];
  const days = range.days;
  const now = new Date();

  const [t, funnel, board, audience, money, outcomes] = await Promise.all([loadTrends(db, days, now), loadFunnel(db), loadMockBoard(db), loadAudience(db), loadMoney(db, now), loadOutcomes(db)]);
  const aov = t.orders.value ? Math.round(t.revenue.value / t.orders.value) : 0;
  const scoreMax = Math.max(60, Math.ceil(Math.max(0, ...t.scores) / 10) * 10);
  const emailSplit = t.signups.value - t.googleSignups.value;
  const refundRate = funnel.buyers && money.refundCount ? Math.round((money.refundCount / Math.max(1, t.orders.value || funnel.buyers)) * 100) : 0;

  const metrics = [
    { key: "revenue", label: "Revenue", tone: "oxblood" as const, kind: "inr" as const, current: t.revenue.series, previous: t.revenue.prevSeries },
    { key: "orders", label: "Orders", tone: "gold" as const, kind: "int" as const, current: t.orders.series, previous: t.orders.prevSeries },
    { key: "signups", label: "New students", tone: "teal" as const, kind: "int" as const, current: t.signups.series, previous: t.signups.prevSeries },
    { key: "attempts", label: "Mock attempts", tone: "indigo" as const, kind: "int" as const, current: t.attempts.series, previous: t.attempts.prevSeries },
    { key: "finished", label: "Finished mocks", tone: "plum" as const, kind: "int" as const, current: t.submitted.series, previous: t.submitted.prevSeries },
    { key: "emails", label: "Emails sent", tone: "green" as const, kind: "int" as const, current: t.emailsSent.series, previous: t.emailsSent.prevSeries },
  ];

  return (
    <PortalPage width="max-w-[1240px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="type-eyebrow text-oxblood">Analytics</p>
          <h1 className="font-display text-[26px] font-bold leading-tight text-ink">Last {days} days, compared with the {days} before</h1>
          <p className="mt-1 max-w-[62ch] text-[12.5px] leading-normal text-ink-muted">Real orders, students, mock attempts and emails. Every number links back to rows you can open.</p>
        </div>
        <RangeTabs current={range.key} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile tone="oxblood" label="Revenue" value={compactInr(t.revenue.value)} pct={t.revenue.pct} sub={`Before: ${compactInr(t.revenue.prev)}`} icon={<IndianRupee />} series={t.revenue.series} />
        <StatTile tone="gold" label="Orders" value={t.orders.value} pct={t.orders.pct} sub={aov ? `${compactInr(aov)} average order` : "No orders yet"} icon={<ShoppingBag />} series={t.orders.series} />
        <StatTile tone="teal" label="New students" value={t.signups.value} pct={t.signups.pct} sub={`${t.googleSignups.value} Google · ${Math.max(0, emailSplit)} email`} icon={<Users />} series={t.signups.series} />
        <StatTile tone="indigo" label="Mock attempts" value={t.attempts.value} pct={t.attempts.pct} sub={t.completion !== null ? `${t.completion}% finish what they start` : "None yet"} icon={<FileCheck2 />} series={t.attempts.series} />
        <StatTile tone="plum" label="Average score" value={t.avgScore !== null ? t.avgScore.toFixed(1) : "—"} sub={t.scores.length ? `from ${t.scores.length} finished mock${t.scores.length === 1 ? "" : "s"}` : "Appears after the first finished mock"} icon={<Target />} />
        <StatTile tone="green" label="Discounts given" value={compactInr(t.discountsPaise)} sub={`${t.earlyBirdOrders} early-bird order${t.earlyBirdOrders === 1 ? "" : "s"}`} icon={<BadgePercent />} />
      </div>

      <Panel title="Trends" flush={false}>
        <TrendChart labels={t.labels} metrics={metrics} caption={`last ${days} days, dashed line is the ${days} days before`} />
      </Panel>

      <Section cols={380}>
        <Panel title="Revenue by product" flush={false}>
          <Donut slices={t.salesMix.map((s) => ({ label: s.name, value: s.paise, text: compactInr(s.paise) }))} centerValue={compactInr(t.revenue.value)} centerLabel={`last ${days} days`} emptyText="No sales yet" />
          {t.salesMix.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse text-left text-[12.5px]">
                <thead><tr className="border-b border-line">{["Product", "Orders", "Early-bird", "Revenue"].map((h, i) => <th key={h} className={`type-label px-2 py-2 text-ink-faint ${i ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
                <tbody>{t.salesMix.map((s) => <tr key={s.name} className="border-b border-line-soft last:border-b-0"><td className="px-2 py-2 text-ink-2">{s.name}</td><td className="tnum px-2 py-2 text-right text-ink-muted">{s.orders}</td><td className="tnum px-2 py-2 text-right text-ink-muted">{s.early || "—"}</td><td className="tnum px-2 py-2 text-right font-semibold text-ink">{compactInr(s.paise)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Where students drop off" flush={false}>
          <Funnel steps={[
            { label: "Signed up", value: funnel.signedUp },
            { label: "Added profile details", value: funnel.profiled },
            { label: "Bought a plan", value: funnel.buyers },
            { label: "Started a mock", value: funnel.started },
            { label: "Finished a mock", value: funnel.finished },
            { label: "Bought again", value: funnel.repeat },
          ]} />
          <p className="mt-3 text-[11.5px] leading-normal text-ink-faint">All time. A step that is bigger than the one before it means students reached it another way (for example a free test mock).</p>
        </Panel>
      </Section>

      <Section cols={380}>
        <Panel title="How new students sign up" flush={false}>
          <Donut slices={[{ label: "Google", value: t.googleSignups.value }, { label: "Email and password", value: Math.max(0, emailSplit) }].filter((s) => s.value > 0)} centerValue={String(t.signups.value)} centerLabel={`new in ${days} days`} emptyText="No sign-ups yet" />
          <p className="mt-4 text-[12px] leading-normal text-ink-faint">Google sign-up is the quickest way in. If it is low, check that Google sign-in is on in the launch checklist.</p>
        </Panel>
        <Panel title="Coupons and offers" flush={false} action={<Link href="/admin/products" className="text-xs font-semibold">Manage</Link>}>
          {t.coupons.length === 0 ? <Empty art="chart">No coupon has been used in this period.</Empty> : (
            <HBars items={t.coupons.map((c) => ({ label: c.code, value: c.uses, text: `${c.uses} use${c.uses === 1 ? "" : "s"}`, sub: `${compactInr(c.discountPaise)} off` }))} />
          )}
        </Panel>
      </Section>

      <Section cols={380}>
        <Panel title="How students score" flush={false}>
          <ScoreHistogram bins={histogram(t.scores, 10, scoreMax)} max={scoreMax} avg={t.avgScore} />
        </Panel>
        <Panel title="When students take mocks" flush={false}>
          <Heatmap grid={t.heat} />
        </Panel>
      </Section>

      <Panel title="Each mock" flush={false} action={<Link href="/admin/mocks" className="text-xs font-semibold">Manage</Link>}>
        {board.length === 0 ? <Empty art="chart">No published mocks yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[12.5px]">
              <thead><tr className="border-b border-line">{["Mock", "Started", "Finished", "Completion", "Average score"].map((h, i) => <th key={h} className={`type-label px-2 py-2 text-ink-faint ${i ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
              <tbody>
                {board.map((m) => (
                  <tr key={m.id} className="border-b border-line-soft last:border-b-0">
                    <td className="px-2 py-2.5 text-ink-2">{m.title}{m.isTest && <span className="ml-1.5 rounded bg-gold-tint px-1.5 py-0.5 text-[10px] font-semibold text-gold-deep">TEST</span>}</td>
                    <td className="tnum px-2 py-2.5 text-right text-ink-muted">{m.started}</td>
                    <td className="tnum px-2 py-2.5 text-right text-ink-muted">{m.finished}</td>
                    <td className="px-2 py-2.5"><div className="ml-auto flex w-28 items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft"><div className="h-full rounded-full bg-gradient-to-r from-indigo to-[#6a68c8]" style={{ width: `${m.started ? (m.finished / m.started) * 100 : 0}%` }} /></div><span className="tnum w-8 text-right text-ink-faint">{m.started ? Math.round((m.finished / m.started) * 100) : 0}%</span></div></td>
                    <td className="tnum px-2 py-2.5 text-right font-semibold text-ink">{m.avg !== null ? m.avg.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div>
        <p className="mb-2 mt-1 text-[13px] font-bold text-ink">Who your students are <span className="ml-1.5 text-[12px] font-normal text-ink-faint">from the details they chose to add ({audience.withDetails} of {audience.total} students)</span></p>
        <Section cols={280}>
          <Panel title="Top states" flush={false}><HBars items={audience.states.map((s) => ({ label: s.label, value: s.n, text: String(s.n) }))} empty="Fills in as students add their state." /></Panel>
          <Panel title="Exams they are taking" flush={false}><HBars items={audience.exams.map((s) => ({ label: s.label, value: s.n, text: String(s.n) }))} empty="Fills in as students pick their exams." /></Panel>
          <Panel title="Work experience" flush={false}><Donut slices={audience.workEx.map((s) => ({ label: s.label, value: s.n }))} centerValue={String(audience.workEx.reduce((n, s) => n + s.n, 0))} centerLabel="students" size={140} emptyText="No data yet" /></Panel>
          <Panel title="Graduation year" flush={false}><HBars items={audience.gradYears.map((s) => ({ label: s.label, value: s.n, text: String(s.n) }))} tone="teal" empty="Fills in as students add it." /></Panel>
        </Section>
      </div>

      <Section cols={380}>
        <Panel title="Emails by type" flush={false} action={<Link href="/admin/mailbox?tab=auto" className="text-xs font-semibold"><Mail className="inline size-3.5" aria-hidden /> Log</Link>}>
          <HBars items={t.emailsByTemplate.slice(0, 8).map((e) => ({ label: e.template.replace(/_/g, " "), value: e.n, text: String(e.n) }))} tone="plum" empty="No automatic emails in this period." />
          <p className="mt-3 text-[12px] text-ink-faint">{t.emailsSent.value} sent · {t.emailsFailed.value} failed in this period.</p>
        </Panel>
        <Panel title="Money" flush={false} action={<Link href="/admin/finance" className="text-xs font-semibold">Finance</Link>}>
          <dl className="grid grid-cols-2 gap-2.5 text-[12.5px]">
            {[
              { k: "Revenue, all time", v: compactInr(money.gross), cls: "bg-oxblood-tint text-oxblood" },
              { k: "Owed to mentors", v: compactInr(money.owed), cls: "bg-indigo-tint text-indigo" },
              { k: "Refunded", v: `${compactInr(money.refunded)}${money.refundCount ? ` (${money.refundCount})` : ""}`, cls: "bg-gold-tint text-gold-deep" },
              { k: "Kept", v: compactInr(money.kept), cls: "bg-teal-tint text-teal" },
            ].map((x) => <div key={x.k} className={`rounded-xl p-3 ${x.cls}`}><dt className="text-[11px] font-semibold uppercase tracking-[0.06em] opacity-80">{x.k}</dt><dd className="tnum mt-1 font-display text-[20px] font-bold leading-none">{x.v}</dd></div>)}
          </dl>
          <p className="mt-3 flex items-center gap-2 text-[12px] text-ink-faint"><Percent className="size-3.5" aria-hidden /> Refund rate {refundRate}% · gateway cost {compactInr(money.gateway)} (Razorpay&apos;s fee is waived until 13 Dec 2026)</p>
        </Panel>
      </Section>

      <details className="group rounded-2xl border border-line bg-card shadow-card">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5"><span className="flex size-8 items-center justify-center rounded-xl bg-indigo-tint text-indigo"><CalendarClock className="size-4" aria-hidden /></span><span className="text-[13.5px] font-bold text-ink">Interview-prep outcomes</span><span className="text-[11.5px] text-ink-faint">sessions, ratings and feedback speed</span></summary>
        <div className="grid gap-2.5 border-t border-line-soft p-4 sm:grid-cols-2">
          {outcomes.map((o) => <div key={o.label} className="flex justify-between rounded-lg bg-surface px-3 py-2.5 text-[12.5px]"><span className="text-ink-2">{o.label}</span><span className="tnum font-semibold text-ink">{o.value}</span></div>)}
        </div>
      </details>
    </PortalPage>
  );
}

async function loadOutcomes(db: Db) {
  const [avgConverted, avgOther, ratingAvg, feedbackTotal, feedbackOnTime] = await Promise.all([mockAvg(db, true), mockAvg(db, false), db.sessionRating.aggregate({ _avg: { rating: true } }), db.feedback.count(), onTimeFeedback(db)]);
  return [
    { label: "Avg sessions, converted students", value: avgConverted.toFixed(1) },
    { label: "Avg sessions, others", value: avgOther.toFixed(1) },
    { label: "Session rating, all mentors", value: ratingAvg._avg.rating ? `${ratingAvg._avg.rating.toFixed(1)} / 5` : "—" },
    { label: "Feedback within SLA", value: feedbackTotal ? `${Math.round((feedbackOnTime / feedbackTotal) * 100)}%` : "—" },
  ];
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
