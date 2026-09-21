import Link from "next/link";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Meter, Panel, Row, Section } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtWhen, relative } from "@/lib/format";
import { sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { getSettings } from "@/lib/settings-db";
import { nextThreshold } from "@/server/payroll";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function MentorDashboard() {
  const { mentor } = await requireMentor();
  const settings = await getSettings();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const [openWeek, bookedWeek, assigned, accrued, rules, awards, ratings, mocks] = await Promise.all([
    db.slot.count({ where: { mentorId: mentor.id, startsAt: { gte: now, lt: weekEnd }, status: { in: ["OPEN", "HELD"] } } }),
    db.slot.count({ where: { mentorId: mentor.id, startsAt: { gte: now, lt: weekEnd }, status: "BOOKED" } }),
    db.session.findMany({ where: { mentorId: mentor.id, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: new Date(now.getTime() - 3_600_000) } }, orderBy: { startsAt: "asc" }, take: 6, include: { student: { select: { name: true, studentProfile: true } } } }),
    db.payoutAccrual.aggregate({ where: { mentorId: mentor.id, status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true } }),
    db.bonusRule.findMany({ where: { tier: mentor.tier, active: true }, orderBy: { threshold: "asc" } }),
    db.bonusAward.findMany({ where: { mentorId: mentor.id } }),
    db.sessionRating.aggregate({ where: { session: { mentorId: mentor.id } }, _avg: { rating: true }, _count: true }),
    countMocks(mentor.id, settings.mockCounts),
  ]);
  const ruleLite = rules.map((r) => ({ id: r.id, tier: r.tier, threshold: r.threshold, amountPaise: r.amountPaise, active: r.active }));
  const next = nextThreshold(mentor.tier, mocks, ruleLite);
  const awarded = new Set(awards.map((a) => a.ruleId));
  const first = assigned[0];
  const nm = (n?: string | null) => n?.replace(/\s*\(demo\)/, "") ?? "Student";

  return (
    <PortalPage>
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
    </PortalPage>
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
