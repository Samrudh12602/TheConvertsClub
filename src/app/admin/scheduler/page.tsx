import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, StatusPill } from "@/components/portal/ui";
import { AdminCancelButton, AssignPicker, ConfirmButton } from "@/components/admin/assign-controls";
import { db } from "@/lib/db";
import { fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { getSettings } from "@/lib/settings-db";
import { suggestMentor } from "@/server/admin";
import { needsSenior } from "@/server/scheduling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scheduler" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

/**
 * Allocation-board style scheduler (the design's "layout B"). A drag-and-drop weekly timeline
 * ("layout A") is not built — see docs/DESIGN_MAP.md. This list covers the same job: every
 * upcoming session, its current mentor, a suggested best match, and one click to (re)assign.
 */
export default async function SchedulerPage() {
  const now = new Date();
  const [unassigned, upcoming, settings] = await Promise.all([
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, include: { student: { select: { name: true } } } }),
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: { not: null }, startsAt: { gt: now, lt: new Date(now.getTime() + 7 * 86_400_000) } }, orderBy: { startsAt: "asc" }, take: 40, include: { student: { select: { name: true } }, mentor: { include: { user: { select: { name: true } } } } } }),
    getSettings(),
  ]);
  const mentors = await db.mentorProfile.findMany({ where: { status: "ACTIVE" }, include: { user: { select: { name: true } } } });
  const options = (type: (typeof unassigned)[number]["type"], focus: (typeof unassigned)[number]["focus"]) => {
    const senior = needsSenior(type, focus, settings.seniorRequiredFocuses);
    const pool = mentors.filter((m) => (type === "STRATEGY_CALL" ? m.isAdminMentor : !m.isAdminMentor && (!senior || m.tier === "SENIOR")));
    return pool.map((m) => ({ id: m.id, label: nm(m.user.name) }));
  };

  return (
    <PortalPage width="max-w-[1000px]">
      {unassigned.length > 0 && (
        <>
          <Flash tone="oxblood">{unassigned.length} session{unassigned.length === 1 ? "" : "s"} unassigned.</Flash>
          {await Promise.all(unassigned.map(async (s) => {
            const suggestion = await suggestMentor(s.id);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-oxblood-line bg-oxblood-tint p-3.5">
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{nm(s.student?.name)} · {sessionTitle(s.type, s.focus)}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{s.startsAt ? fmtWhen(s.startsAt) : ""}</p></div>
                {s.status === "REQUESTED" && <ConfirmButton sessionId={s.id} />}
                <AssignPicker sessionId={s.id} options={options(s.type, s.focus)} suggestedId={suggestion?.mentorId} />
              </div>
            );
          }))}
        </>
      )}
      <Flash>Upcoming sessions, next 7 days. Reassign anyone, including to yourself as a mentor.</Flash>
      {upcoming.length === 0 ? <Empty>Nothing scheduled in the next 7 days.</Empty> : upcoming.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-card p-3.5">
          <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{nm(s.student?.name) || "GD batch"} · {sessionTitle(s.type, s.focus)}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{s.startsAt ? fmtWhen(s.startsAt) : ""} · currently {s.mentor ? nm(s.mentor.user.name) : "unassigned"}</p></div>
          {s.status === "REQUESTED" && <ConfirmButton sessionId={s.id} />}
          <AdminCancelButton sessionId={s.id} />
          <AssignPicker sessionId={s.id} options={options(s.type, s.focus)} />
          <StatusPill tone={s.status === "CONFIRMED" ? "green" : "amber"}>{s.status}</StatusPill>
        </div>
      ))}
    </PortalPage>
  );
}
