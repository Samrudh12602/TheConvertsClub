import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Flash, Kpi, KpiGrid, Meter, Panel, Row, Section } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtWhen, relative } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { getSettings } from "@/lib/settings-db";
import { nextThreshold } from "@/server/payroll";
import { checklistProgress, mentorChecklist } from "@/lib/mentor-checklist";
import { mentorBoard } from "@/server/leaderboard";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function MentorDashboard() {
  const { user, mentor } = await requireMentor();
  const settings = await getSettings();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const [openWeek, bookedWeek, assigned, accrued, rules, awards, ratings, mocks, board, futureOpenSlots] = await Promise.all([
    db.slot.count({ where: { mentorId: mentor.id, startsAt: { gte: now, lt: weekEnd }, status: { in: ["OPEN", "HELD"] } } }),
    db.slot.count({ where: { mentorId: mentor.id, startsAt: { gte: now, lt: weekEnd }, status: "BOOKED" } }),
    db.session.findMany({ where: { mentorId: mentor.id, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: new Date(now.getTime() - 3_600_000) } }, orderBy: { startsAt: "asc" }, take: 6, include: { student: { select: { name: true, studentProfile: true } } } }),
    db.payoutAccrual.aggregate({ where: { mentorId: mentor.id, status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true } }),
    db.bonusRule.findMany({ where: { tier: mentor.tier, active: true }, orderBy: { threshold: "asc" } }),
    db.bonusAward.findMany({ where: { mentorId: mentor.id } }),
    db.sessionRating.aggregate({ where: { session: { mentorId: mentor.id } }, _avg: { rating: true }, _count: true }),
    countMocks(mentor.id, settings.mockCounts),
    mentorBoard(user.isDemo),
    db.slot.count({ where: { mentorId: mentor.id, status: "OPEN", startsAt: { gt: now } } }),
  ]);
  // The owner's own mentor mode earns no pay and isn't listed publicly, so only 'publish your hours' applies.
  const checklist = mentorChecklist({ bio: mentor.bio, photoKey: mentor.photoKey, photoUrl: mentor.photoUrl, payoutEncrypted: mentor.payoutEncrypted, futureOpenSlots }).filter((i) => !mentor.isAdminMentor || i.key === "availability");
  const progress = checklistProgress(checklist);
  const ruleLite = rules.map((r) => ({ id: r.id, tier: r.tier, threshold: r.threshold, amountPaise: r.amountPaise, active: r.active }));
  const next = nextThreshold(mentor.tier, mocks, ruleLite);
  const awarded = new Set(awards.map((a) => a.ruleId));
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
        <Kpi label="This week" value={`${bookedWeek} / ${bookedWeek + openWeek}`} note={`${openWeek} slot${openWeek === 1 ? "" : "s"} still open`} />
        <Kpi label="Mocks, season" value={mocks} note={next ? `${next.threshold - mocks} away from the ${formatPaise(next.amountPaise)} bonus` : "All bonus tiers reached"} noteTone="oxblood" />
        <Kpi label="Accrued" value={formatPaise(accrued._sum.amountPaise ?? 0)} note="Awaiting payout" />
        <Kpi label="Avg rating" value={ratings._avg.rating ? ratings._avg.rating.toFixed(1) : "—"} note={`Across ${ratings._count} rated sessions`} noteTone="green" />
      </KpiGrid>

      {first ? (
        <div className="flex flex-wrap items-center gap-[18px] rounded-xl bg-ink p-5">
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
      ) : <Panel><Empty>No sessions assigned right now.</Empty></Panel>}

      <Section cols={280}>
        <Panel title="Assigned to you" action={<Link href="/mentor/sessions" className="text-xs font-semibold">All</Link>}>
          {assigned.length === 0 ? <Empty>Nothing assigned yet.</Empty> : assigned.map((a) => (
            <Row key={a.id} href={`/mentor/sessions/${a.id}`}>
              <span className="tnum w-[70px] flex-none text-[11.5px] font-semibold leading-[1.3] text-ink-faint">{fmtWhen(a.startsAt!).replace(/^\w+ /, "")}</span>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium leading-[1.3] text-ink-body">{nm(a.student?.name)}</p><p className="mt-0.5 text-[11.5px] leading-[1.35] text-ink-faint">{sessionTitle(a.type, a.focus)}</p></div>
            </Row>
          ))}
        </Panel>
        <Panel title="Bonus progress · season" flush={false}>
          <div className="flex flex-col gap-[13px]">
            {rules.map((r) => {
              const done = awarded.has(r.id) || mocks >= r.threshold;
              return <Meter key={r.id} label={`${r.threshold} mocks · ${formatPaise(r.amountPaise)}`} note={done ? "Awarded" : `${mocks} of ${r.threshold}`} pct={Math.min(100, (mocks / r.threshold) * 100)} tone={done ? "green" : "oxblood"} />;
            })}
            {rules.length === 0 && <Empty>No bonus tiers configured.</Empty>}
          </div>
        </Panel>
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
      <span className="tnum w-6 flex-none text-ink-faint">#{b.rank}</span>
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
