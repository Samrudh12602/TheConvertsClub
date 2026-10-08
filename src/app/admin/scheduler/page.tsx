import { PanelPicker, type PanelOption } from "@/components/admin/panel-picker";
import { ScheduleTabs } from "@/components/admin/schedule-tabs";
import { PortalPage } from "@/components/portal/portal-page";
import { Avatar, Empty, Flash, StatusPill } from "@/components/portal/ui";
import { fmtDayNum, fmtMon, fmtTime } from "@/lib/format";
import { AdminCancelButton, AssignPicker, ConfirmButton } from "@/components/admin/assign-controls";
import { adminDb } from "@/server/demo";
import { fmtWhen } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { getSettings } from "@/lib/settings-db";
import { suggestMentor } from "@/server/admin";
import { isAdminOnly, needsSenior } from "@/server/scheduling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scheduler" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

/**
 * Allocation-board style scheduler (the design's "layout B"). A drag-and-drop weekly timeline
 * ("layout A") is not built — see docs/DESIGN_MAP.md. This list covers the same job: every
 * upcoming session, its current mentor, a suggested best match, and one click to (re)assign.
 */
export default async function SchedulerPage() {
  const db = await adminDb();
  const now = new Date();
  const [unassigned, upcoming, settings] = await Promise.all([
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, include: { student: { select: { name: true } } } }),
    db.session.findMany({ where: { status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: { not: null }, startsAt: { gt: now, lt: new Date(now.getTime() + 7 * 86_400_000) } }, orderBy: { startsAt: "asc" }, take: 40, include: { student: { select: { name: true } }, mentor: { include: { user: { select: { name: true } } } } } }),
    getSettings(),
  ]);
  const mentors = await db.mentorProfile.findMany({ where: { status: "ACTIVE" }, include: { user: { select: { name: true } } } });
  // Panel PIs need the owner to pick two more panelists, whenever they fall (not just in the next 7 days).
  const panels = await db.session.findMany({
    where: { type: "PANEL_PI", status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: now } }, orderBy: { startsAt: "asc" },
    include: { student: { select: { name: true } }, panelists: { include: { mentor: { include: { user: { select: { name: true } } } } } } },
  });
  const panelTimes = panels.map((p) => p.startsAt!);
  const panelPool = mentors.filter((m) => !m.isAdminMentor);
  const [busySess, busySeats, openSlots] = panels.length ? await Promise.all([
    db.session.findMany({ where: { startsAt: { in: panelTimes }, status: { in: ["CONFIRMED", "REQUESTED"] }, mentorId: { not: null } }, select: { id: true, mentorId: true, startsAt: true } }),
    db.sessionPanelist.findMany({ where: { status: { not: "DECLINED" }, session: { startsAt: { in: panelTimes }, status: { in: ["CONFIRMED", "REQUESTED"] } } }, select: { sessionId: true, mentorId: true, session: { select: { startsAt: true } } } }),
    db.slot.findMany({ where: { startsAt: { in: panelTimes }, status: "OPEN", mentorId: { in: panelPool.map((m) => m.id) } }, select: { mentorId: true, startsAt: true } }),
  ]) : [[], [], []];
  const panelOptions = (p: (typeof panels)[number]): PanelOption[] => panelPool.map((m) => {
    const t = p.startsAt!.getTime();
    const busy = busySess.some((s) => s.mentorId === m.id && s.startsAt?.getTime() === t && s.id !== p.id) || busySeats.some((s) => s.mentorId === m.id && s.sessionId !== p.id && s.session.startsAt?.getTime() === t);
    const free = openSlots.some((s) => s.mentorId === m.id && s.startsAt.getTime() === t);
    return { id: m.id, label: nm(m.user.name), busy, note: busy ? "busy then" : free ? "free" : "hour added for them" };
  });
  const options = (type: (typeof unassigned)[number]["type"], focus: (typeof unassigned)[number]["focus"]) => {
    const senior = needsSenior(type, focus, settings.seniorRequiredFocuses);
    // Strategy calls are only ever the admin's. Anything else can go to any mentor, including the admin's own mentor mode.
    const pool = mentors.filter((m) => (isAdminOnly(type) ? m.isAdminMentor : !senior || m.tier === "SENIOR"));
    return pool.map((m) => ({ id: m.id, label: nm(m.user.name) }));
  };

  return (
    <PortalPage width="max-w-[1000px]">
      <ScheduleTabs active="assign" />
      {panels.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="Panel PIs to staff">
          <h2 className="type-label text-ink-faint">Panel PIs · pick two panelists for each</h2>
          {panels.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-card">
              <Avatar name={nm(p.student?.name)} />
              <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{nm(p.student?.name)} · Panel PI</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{p.startsAt ? fmtWhen(p.startsAt) : ""}</p></div>
              <AdminCancelButton sessionId={p.id} />
              <PanelPicker sessionId={p.id} options={panelOptions(p)} seats={p.panelists.map((x) => ({ mentorId: x.mentorId, name: nm(x.mentor.user.name), status: x.status }))} />
            </div>
          ))}
        </section>
      )}
      {unassigned.length > 0 && (
        <>
          <Flash tone="oxblood">{unassigned.length} session{unassigned.length === 1 ? "" : "s"} unassigned.</Flash>
          {await Promise.all(unassigned.map(async (s) => {
            const suggestion = await suggestMentor(s.id);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-oxblood-line bg-oxblood-tint p-3.5 shadow-xs">
                <Avatar name={nm(s.student?.name)} />
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{nm(s.student?.name)} · {sessionTitle(s.type, s.focus)}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{s.startsAt ? fmtWhen(s.startsAt) : ""}</p></div>
                {s.status === "REQUESTED" && <ConfirmButton sessionId={s.id} />}
                <AssignPicker sessionId={s.id} options={options(s.type, s.focus)} suggestedId={suggestion?.mentorId} />
              </div>
            );
          }))}
        </>
      )}
      <Flash>Upcoming sessions, next 7 days. Reassign anyone, including to yourself as a mentor.</Flash>
      {upcoming.filter((s) => s.type !== "PANEL_PI").length === 0 ? <Empty art="calendar">Nothing scheduled in the next 7 days.</Empty> : upcoming.filter((s) => s.type !== "PANEL_PI").map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-line bg-card p-3.5 shadow-card">
          {s.startsAt && <div className="w-12 flex-none text-center"><p className="font-display text-[20px] font-bold leading-none text-ink">{fmtDayNum(s.startsAt)}</p><p className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-ink-faint">{fmtMon(s.startsAt)}</p></div>}
          <Avatar name={nm(s.student?.name) || "GD"} />
          <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{nm(s.student?.name) || "GD batch"} · {sessionTitle(s.type, s.focus)}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{s.startsAt ? fmtTime(s.startsAt) : ""} · with <span className="font-semibold text-ink-2">{s.mentor ? nm(s.mentor.user.name) : "unassigned"}</span></p></div>
          {s.status === "REQUESTED" && <ConfirmButton sessionId={s.id} />}
          <AdminCancelButton sessionId={s.id} />
          {s.type !== "PANEL_PI" && <AssignPicker sessionId={s.id} options={options(s.type, s.focus)} />}
          <StatusPill tone={s.status === "CONFIRMED" ? "green" : "amber"}>{s.status}</StatusPill>
        </div>
      ))}
    </PortalPage>
  );
}
