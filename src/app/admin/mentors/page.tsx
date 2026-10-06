import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Avatar, Meter, Panel, StatusPill } from "@/components/portal/ui";
import { AddMentorTabs } from "@/components/admin/add-mentor-tabs";
import { adminDb } from "@/server/demo";
import { formatPaise } from "@/lib/money";
import { getSettings } from "@/lib/settings-db";
import { mentorQuality, qualityFlags } from "@/server/mentor-quality";
import { currentUser } from "@/server/session";
import { MentorModeCard } from "@/components/admin/admin-schedule";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentors" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function MentorsPage() {
  const db = await adminDb();
  const mentors = await db.mentorProfile.findMany({
    where: { isAdminMentor: false },
    orderBy: [{ status: "asc" }, { tier: "asc" }],
    include: { user: { select: { name: true, email: true } }, _count: { select: { sessions: { where: { status: { in: ["CONFIRMED", "REQUESTED"] } } } } } },
  });
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const stats = await Promise.all(mentors.map(async (m) => {
    const [open, booked, accrued, referrals] = await Promise.all([
      db.slot.count({ where: { mentorId: m.id, startsAt: { gte: now, lt: weekEnd }, status: { in: ["OPEN", "HELD"] } } }),
      db.slot.count({ where: { mentorId: m.id, startsAt: { gte: now, lt: weekEnd }, status: "BOOKED" } }),
      db.payoutAccrual.aggregate({ where: { mentorId: m.id, status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true } }),
      db.order.count({ where: { coupon: { mentorId: m.id }, status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } } }),
    ]);
    return { open, booked, accrued: accrued._sum.amountPaise ?? 0, referrals };
  }));

  const [viewer, settings] = await Promise.all([currentUser(), getSettings()]);
  const quality = await mentorQuality(Boolean(viewer?.isDemo), settings.feedbackDueHours);
  return (
    <PortalPage>
      <AddMentorTabs />
      {viewer && !viewer.isDemo && (
        <Panel title="Your mentor mode" flush={false}>
          <MentorModeCard state={viewer.mentorProfile?.isAdminMentor ? (viewer.mentorProfile.status === "ACTIVE" ? "on" : "paused") : "off"} />
        </Panel>
      )}
      {quality.length > 0 && (
        <Panel title="Mentor quality · last 30 days">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[12.5px]">
              <thead><tr className="border-b border-line">{["Mentor", "Sessions", "Rating", "Feedback on time", "Overdue now", ""].map((h) => <th key={h} className="type-label px-3.5 py-2 text-ink-faint">{h}</th>)}</tr></thead>
              <tbody>
                {quality.map((q) => {
                  const flags = qualityFlags(q);
                  return (
                    <tr key={q.mentorId} className="border-b border-line-soft last:border-b-0">
                      <td className="px-3.5 py-2.5 font-medium"><Link href={`/admin/mentors/${q.mentorId}`}>{q.name}</Link></td>
                      <td className="tnum px-3.5 py-2.5 text-ink-2">{q.completed}</td>
                      <td className="tnum px-3.5 py-2.5 text-ink-2">{q.ratingAvg ? `★ ${q.ratingAvg.toFixed(1)} (${q.ratings})` : "—"}</td>
                      <td className="tnum px-3.5 py-2.5 text-ink-2">{q.feedbackTotal ? `${Math.round((q.feedbackOnTime / q.feedbackTotal) * 100)}%` : "—"}</td>
                      <td className="tnum px-3.5 py-2.5 text-ink-2">{q.overdueNow || "—"}</td>
                      <td className="px-3.5 py-2.5">{flags.length === 0 ? <StatusPill tone="green">On track</StatusPill> : flags.map((f) => <span key={f} className="mr-1.5"><StatusPill tone="amber">{f}</StatusPill></span>)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {mentors.map((m, i) => {
          const { open, booked, accrued, referrals } = stats[i];
          const total = open + booked;
          const hasPhoto = m.photoKey || m.photoUrl;
          return (
            <Link key={m.id} href={`/admin/mentors/${m.id}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 text-inherit no-underline shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-oxblood hover:shadow-lift hover:no-underline">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- private/dynamic source, not an optimizable static asset
                    <img src={m.photoKey ? `/api/mentor-photo/${m.id}` : m.photoUrl!} alt="" className="size-10 flex-none rounded-full object-cover ring-2 ring-white shadow-card" />
                  ) : (
                    <Avatar name={nm(m.user.name)} size={40} />
                  )}
                  <div><p className="font-display text-sm font-bold leading-[1.3] text-ink">{nm(m.user.name)}</p><p className="mt-0.5 text-[11px] text-ink-faint">{m.college ?? "—"}</p></div>
                </div>
                <div className="flex flex-col items-end gap-1"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white ${m.tier === "SENIOR" ? "bg-gradient-to-r from-gold to-[#d4a04a]" : "bg-brand"}`}>{m.tier}</span><StatusPill tone={m.status === "ACTIVE" ? "green" : m.status === "PAUSED" ? "amber" : "stone"}>{m.status}</StatusPill></div>
              </div>
              <Meter label="This week" note={`${booked} / ${total || 0} booked`} pct={total ? (booked / total) * 100 : 0} tone="oxblood" />
              <div className="flex items-center justify-between border-t border-line-soft pt-2.5 text-[11.5px]"><span className="text-ink-faint">{m._count.sessions} upcoming</span><span className="tnum font-semibold text-ink">{formatPaise(accrued)} pending</span></div>
              {referrals > 0 && <p className="text-[11px] font-semibold text-oxblood">{referrals} referred via coupon</p>}
            </Link>
          );
        })}
      </div>
    </PortalPage>
  );
}
