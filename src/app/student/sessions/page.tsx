import { PortalPage } from "@/components/portal/portal-page";
import { KpiGrid, Kpi } from "@/components/portal/ui";
import { CalendarCheck, CheckCircle2, Star } from "lucide-react";
import { SessionBoard, type BoardRow } from "@/components/student/session-board";
import { nowMs } from "@/lib/datetime";
import { db } from "@/lib/db";
import { fmtDayNum, fmtMon, fmtTime, relative } from "@/lib/format";
import { SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My sessions" };

export default async function SessionsPage() {
  const user = await requireStudent();
  const sessions = await db.session.findMany({
    where: { studentId: user.id, startsAt: { not: null } },
    orderBy: { startsAt: "desc" },
    include: { mentor: { include: { user: { select: { name: true } } } }, feedback: { select: { id: true, overall: true } } },
  });
  const now = nowMs();
  const isUpcoming = (s: (typeof sessions)[number]) => s.startsAt!.getTime() >= now && ["CONFIRMED", "REQUESTED"].includes(s.status);
  const rows: BoardRow[] = [...sessions.filter(isUpcoming).reverse(), ...sessions.filter((s) => !isUpcoming(s))].map((s) => {
    const up = isUpcoming(s);
    const ready = s.status === "COMPLETED" && s.feedback;
    const st = ready ? { label: "Feedback ready", tone: "indigo" as const } : SESSION_STATUS[s.status];
    return { id: s.id, title: sessionTitle(s.type, s.focus), day: fmtDayNum(s.startsAt!), mon: fmtMon(s.startsAt!), time: fmtTime(s.startsAt!), mentor: s.mentor?.user.name?.replace(/\s*\(demo\)/, "") ?? null, group: up ? "upcoming" : ready ? "feedback" : "past", label: st.label, tone: st.tone, score: s.feedback?.overall ?? null, when: up ? relative(s.startsAt!) : null };
  });
  const scored = sessions.filter((s) => s.feedback).map((s) => s.feedback!.overall);
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  return (
    <PortalPage width="max-w-[860px]">
      <KpiGrid>
        <Kpi label="Upcoming" value={rows.filter((r) => r.group === "upcoming").length} note="Booked sessions" icon={<CalendarCheck />} accent="indigo" />
        <Kpi label="Completed" value={sessions.filter((s) => s.status === "COMPLETED").length} note="Sessions done" icon={<CheckCircle2 />} accent="teal" />
        <Kpi label="Average score" value={avg !== null ? avg.toFixed(1) : "\u2014"} note={scored.length ? `Across ${scored.length} feedback` : "After your first feedback"} icon={<Star />} accent="gold" />
      </KpiGrid>
      <SessionBoard rows={rows} />
    </PortalPage>
  );
}
