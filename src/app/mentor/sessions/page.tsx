import Link from "next/link";
import { nowMs } from "@/lib/datetime";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, StatusPill } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";
import { SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { getSettings } from "@/lib/settings-db";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My sessions" };

export default async function MentorSessions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { mentor } = await requireMentor();
  const { status } = await searchParams;
  const settings = await getSettings();
  const dueOnly = status === "feedback-due";
  const rows = await db.session.findMany({
    where: { mentorId: mentor.id, startsAt: { not: null }, ...(dueOnly ? { status: "CONFIRMED", startsAt: { lt: new Date() }, feedback: null } : {}) },
    orderBy: { startsAt: "desc" }, take: 100,
    include: { student: { select: { name: true } }, feedback: { select: { id: true } } },
  });
  const now = nowMs();
  return (
    <PortalPage width="max-w-[880px]">
      <div className="flex gap-2" role="tablist" aria-label="Filter">
        <Link href="/mentor/sessions" role="tab" aria-selected={!dueOnly} className={`rounded-full border px-3.5 py-2 text-xs font-medium no-underline ${!dueOnly ? "border-ink bg-ink text-surface hover:text-surface" : "border-line-strong bg-white text-ink-2"}`}>All</Link>
        <Link href="/mentor/sessions?status=feedback-due" role="tab" aria-selected={dueOnly} className={`rounded-full border px-3.5 py-2 text-xs font-medium no-underline ${dueOnly ? "border-ink bg-ink text-surface hover:text-surface" : "border-line-strong bg-white text-ink-2"}`}>Feedback due</Link>
      </div>
      {rows.length === 0 ? <Empty>{dueOnly ? "You're all caught up on feedback." : "No sessions assigned yet."}</Empty> : rows.map((s) => {
        const overdue = s.status === "CONFIRMED" && !s.feedback && s.startsAt!.getTime() + settings.feedbackDueHours * 3_600_000 < now;
        const st = s.status === "COMPLETED" ? { label: "Submitted", tone: "stone" as const } : overdue ? { label: "Feedback overdue", tone: "oxblood" as const } : s.status === "CONFIRMED" && s.startsAt!.getTime() < now ? { label: "Feedback due", tone: "amber" as const } : SESSION_STATUS[s.status];
        return (
          <Link key={s.id} href={`/mentor/sessions/${s.id}`} className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-line bg-card p-3.5 text-inherit no-underline hover:border-ink hover:no-underline">
            <span className="tnum w-24 flex-none text-xs font-semibold leading-[1.4] text-ink-faint">{fmtWhen(s.startsAt!)}</span>
            <div className="min-w-[200px] flex-[1_1_200px]">
              <p className="text-[13.5px] font-semibold leading-[1.3] text-ink">{s.type === "GD_BATCH" ? "GD batch" : s.student?.name?.replace(/\s*\(demo\)/, "") ?? "Student"}</p>
              <p className="mt-[3px] text-xs leading-[1.4] text-ink-faint">{sessionTitle(s.type, s.focus)}</p>
            </div>
            <StatusPill tone={st.tone}>{st.label}</StatusPill>
          </Link>
        );
      })}
    </PortalPage>
  );
}
