import { PortalPage } from "@/components/portal/portal-page";
import { nowMs } from "@/lib/datetime";
import { DateBadge, Empty, StatusPill } from "@/components/portal/ui";
import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDayNum, fmtMon, fmtTime } from "@/lib/format";
import { SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My sessions" };

export default async function SessionsPage() {
  const user = await requireStudent();
  const sessions = await db.session.findMany({
    where: { studentId: user.id, startsAt: { not: null } },
    orderBy: { startsAt: "desc" },
    include: { mentor: { include: { user: { select: { name: true } } } }, feedback: { select: { id: true } } },
  });
  const now = nowMs();
  const upcoming = sessions.filter((s) => s.startsAt!.getTime() >= now && ["CONFIRMED", "REQUESTED"].includes(s.status)).reverse();
  const past = sessions.filter((s) => !upcoming.includes(s));
  const row = (s: (typeof sessions)[number]) => {
    const st = s.status === "COMPLETED" && s.feedback ? { label: "Feedback ready", tone: "indigo" as const } : SESSION_STATUS[s.status];
    return (
      <Link key={s.id} href={`/student/sessions/${s.id}`} className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-line bg-card p-3.5 text-inherit no-underline hover:border-ink hover:no-underline">
        <DateBadge day={fmtDayNum(s.startsAt!)} mon={fmtMon(s.startsAt!)} w="w-[52px]" />
        <div className="min-w-0 flex-[1_1_200px]">
          <p className="text-[13.5px] font-semibold leading-[1.3] text-ink">{sessionTitle(s.type, s.focus)}</p>
          <p className="mt-[3px] text-xs leading-[1.4] text-ink-faint">{fmtTime(s.startsAt!)}{s.mentor?.user.name ? ` · ${s.mentor.user.name.replace(/\s*\(demo\)/, "")}` : ""}</p>
        </div>
        <StatusPill tone={st.tone}>{st.label}</StatusPill>
      </Link>
    );
  };
  return (
    <PortalPage width="max-w-[820px]">
      {sessions.length === 0 && <Empty>No sessions yet. <Link href="/student/book">Book your first one.</Link></Empty>}
      {upcoming.length > 0 && <><h2 className="type-label text-ink-faint">Upcoming</h2><div className="flex flex-col gap-2.5">{upcoming.map(row)}</div></>}
      {past.length > 0 && <><h2 className="type-label mt-2 text-ink-faint">Past</h2><div className="flex flex-col gap-2.5">{past.map(row)}</div></>}
    </PortalPage>
  );
}
