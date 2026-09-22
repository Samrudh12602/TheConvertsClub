import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Meter, StatusPill } from "@/components/portal/ui";
import { AddMentorTabs } from "@/components/admin/add-mentor-tabs";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentors" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function MentorsPage() {
  const mentors = await db.mentorProfile.findMany({
    where: { isAdminMentor: false },
    orderBy: [{ status: "asc" }, { tier: "asc" }],
    include: { user: { select: { name: true, email: true } }, _count: { select: { sessions: { where: { status: { in: ["CONFIRMED", "REQUESTED"] } } } } } },
  });
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const stats = await Promise.all(mentors.map(async (m) => {
    const [open, booked, accrued] = await Promise.all([
      db.slot.count({ where: { mentorId: m.id, startsAt: { gte: now, lt: weekEnd }, status: { in: ["OPEN", "HELD"] } } }),
      db.slot.count({ where: { mentorId: m.id, startsAt: { gte: now, lt: weekEnd }, status: "BOOKED" } }),
      db.payoutAccrual.aggregate({ where: { mentorId: m.id, status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true } }),
    ]);
    return { open, booked, accrued: accrued._sum.amountPaise ?? 0 };
  }));

  return (
    <PortalPage>
      <AddMentorTabs />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {mentors.map((m, i) => {
          const { open, booked, accrued } = stats[i];
          const total = open + booked;
          const hasPhoto = m.photoKey || m.photoUrl;
          return (
            <Link key={m.id} href={`/admin/mentors/${m.id}`} className="flex flex-col gap-2.5 rounded-[11px] border border-line bg-card p-4 text-inherit no-underline hover:border-ink hover:no-underline">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  {hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- private/dynamic source, not an optimizable static asset
                    <img src={m.photoKey ? `/api/mentor-photo/${m.id}` : m.photoUrl!} alt="" className="size-9 flex-none rounded-full object-cover" />
                  ) : (
                    <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-line-soft text-[11px] font-semibold text-ink-faint">{nm(m.user.name).slice(0, 2).toUpperCase()}</span>
                  )}
                  <div><p className="font-display text-sm font-bold leading-[1.3] text-ink">{nm(m.user.name)}</p><p className="mt-0.5 text-[11px] text-ink-faint">{m.college ?? "—"}</p></div>
                </div>
                <div className="flex flex-col items-end gap-1"><span className="rounded bg-oxblood px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">{m.tier}</span><StatusPill tone={m.status === "ACTIVE" ? "green" : m.status === "PAUSED" ? "amber" : "stone"}>{m.status}</StatusPill></div>
              </div>
              <Meter label="This week" note={`${booked} / ${total || 0} booked`} pct={total ? (booked / total) * 100 : 0} tone="oxblood" />
              <div className="flex items-center justify-between border-t border-line-soft pt-2.5 text-[11.5px]"><span className="text-ink-faint">{m._count.sessions} upcoming</span><span className="tnum font-semibold text-ink">{formatPaise(accrued)} pending</span></div>
            </Link>
          );
        })}
      </div>
    </PortalPage>
  );
}
