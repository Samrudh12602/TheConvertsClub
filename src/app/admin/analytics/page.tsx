import { PortalPage } from "@/components/portal/portal-page";
import { Notice } from "@/components/ui/notice";
import { Panel, Section } from "@/components/portal/ui";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

/**
 * Everything here is computed from real rows. "Site visitors" and "packages viewed" aren't shown:
 * they need a page-analytics tool (e.g. Vercel Analytics), which isn't wired up — see docs/DECISIONS.md.
 */
export default async function AnalyticsPage() {
  const [checkoutStarted, paid, onboarded, avgConverted, avgOther, ratingAvg, feedbackTotal, feedbackOnTime, repeatBuyers, totalBuyers] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } } }),
    db.studentProfile.count({ where: { onboardedAt: { not: null } } }),
    mockAvg(true),
    mockAvg(false),
    db.sessionRating.aggregate({ _avg: { rating: true } }),
    db.feedback.count(),
    onTimeFeedback(),
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

async function mockAvg(converted: boolean) {
  const ids = (await db.callTracker.findMany({ where: { outcome: converted ? "CONVERTED" : { not: "CONVERTED" } }, select: { studentId: true }, distinct: ["studentId"] })).map((c) => c.studentId);
  if (!ids.length) return 0;
  const counts = await db.session.groupBy({ by: ["studentId"], where: { studentId: { in: ids }, status: "COMPLETED" }, _count: true });
  if (!counts.length) return 0;
  return counts.reduce((n, c) => n + c._count, 0) / ids.length;
}

async function onTimeFeedback() {
  const rows = await db.feedback.findMany({ select: { submittedAt: true, session: { select: { startsAt: true } } } });
  const settings = await (await import("@/lib/settings-db")).getSettings();
  return rows.filter((r) => !r.session?.startsAt || r.submittedAt.getTime() - r.session.startsAt.getTime() <= settings.feedbackDueHours * 3_600_000).length;
}
