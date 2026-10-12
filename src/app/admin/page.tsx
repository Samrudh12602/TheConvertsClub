import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronDown, FileCheck2, GraduationCap, IndianRupee, Landmark, Mail, Package, PenSquare, Percent, PiggyBank, Rocket, Settings, ShoppingBag, Sparkles, Users } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Meter, Panel, Section, StatusPill } from "@/components/portal/ui";
import { ActivityFeed, ago } from "@/components/admin/viz/activity-feed";
import { Donut } from "@/components/admin/viz/donut";
import { Funnel } from "@/components/admin/viz/funnel";
import { HeroSpark } from "@/components/admin/viz/hero-spark";
import { ContactMessages } from "@/components/admin/contact-messages";
import { GuidanceRequests } from "@/components/admin/guidance-requests";
import { LaunchChecklist } from "@/components/admin/viz/launch-checklist";
import { StatTile } from "@/components/admin/viz/stat-tile";
import { TrendChart } from "@/components/admin/viz/trend-chart";
import { adminDb, demoEnabled } from "@/server/demo";
import { googleEnabled } from "@/auth";
import { emailConfigured } from "@/server/email";
import { GATEWAY_EFFECTIVE_PERCENT, gatewayFeeNotice } from "@/lib/gateway-fee";
import { fmtTime } from "@/lib/format";
import { SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { compactInr, greeting } from "@/lib/metrics";
import { loadActivity, loadEarlyBird, loadContactMessages, loadFunnel, loadGuidanceRequests, loadLaunchChecklist, loadMoney, loadMockBoard, loadTrends } from "@/server/admin-metrics";
import { overdueFeedback } from "@/server/reminders";
import { requireAdmin } from "@/server/session";
import { nowMs } from "@/lib/datetime";

export const dynamic = "force-dynamic";
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

const ACTIONS = [
  { href: "/admin/mailbox?tab=mail&compose=1", label: "Write an email", icon: PenSquare },
  { href: "/admin/mocks", label: "Mocks", icon: FileCheck2 },
  { href: "/admin/products", label: "Products & prices", icon: Package },
  { href: "/admin/finance", label: "Finance", icon: Landmark },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminDashboard() {
  const db = await adminDb();
  const admin = await requireAdmin();
  const now = new Date(nowMs());
  const DAYS = 30;
  const { istDayRange, istDateString } = await import("@/server/scheduling");
  const { from: todayFrom, to: todayTo } = istDayRange(istDateString(now));
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);

  const [t, funnel, board, activity, early, money, demoOn, calls, contacts] = await Promise.all([
    loadTrends(db, DAYS, now), loadFunnel(db), loadMockBoard(db), loadActivity(db, 12), loadEarlyBird(), loadMoney(db, now), demoEnabled(), loadGuidanceRequests(db), loadContactMessages(db),
  ]);
  const checklist = await loadLaunchChecklist(db, { googleOn: googleEnabled(), emailOn: emailConfigured(), demoOn });
  const fee = gatewayFeeNotice(now);

  // Interview-prep work (GD/PI sessions, feedback, applications): kept, but tucked below the business view while that product is "coming soon".
  const [sessionsWindow, unassignedCount, overdue, unassignedList, applicationsPending, watSopUnassigned, payoutReady, todaySessions, piBooked, piTotal, gdSeatsFilled, gdSeatsTotal] = await Promise.all([
    db.session.count({ where: { startsAt: { gte: weekAgo, lte: new Date(weekAgo.getTime() + 14 * 86_400_000) }, status: { in: ["CONFIRMED", "REQUESTED", "COMPLETED"] } } }),
    db.session.count({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null } }),
    overdueFeedback(now, db),
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, take: 5, include: { student: { select: { name: true } } } }),
    db.mentorApplication.count({ where: { stage: { in: ["NEW", "SCREENING", "TRIAL_MOCK"] } } }),
    db.review.count({ where: { status: "SUBMITTED" } }),
    db.payoutAccrual.count({ where: { status: "APPROVED" } }),
    db.session.findMany({ where: { startsAt: { gte: todayFrom, lt: todayTo } }, orderBy: { startsAt: "asc" }, include: { student: { select: { name: true } }, mentor: { include: { user: { select: { name: true } } } } } }),
    db.slot.count({ where: { status: "BOOKED", startsAt: { gte: now, lt: weekAhead } } }),
    db.slot.count({ where: { startsAt: { gte: now, lt: weekAhead } } }),
    db.gdParticipant.count({ where: { status: "JOINED", batch: { startsAt: { gte: now, lt: weekAhead } } } }),
    db.gdBatch.aggregate({ where: { startsAt: { gte: now, lt: weekAhead } }, _sum: { capacity: true } }),
  ]);

  const queue: { tone: "oxblood" | "amber" | "indigo" | "green"; text: string; meta: string; cta: string; href: string }[] = [];
  if (unassignedCount > 0) queue.push({ tone: "oxblood", text: `${unassignedCount} session${unassignedCount === 1 ? "" : "s"} unassigned`, meta: unassignedList[0] ? `Next: ${sessionTitle(unassignedList[0].type, unassignedList[0].focus)} for ${nm(unassignedList[0].student?.name)}` : "", cta: "Assign", href: "/admin/scheduler" });
  if (overdue.length > 0) queue.push({ tone: "amber", text: `${overdue.length} feedback item${overdue.length === 1 ? "" : "s"} overdue`, meta: overdue[0]?.mentor ? `Oldest: ${nm(overdue[0].mentor.user.name)}` : "", cta: "View", href: "/admin/sessions?filter=overdue" });
  if (watSopUnassigned > 0) queue.push({ tone: "amber", text: `${watSopUnassigned} WAT/SOP submission${watSopUnassigned === 1 ? "" : "s"} unallocated`, meta: "Waiting for a mentor", cta: "Allocate", href: "/admin/reviews" });
  if (applicationsPending > 0) queue.push({ tone: "indigo", text: `${applicationsPending} mentor application${applicationsPending === 1 ? "" : "s"} in the pipeline`, meta: "Screening or trial mock", cta: "Review", href: "/admin/applications" });
  if (payoutReady > 0) queue.push({ tone: "green", text: "Payout run ready to create", meta: `${payoutReady} accrual${payoutReady === 1 ? "" : "s"} approved`, cta: "Open", href: "/admin/payouts" });

  const month = t.revenue.value;
  const aov = t.orders.value ? Math.round(t.revenue.value / t.orders.value) : 0;
  const conv = funnel.signedUp ? Math.round((funnel.buyers / funnel.signedUp) * 100) : 0;
  const trendMetrics = [
    { key: "revenue", label: "Revenue", tone: "oxblood" as const, kind: "inr" as const, current: t.revenue.series, previous: t.revenue.prevSeries },
    { key: "orders", label: "Orders", tone: "gold" as const, kind: "int" as const, current: t.orders.series, previous: t.orders.prevSeries },
    { key: "signups", label: "New students", tone: "teal" as const, kind: "int" as const, current: t.signups.series, previous: t.signups.prevSeries },
    { key: "attempts", label: "Mock attempts", tone: "indigo" as const, kind: "int" as const, current: t.attempts.series, previous: t.attempts.prevSeries },
  ];
  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(now);
  const firstName = (admin.name ?? "").split(" ")[0] || "there";

  return (
    <PortalPage width="max-w-[1240px]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-night p-6 text-surface shadow-lift ring-1 ring-white/5 sm:p-7" aria-label="Overview">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-oxblood/45 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-gold/20 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -left-10 top-10 size-48 rounded-full bg-teal/20 blur-3xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="type-eyebrow text-gold">{dateLabel}</p>
            <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.15] sm:text-[32px]">{greeting(now)}, {firstName}</h1>
            <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-dark-soft">Revenue, last {DAYS} days</p>
                <p className="tnum font-display text-[40px] font-bold leading-none">{compactInr(month)}</p>
              </div>
              {t.revenue.pct !== null && (
                <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${t.revenue.pct >= 0 ? "bg-teal/25 text-[#8fe0d4]" : "bg-oxblood/40 text-[#f2b3bb]"}`}>
                  {t.revenue.pct >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}{Math.abs(t.revenue.pct)}% vs the 30 days before
                </span>
              )}
            </div>
            <p className="mt-2 text-[12.5px] text-dark-soft">{t.orders.value} order{t.orders.value === 1 ? "" : "s"} · {t.signups.value} new student{t.signups.value === 1 ? "" : "s"} · {t.attempts.value} mock{t.attempts.value === 1 ? "" : "s"} taken</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <Link key={a.href} href={a.href} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 text-[12.5px] font-semibold text-surface no-underline backdrop-blur transition-colors hover:bg-white/[0.14] hover:no-underline">
                  <a.icon className="size-4 text-gold" aria-hidden />{a.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="min-w-0 lg:self-center"><HeroSpark data={t.revenue.series} labels={t.labels} /></div>
        </div>
      </section>

      <ContactMessages rows={contacts.map((c) => ({ ...c, when: ago(c.createdAt, now) }))} />
      <GuidanceRequests rows={calls.map((c) => ({ key: c.key, userId: c.userId, kind: c.kind, name: c.name, email: c.email, phone: c.phone, product: c.product, when: ago(c.paidAt, now) }))} />

      {fee.freeNow && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-teal-line bg-gradient-to-r from-teal-tint via-white to-gold-tint px-4 py-3 shadow-xs" role="status">
          <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-teal text-white"><Sparkles className="size-[18px]" aria-hidden /></span>
          <p className="min-w-0 flex-1 text-[12.5px] leading-[1.55] text-ink-2"><b className="text-teal">Razorpay fee holiday.</b> No {GATEWAY_EFFECTIVE_PERCENT.toFixed(2)}% processing fee until <b>{fee.lastFreeDayLabel}</b>. Gateway cost is counted as ₹0 until then and as {GATEWAY_EFFECTIVE_PERCENT.toFixed(2)}% from {fee.startsLabel}.</p>
          <span className="rounded-full bg-teal px-3 py-1.5 text-[12px] font-bold text-white">{fee.daysLeft === 0 ? "Last free day" : `${fee.daysLeft} days left`}</span>
        </div>
      )}

      {/* Headline tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile tone="oxblood" label="Revenue · 30 days" value={compactInr(t.revenue.value)} pct={t.revenue.pct} sub={`Before: ${compactInr(t.revenue.prev)}`} icon={<IndianRupee />} series={t.revenue.series} />
        <StatTile tone="gold" label="Orders · 30 days" value={t.orders.value} pct={t.orders.pct} sub={aov ? `${compactInr(aov)} average order` : "No orders yet"} icon={<ShoppingBag />} series={t.orders.series} />
        <StatTile tone="teal" label="New students · 30 days" value={t.signups.value} pct={t.signups.pct} sub={`${t.googleSignups.value} through Google`} icon={<Users />} series={t.signups.series} />
        <StatTile tone="indigo" label="Mock attempts · 30 days" value={t.attempts.value} pct={t.attempts.pct} sub={`${t.submitted.value} finished${t.completion !== null ? ` · ${t.completion}% completion` : ""}`} icon={<FileCheck2 />} series={t.attempts.series} />
        <StatTile tone="green" label="Kept, all time" value={compactInr(money.kept)} sub={`After ${compactInr(money.owed)} to mentors${money.refunded ? `, ${compactInr(money.refunded)} refunds` : ""}${fee.freeNow ? ", no gateway fee" : ""}`} icon={<PiggyBank />} />
        <StatTile tone="plum" label="Students who bought" value={`${conv}%`} sub={`${funnel.buyers} of ${funnel.signedUp} students`} icon={<Percent />} />
      </div>

      {/* Trend */}
      <Panel title="How the business is moving" flush={false}>
        <TrendChart labels={t.labels} metrics={trendMetrics} caption={`last ${DAYS} days, dashed line is the ${DAYS} days before`} />
      </Panel>

      <Section cols={380}>
        <Panel title="What is selling" flush={false} action={<Link href="/admin/analytics" className="text-xs font-semibold">Full analytics</Link>}>
          <Donut slices={t.salesMix.map((s) => ({ label: s.name, value: s.paise, text: compactInr(s.paise) }))} centerValue={compactInr(t.revenue.value)} centerLabel="last 30 days" emptyText="No sales yet" />
          <dl className="mt-5 grid grid-cols-3 gap-2.5 text-center">
            {[{ k: "Orders", v: String(t.orders.value), cls: "bg-gold-tint text-gold-deep" }, { k: "Average order", v: aov ? compactInr(aov) : "—", cls: "bg-teal-tint text-teal" }, { k: "Early-bird", v: String(t.earlyBirdOrders), cls: "bg-plum-tint text-plum" }].map((x) => <div key={x.k} className={`rounded-xl px-2 py-2.5 ${x.cls}`}><dd className="tnum font-display text-[18px] font-bold leading-none">{x.v}</dd><dt className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] opacity-80">{x.k}</dt></div>)}
          </dl>
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
        </Panel>
      </Section>

      <Section cols={380}>
        <Panel title="Launch checklist" flush={false} action={<Rocket className="size-4 text-ink-faint" aria-hidden />}>
          <LaunchChecklist items={checklist} />
        </Panel>
        <Panel title="Live activity" flush={false}>
          <ActivityFeed items={activity} now={now} />
        </Panel>
      </Section>

      <Section cols={300}>
        <Panel title="Mocks" flush={false} action={<Link href="/admin/mocks" className="text-xs font-semibold">Manage</Link>}>
          {board.length === 0 ? <Empty art="chart">No published mocks yet.</Empty> : (
            <ul className="flex flex-col gap-3">
              {board.map((m) => (
                <li key={m.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[12.5px]"><span className="min-w-0 truncate text-ink-2">{m.title}{m.isTest && <span className="text-ink-faint"> · test</span>}</span><span className="tnum flex-none text-ink-faint">{m.started} started · {m.finished} done{m.avg !== null ? ` · avg ${m.avg.toFixed(1)}` : ""}</span></div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-soft"><div className="h-full rounded-full bg-gradient-to-r from-indigo to-[#6a68c8]" style={{ width: `${m.started ? (m.finished / m.started) * 100 : 0}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Early-bird seats" flush={false} action={<Link href="/admin/products" className="text-xs font-semibold">Prices</Link>}>
          {early.length === 0 ? <Empty art="chart">No early-bird offers running.</Empty> : (
            <ul className="flex flex-col gap-3.5">
              {early.map((e) => (
                <li key={e.name}>
                  <div className="flex items-baseline justify-between gap-2 text-[12.5px]"><span className="min-w-0 truncate text-ink-2">{e.name}</span><span className="tnum flex-none font-semibold text-ink">{e.price} <span className="font-normal text-ink-faint line-through">{e.was}</span></span></div>
                  <Meter pct={e.limit ? ((e.limit - e.left) / e.limit) * 100 : 0} tone="amber" note={`${e.limit - e.left} of ${e.limit} taken · ${e.left} left`} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Email health" flush={false} action={<Link href="/admin/mailbox?tab=auto" className="text-xs font-semibold"><Mail className="inline size-3.5" aria-hidden /> Mailbox</Link>}>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-teal-tint p-3"><p className="tnum font-display text-[24px] font-bold leading-none text-teal">{t.emailsSent.value}</p><p className="mt-1 text-[11.5px] text-ink-muted">sent, 30 days</p></div>
            <div className={`rounded-xl p-3 ${t.emailsFailed.value ? "bg-oxblood-tint" : "bg-line-soft"}`}><p className={`tnum font-display text-[24px] font-bold leading-none ${t.emailsFailed.value ? "text-oxblood" : "text-ink-faint"}`}>{t.emailsFailed.value}</p><p className="mt-1 text-[11.5px] text-ink-muted">failed</p></div>
          </div>
          <p className="mt-3 text-[12px] leading-normal text-ink-faint">Receipts, reminders and sign-in links are sent from support@ through your own mailbox. A failed one shows its reason in the Mailbox log.</p>
        </Panel>
      </Section>

      <details className="group rounded-2xl border border-line bg-card shadow-card" open={queue.length > 0 || todaySessions.length > 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
          <span className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-xl bg-indigo-tint text-indigo"><CalendarClock className="size-4" aria-hidden /></span><span><span className="block text-[13.5px] font-bold text-ink">Interview prep and mentors</span><span className="block text-[11.5px] text-ink-faint">{queue.length ? `${queue.length} item${queue.length === 1 ? "" : "s"} need you` : "Nothing needs attention"} · {sessionsWindow} session{sessionsWindow === 1 ? "" : "s"} in the 2-week window</span></span></span>
          <ChevronDown className="size-4 text-ink-faint transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="flex flex-col gap-4 border-t border-line-soft p-4">
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
        </div>
      </details>
    </PortalPage>
  );
}
