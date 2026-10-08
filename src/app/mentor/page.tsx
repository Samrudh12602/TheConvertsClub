import Link from "next/link";
import { AlarmClock, CalendarCheck, ChevronRight, IndianRupee, Medal, Star, Trophy } from "lucide-react";
import { Sparkline } from "@/components/ui/charts";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, Kpi, KpiGrid, Meter, Panel, Row, Section } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtWhen, relative } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { getSettings } from "@/lib/settings-db";
import { referralProgress } from "@/server/referral-bonus";
import { checklistProgress, mentorChecklist } from "@/lib/mentor-checklist";
import { mentorBoard } from "@/server/leaderboard";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function MentorDashboard() {
  const { user, mentor } = await requireMentor();
  const settings = await getSettings();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const [openWeek, bookedWeek, assigned, accrued, ratings, mocks, board, futureOpenSlots, referral] = await Promise.all([
    db.slot.count({ where: { mentorId: mentor.id, startsAt: { gte: now, lt: weekEnd }, status: { in: ["OPEN", "HELD"] } } }),
    db.slot.count({ where: { mentorId: mentor.id, startsAt: { gte: now, lt: weekEnd }, status: "BOOKED" } }),
    db.session.findMany({ where: { mentorId: mentor.id, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: new Date(now.getTime() - 3_600_000) } }, orderBy: { startsAt: "asc" }, take: 6, include: { student: { select: { name: true, studentProfile: true } } } }),
    db.payoutAccrual.aggregate({ where: { mentorId: mentor.id, status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true } }),
    db.sessionRating.aggregate({ where: { session: { mentorId: mentor.id } }, _avg: { rating: true }, _count: true }),
    countMocks(mentor.id, settings.mockCounts),
    mentorBoard(user.isDemo),
    db.slot.count({ where: { mentorId: mentor.id, status: "OPEN", startsAt: { gt: now } } }),
    mentor.isAdminMentor ? Promise.resolve(null) : referralProgress(mentor.id),
  ]);
  // The owner's own mentor mode earns no pay and isn't listed publicly, so only 'publish your hours' applies.
  const checklist = mentorChecklist({ bio: mentor.bio, photoKey: mentor.photoKey, photoUrl: mentor.photoUrl, payoutEncrypted: mentor.payoutEncrypted, futureOpenSlots }).filter((i) => !mentor.isAdminMentor || i.key === "availability");
  const dueMs = settings.feedbackDueHours * 3_600_000;
  const [needFeedback, accrualRows] = await Promise.all([
    db.session.findMany({ where: { mentorId: mentor.id, status: "CONFIRMED", feedback: null, startsAt: { lt: now } }, orderBy: { startsAt: "asc" }, take: 5, include: { student: { select: { name: true } } } }),
    db.payoutAccrual.findMany({ where: { mentorId: mentor.id, createdAt: { gte: new Date(now.getTime() - 56 * 86_400_000) } }, select: { amountPaise: true, createdAt: true } }),
  ]);
  const weeks = Array.from({ length: 8 }, (_, i) => accrualRows.filter((a) => Math.floor((a.createdAt.getTime() - (now.getTime() - 56 * 86_400_000)) / (7 * 86_400_000)) === i).reduce((n, a) => n + a.amountPaise, 0) / 100);
  const progress = checklistProgress(checklist);
  const first = assigned[0];
  const nm = (n?: string | null) => n?.replace(/\s*\(demo\)/, "") ?? "Student";

  return (
    <PortalPage>
      {mentor.isAdminMentor && <Flash>You&apos;re in mentor mode. Sessions you take earn no mentor pay: the whole fee stays with you.</Flash>}
      {progress.done < progress.total && (
        <Panel title={`Get ready for students · ${progress.done} of ${progress.total} done`} flush={false}>
          <ul className="flex flex-col gap-2.5">
            {checklist.map((i) => (
              <li key={i.key} className="flex items-start gap-3">
                <span aria-hidden className={`mt-0.5 flex size-5 flex-none items-center justify-center rounded-full text-[11px] font-bold ${i.done ? "bg-green-tint text-green" : "border border-line-strong text-transparent"}`}>✓</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium leading-[1.35] ${i.done ? "text-ink-faint line-through" : "text-ink"}`}>{i.done ? i.label : <Link href={i.href}>{i.label}</Link>}</p>
                  {!i.done && <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-faint">{i.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <KpiGrid>
        <Kpi label="This week" value={`${bookedWeek} / ${bookedWeek + openWeek}`} note={`${openWeek} slot${openWeek === 1 ? "" : "s"} still open`} icon={<CalendarCheck />} accent="indigo" />
        <Kpi label="Mocks, season" value={mocks} note="Completed sessions" noteTone="muted" icon={<Trophy />} accent="gold" />
        <Kpi label="Accrued" value={formatPaise(accrued._sum.amountPaise ?? 0)} note={<span className="flex items-center justify-between gap-2"><span>Awaiting payout</span><Sparkline data={weeks} tone="teal" width={60} height={20} /></span>} icon={<IndianRupee />} accent="teal" />
        <Kpi label="Avg rating" value={ratings._avg.rating ? ratings._avg.rating.toFixed(1) : "—"} note={`Across ${ratings._count} rated sessions`} noteTone="green" icon={<Star />} accent="gold" />
      </KpiGrid>

      {first ? (
        <div className="flex flex-wrap items-center gap-[18px] rounded-2xl bg-night p-5 shadow-lift ring-1 ring-white/5">
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="type-eyebrow text-dark-muted">Next session · {relative(first.startsAt!)}</p>
            <h2 className="mt-2 font-display text-[23px] font-bold leading-[1.25] text-surface">{nm(first.student?.name)} · {sessionTitle(first.type, first.focus)}</h2>
            <p className="mt-1.5 text-[13px] leading-normal text-dark-soft">{fmtWhen(first.startsAt!)} IST{first.student?.studentProfile?.college ? ` · ${first.student.studentProfile.college}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/mentor/sessions/${first.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-[#3A332B] px-[15px] text-[13px] font-medium leading-none text-dark-text no-underline hover:border-dark-muted hover:text-dark-text hover:no-underline">Open dossier</Link>
            {first.meetingUrl && <a href={first.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-oxblood px-[17px] text-[13px] font-semibold leading-none text-white no-underline hover:bg-oxblood-hover hover:text-white hover:no-underline">Start session</a>}
          </div>
        </div>
      ) : <Panel><Empty art="calendar">No sessions assigned right now.</Empty></Panel>}

      {needFeedback.length > 0 && (
        <Panel title={`Feedback due \u00b7 ${needFeedback.length}`} action={<Link href="/mentor/sessions" className="text-xs font-semibold">All sessions</Link>}>
          {needFeedback.map((a) => {
            const left = (a.startsAt ? a.startsAt.getTime() : now.getTime()) + dueMs - now.getTime();
            const late = left < 0;
            const hrs = Math.abs(Math.round(left / 3_600_000));
            return (
              <Row key={a.id} href={`/mentor/feedback/${a.id}`}>
                <span className={`flex size-9 flex-none items-center justify-center rounded-xl ${late ? "bg-oxblood-tint text-oxblood" : "bg-gold-tint text-gold-deep"}`}><AlarmClock aria-hidden className="size-[18px]" /></span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-medium leading-[1.3] text-ink-body">{nm(a.student?.name)}</p><p className="mt-0.5 text-[11.5px] leading-[1.35] text-ink-faint">{sessionTitle(a.type, a.focus)}</p></div>
                <span className={`tnum flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold ${late ? "bg-oxblood-tint text-oxblood" : "bg-gold-tint text-gold-deep"}`}>{(() => { const t = hrs >= 48 ? `${Math.round(hrs / 24)}d` : `${hrs}h`; return late ? `${t} overdue` : `${t} left`; })()}</span>
                <ChevronRight aria-hidden className="size-4 flex-none text-ink-faint" />
              </Row>
            );
          })}
        </Panel>
      )}

      <Section cols={280}>
        <Panel title="Assigned to you" action={<Link href="/mentor/sessions" className="text-xs font-semibold">All</Link>}>
          {assigned.length === 0 ? <Empty art="sessions">Nothing assigned yet.</Empty> : assigned.map((a) => (
            <Row key={a.id} href={`/mentor/sessions/${a.id}`}>
              <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-indigo-tint font-display text-[13px] font-bold text-indigo">{nm(a.student?.name).slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium leading-[1.3] text-ink-body">{nm(a.student?.name)}</p><p className="mt-0.5 text-[11.5px] leading-[1.35] text-ink-faint">{sessionTitle(a.type, a.focus)}</p></div>
              <span className="tnum flex-none text-right text-[11.5px] font-semibold leading-[1.3] text-ink-2">{fmtWhen(a.startsAt!).replace(/^\w+ /, "")}</span>
            </Row>
          ))}
        </Panel>
        {referral && (
          <Panel title="Referral bonus" flush={false}>
            <p className="text-[12.5px] leading-[1.55] text-ink-2">Refer <strong>{referral.every}</strong> students with your code and earn <strong>{referral.percent}%</strong> of the fees they paid.</p>
            <div className="mt-3.5"><Meter label={`${referral.students % referral.every} of ${referral.every} students toward your next bonus`} note={`${referral.toNext} to go`} pct={((referral.students % referral.every) / referral.every) * 100} tone="oxblood" /></div>
            <p className="tnum mt-3 text-[12px] text-ink-faint">{referral.students} student{referral.students === 1 ? "" : "s"} referred in total{referral.awards.length > 0 ? ` · ${referral.awards.length} bonus${referral.awards.length === 1 ? "" : "es"} earned (${formatPaise(referral.awards.reduce((n, a) => n + a.amountPaise, 0))})` : ""}</p>
            <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">A student counts once their purchase is past the refund window. Bonuses are approved by Samrudh and paid with your session pay.</p>
          </Panel>
        )}
      </Section>

      <Panel title="Leaderboard · last 30 days" flush={false}>
        {board.length === 0 || board.every((b) => b.mocks === 0) ? <Empty>No completed sessions yet this month. Be the first on the board.</Empty> : (
          <ol className="flex flex-col">
            {board.slice(0, 5).map((b) => <BoardRow key={b.mentorId} b={b} me={b.mentorId === mentor.id} />)}
            {(() => { const mine = board.find((b) => b.mentorId === mentor.id); return mine && mine.rank > 5 ? <><li aria-hidden className="py-1 text-center text-xs text-ink-faint">···</li><BoardRow b={mine} me /></> : null; })()}
          </ol>
        )}
        <p className="mt-2.5 text-[11.5px] text-ink-faint">Ranked by completed sessions, then average rating. Only names and counts are shown — never pay or tier.</p>
      </Panel>
    </PortalPage>
  );
}

function BoardRow({ b, me }: { b: Awaited<ReturnType<typeof mentorBoard>>[number]; me: boolean }) {
  return (
    <li className={`flex items-center gap-3 border-b border-line-soft py-2.5 text-[13px] last:border-b-0 ${me ? "font-semibold text-oxblood" : "text-ink-body"}`}>
      {b.rank <= 3 ? <Medal aria-label={`Rank ${b.rank}`} className={`size-5 flex-none ${["text-gold", "text-ink-faint", "text-[#a8643a]"][b.rank - 1]}`} /> : <span className="tnum w-5 flex-none text-center text-ink-faint">#{b.rank}</span>}
      <span className="min-w-0 flex-1 truncate">{b.name}{me ? " (you)" : ""}</span>
      <span className="tnum flex-none text-ink-2">{b.mocks} {b.mocks === 1 ? "session" : "sessions"}</span>
      <span className="tnum w-10 flex-none text-right text-ink-faint">{b.rating ? `★ ${b.rating.toFixed(1)}` : "—"}</span>
    </li>
  );
}

/** "What counts as a mock" is a Setting: completed PI, GD and WAT by default. */
export async function countMocks(mentorId: string, counts: string[]) {
  const types = [counts.includes("PI") && "MOCK_PI", counts.includes("GD") && "GD_BATCH"].filter(Boolean) as ("MOCK_PI" | "GD_BATCH")[];
  const [s, w] = await Promise.all([
    types.length ? db.session.count({ where: { mentorId, status: "COMPLETED", type: { in: types } } }) : 0,
    counts.includes("WAT") ? db.review.count({ where: { assignedMentorId: mentorId, status: "COMPLETED", kind: "WAT" } }) : 0,
  ]);
  return s + w;
}
