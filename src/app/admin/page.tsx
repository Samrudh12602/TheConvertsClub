import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Meter, Panel, Section, StatusPill } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtTime } from "@/lib/format";
import { SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { overdueFeedback } from "@/server/reminders";
import { requireAdmin } from "@/server/session";
import { nowMs } from "@/lib/datetime";

export const dynamic = "force-dynamic";
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function AdminDashboard() {
  await requireAdmin();
  const now = new Date(nowMs());
  const { istDayRange, istDateString } = await import("@/server/scheduling");
  const today = istDateString(now);
  const { from: todayFrom, to: todayTo } = istDayRange(today);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [activeStudents, sessionsThisWeek, unassignedCount, overdue, revenueAgg, payable, unassignedList, applicationsPending, watSopUnassigned, payoutReady, todaySessions, weekOrders] = await Promise.all([
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE", isDemo: false } }),
    db.session.count({ where: { startsAt: { gte: weekAgo, lte: new Date(weekAgo.getTime() + 14 * 86_400_000) }, status: { in: ["CONFIRMED", "REQUESTED", "COMPLETED"] } } }),
    db.session.count({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null } }),
    overdueFeedback(now),
    db.order.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true } }),
    db.payoutAccrual.aggregate({ where: { status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true }, _count: true }),
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, take: 5, include: { student: { select: { name: true } } } }),
    db.mentorApplication.count({ where: { stage: { in: ["NEW", "SCREENING", "TRIAL_MOCK"] } } }),
    db.review.count({ where: { status: "SUBMITTED" } }),
    db.payoutAccrual.count({ where: { status: "APPROVED" } }),
    db.session.findMany({ where: { startsAt: { gte: todayFrom, lt: todayTo } }, orderBy: { startsAt: "asc" }, include: { student: { select: { name: true } }, mentor: { include: { user: { select: { name: true } } } } } }),
    db.order.aggregate({ where: { status: "PAID", createdAt: { gte: weekAgo } }, _sum: { amountPaise: true } }),
  ]);

  const [piBooked, piTotal, gdSeatsFilled, gdSeatsTotal] = await Promise.all([
    db.slot.count({ where: { status: "BOOKED", startsAt: { gte: now, lt: new Date(now.getTime() + 7 * 86_400_000) } } }),
    db.slot.count({ where: { startsAt: { gte: now, lt: new Date(now.getTime() + 7 * 86_400_000) } } }),
    db.gdParticipant.count({ where: { status: "JOINED", batch: { startsAt: { gte: now, lt: new Date(now.getTime() + 7 * 86_400_000) } } } }),
    db.gdBatch.aggregate({ where: { startsAt: { gte: now, lt: new Date(now.getTime() + 7 * 86_400_000) } }, _sum: { capacity: true } }),
  ]);

  const queue: { tone: "oxblood" | "amber" | "indigo" | "green"; text: string; meta: string; cta: string; href: string }[] = [];
  if (unassignedCount > 0) queue.push({ tone: "oxblood", text: `${unassignedCount} session${unassignedCount === 1 ? "" : "s"} unassigned`, meta: unassignedList[0] ? `Next: ${sessionTitle(unassignedList[0].type, unassignedList[0].focus)} for ${nm(unassignedList[0].student?.name)}` : "", cta: "Assign", href: "/admin/scheduler" });
  if (overdue.length > 0) queue.push({ tone: "amber", text: `${overdue.length} feedback item${overdue.length === 1 ? "" : "s"} overdue`, meta: overdue[0]?.mentor ? `Oldest: ${nm(overdue[0].mentor.user.name)}` : "", cta: "View", href: "/admin/sessions?filter=overdue" });
  if (watSopUnassigned > 0) queue.push({ tone: "amber", text: `${watSopUnassigned} WAT/SOP submission${watSopUnassigned === 1 ? "" : "s"} unallocated`, meta: "Waiting for a mentor", cta: "Allocate", href: "/admin/reviews" });
  if (applicationsPending > 0) queue.push({ tone: "indigo", text: `${applicationsPending} mentor application${applicationsPending === 1 ? "" : "s"} in the pipeline`, meta: "Screening or trial mock", cta: "Review", href: "/admin/applications" });
  if (payoutReady > 0) queue.push({ tone: "green", text: "Payout run ready to create", meta: `${payoutReady} accrual${payoutReady === 1 ? "" : "s"} approved`, cta: "Open", href: "/admin/payouts" });

  return (
    <PortalPage>
      <KpiGrid min={168}>
        <Kpi label="Active students" value={activeStudents} />
        <Kpi label="Sessions, 2wk window" value={sessionsThisWeek} note={`${unassignedCount} unassigned`} noteTone={unassignedCount ? "oxblood" : "muted"} />
        <Kpi label="Feedback overdue" value={overdue.length} noteTone={overdue.length ? "oxblood" : "muted"} />
        <Kpi label="Revenue, season" value={formatPaise(revenueAgg._sum.amountPaise ?? 0)} note={`+${formatPaise(weekOrders._sum.amountPaise ?? 0)} this week`} noteTone="green" />
        <Kpi label="Payable to mentors" value={formatPaise(payable._sum.amountPaise ?? 0)} note={`${payable._count} accruals pending`} noteTone="amber" />
      </KpiGrid>

      <Section cols={300}>
        <Panel title={<span>Needs you now <span className="tnum ml-1.5 font-normal text-ink-faint">{queue.length} item{queue.length === 1 ? "" : "s"}</span></span>}>
          {queue.length === 0 ? <Empty>Nothing needs attention right now.</Empty> : queue.map((q, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line-soft px-3.5 py-3 last:border-b-0">
              <StatusPill tone={q.tone}> </StatusPill>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium leading-[1.3] text-ink-body">{q.text}</p>{q.meta && <p className="mt-0.5 text-[11.5px] leading-[1.35] text-ink-faint">{q.meta}</p>}</div>
              <Link href={q.href} className="inline-flex min-h-9 flex-none items-center rounded-lg border border-ink bg-ink px-3 text-xs font-semibold leading-none text-white no-underline hover:bg-ink-body hover:text-white hover:no-underline">{q.cta}</Link>
            </div>
          ))}
        </Panel>
        <Panel title="Capacity this week" flush={false}>
          <div className="flex flex-col gap-3.5">
            <Meter label="Mock PI slots" note={`${piBooked} / ${piTotal || 0} booked`} pct={piTotal ? (piBooked / piTotal) * 100 : 0} tone="oxblood" />
            <Meter label="GD batch seats" note={`${gdSeatsFilled} / ${gdSeatsTotal._sum.capacity || 0} filled`} pct={gdSeatsTotal._sum.capacity ? (gdSeatsFilled / gdSeatsTotal._sum.capacity) * 100 : 0} tone="indigo" />
          </div>
        </Panel>
      </Section>

      <Panel title="Today's sessions" action={<Link href="/admin/scheduler" className="text-xs font-semibold">Open scheduler</Link>} flush={false}>
        {todaySessions.length === 0 ? <Empty>Nothing scheduled today.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[12.5px]">
              <thead><tr className="border-b border-line">{["Time", "Student", "Type · focus", "Mentor", "Status"].map((h) => <th key={h} className="type-label px-2.5 py-2 text-ink-faint">{h}</th>)}</tr></thead>
              <tbody>
                {todaySessions.map((s) => {
                  const st = !s.mentorId ? { label: "Needs mentor", tone: "oxblood" as const } : SESSION_STATUS[s.status];
                  return (
                    <tr key={s.id} className="border-b border-line-soft last:border-b-0">
                      <td className="tnum px-2.5 py-2.5 text-ink-2">{s.startsAt ? fmtTime(s.startsAt) : "—"}</td>
                      <td className="px-2.5 py-2.5 text-ink-body">{nm(s.student?.name) || (s.type === "GD_BATCH" ? "GD batch" : "—")}</td>
                      <td className="px-2.5 py-2.5 text-ink-muted">{sessionTitle(s.type, s.focus)}</td>
                      <td className="px-2.5 py-2.5 text-ink-muted">{s.mentor ? nm(s.mentor.user.name) : "— unassigned"}</td>
                      <td className="px-2.5 py-2.5"><StatusPill tone={st.tone}>{st.label}</StatusPill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PortalPage>
  );
}
