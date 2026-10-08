import Link from "next/link";
import { AlarmClock, CheckCircle2, ChevronRight, Layers } from "lucide-react";
import { nowMs } from "@/lib/datetime";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, StatusPill } from "@/components/portal/ui";
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
    where: dueOnly
      ? { mentorId: mentor.id, startsAt: { lt: new Date() }, status: "CONFIRMED", feedback: null }
      : { startsAt: { not: null }, OR: [{ mentorId: mentor.id }, { panelists: { some: { mentorId: mentor.id, status: { not: "DECLINED" } } } }] },
    orderBy: { startsAt: "desc" }, take: 100,
    include: { student: { select: { name: true } }, feedback: { select: { id: true } } },
  });
  const now = nowMs();
  const dueCount = rows.filter((s) => s.mentorId === mentor.id && s.status === "CONFIRMED" && !s.feedback && s.startsAt!.getTime() < now).length;
  const doneCount = rows.filter((s) => s.status === "COMPLETED").length;
  const month = (d: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" }).format(d);
  const groups: { m: string; items: typeof rows }[] = [];
  for (const s of rows) { const m = month(s.startsAt!); const g = groups[groups.length - 1]; if (g && g.m === m) g.items.push(s); else groups.push({ m, items: [s] }); }
  const tab = (on: boolean) => `inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-semibold no-underline transition-all ${on ? "bg-white text-ink shadow-card hover:text-ink" : "text-ink-muted hover:text-ink"} hover:no-underline`;
  return (
    <PortalPage width="max-w-[900px]">
      <KpiGrid>
        <Kpi label="Feedback due" value={dueCount} note={dueCount ? "Waiting on you" : "All caught up"} noteTone={dueCount ? "oxblood" : "green"} icon={<AlarmClock />} accent={dueCount ? "oxblood" : "teal"} />
        <Kpi label="Completed" value={doneCount} note="Feedback submitted" icon={<CheckCircle2 />} accent="teal" />
        <Kpi label="Shown" value={rows.length} note={dueOnly ? "Needing feedback" : "Most recent 100"} icon={<Layers />} accent="indigo" />
      </KpiGrid>
      <div className="flex w-fit gap-1 rounded-xl bg-line-soft p-1" role="tablist" aria-label="Filter">
        <Link href="/mentor/sessions" role="tab" aria-selected={!dueOnly} className={tab(!dueOnly)}>All sessions</Link>
        <Link href="/mentor/sessions?status=feedback-due" role="tab" aria-selected={dueOnly} className={tab(dueOnly)}>Feedback due{dueCount > 0 && <span className="tnum rounded-full bg-oxblood px-1.5 py-0.5 text-[10.5px] leading-none text-white">{dueCount}</span>}</Link>
      </div>
      {rows.length === 0 ? <Empty art="sessions">{dueOnly ? "You're all caught up on feedback." : "No sessions assigned yet."}</Empty> : groups.map((g) => (
        <section key={g.m} className="flex flex-col gap-2.5">
          <h2 className="type-label sticky top-[60px] z-[1] bg-surface/90 py-1 text-ink-faint backdrop-blur">{g.m}</h2>
          {g.items.map((s) => {
            const lead = s.mentorId === mentor.id;
            const overdue = lead && s.status === "CONFIRMED" && !s.feedback && s.startsAt!.getTime() + settings.feedbackDueHours * 3_600_000 < now;
            const st = !lead && s.status === "CONFIRMED" ? { label: "On the panel", tone: "indigo" as const } : s.status === "COMPLETED" ? { label: lead ? "Submitted" : "Done", tone: "stone" as const } : overdue ? { label: "Feedback overdue", tone: "oxblood" as const } : lead && s.status === "CONFIRMED" && s.startsAt!.getTime() < now ? { label: "Feedback due", tone: "amber" as const } : SESSION_STATUS[s.status];
            const name = s.type === "GD_BATCH" ? "GD batch" : s.student?.name?.replace(/\s*\(demo\)/, "") ?? "Student";
            const edge = st.tone === "oxblood" ? "bg-oxblood" : st.tone === "amber" ? "bg-gold" : st.tone === "green" ? "bg-teal" : "bg-line-strong";
            return (
              <Link key={s.id} href={`/mentor/sessions/${s.id}`} className="group relative flex flex-wrap items-center gap-3.5 overflow-hidden rounded-xl border border-line bg-card py-3 pl-5 pr-4 text-inherit no-underline shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-oxblood hover:shadow-lift hover:no-underline">
                <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${edge}`} />
                <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-indigo-tint font-display text-[13px] font-bold text-indigo">{name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-[180px] flex-[1_1_180px]">
                  <p className="text-[13.5px] font-semibold leading-[1.3] text-ink">{name}</p>
                  <p className="mt-[3px] text-xs leading-[1.4] text-ink-faint">{sessionTitle(s.type, s.focus)}</p>
                </div>
                <span className="tnum text-xs font-medium text-ink-muted">{fmtWhen(s.startsAt!)}</span>
                <StatusPill tone={st.tone}>{st.label}</StatusPill>
                <ChevronRight aria-hidden className="size-4 flex-none text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-oxblood" />
              </Link>
            );
          })}
        </section>
      ))}
    </PortalPage>
  );
}
