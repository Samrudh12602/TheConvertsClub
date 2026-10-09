import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { DateBadge, Empty, Panel, Row, Section } from "@/components/portal/ui";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { fmtDayNum, fmtMon, fmtTime, fmtWhen, relative } from "@/lib/format";
import { SCORE_TEXT, scoreTone, sessionTitle } from "@/lib/labels";
import { ProgressRing } from "@/components/ui/charts";
import { AddToCalendar } from "@/components/student/add-to-calendar";
import { WelcomeTour } from "@/components/student/welcome-tour";
import { CREDIT_KIND_ORDER, CREDIT_LABEL } from "@/lib/labels";
import { getCreditSummary } from "@/server/credits";
import { PortalBuy } from "@/components/student/portal-buy";
import { getProduct } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";
import { priceView } from "@/lib/pricing";
import { isSinglePiStudent } from "@/server/eligibility";
import { paymentsConfigured } from "@/server/razorpay";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
const firstSentence = (s?: string | null) => (s ?? "").split(/(?<=[.!?])\s/)[0];

export default async function StudentDashboard() {
  const user = await requireStudent();
  if (!user.studentProfile?.onboardedAt && (user.studentProfile?.onboardingStep ?? 0) === 0) {
    const bought = await db.enrollment.count({ where: { userId: user.id } });
    if (bought) redirect("/student/onboarding");
  }
  const now = new Date();
  const [upcoming, feedbackRows, enrolledCount, creditSummary] = await Promise.all([
    db.session.findMany({ where: { studentId: user.id, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: new Date(now.getTime() - 3_600_000) } }, orderBy: { startsAt: "asc" }, take: 5, include: { mentor: { include: { user: { select: { name: true } } } } } }),
    db.feedback.findMany({ where: { session: { studentId: user.id } }, orderBy: { submittedAt: "desc" }, take: 3, include: { session: true } }),
    db.enrollment.count({ where: { userId: user.id, status: "ACTIVE" } }),
    getCreditSummary(db, user.id),
  ]);
  const bookable = (["PI", "STRATEGY", "GUIDANCE", "PI_DIRECT", "STRATEGY_DIRECT", "GD"] as const).reduce((n, k) => n + (creditSummary[k]?.available ?? 0), 0);
  // A student whose only purchase is the single Mock PI is the one most worth showing the Panel PI to.
  const [promoPanel, panelProduct] = await Promise.all([isSinglePiStudent(db, user.id), getProduct("panel-pi")]);
  const rings = CREDIT_KIND_ORDER.filter((k) => (creditSummary[k]?.granted ?? 0) > 0).map((k) => ({ kind: k, ...creditSummary[k]! }));
  const next = upcoming[0];
  const rest = upcoming.slice(1, 5);
  const mentorName = (m: (typeof upcoming)[number]["mentor"]) => (m ? `${m.user.name?.replace(/\s*\(demo\)/, "")}${m.college ? `, ${m.college}${m.batchYear ? ` '${String(m.batchYear).slice(2)}` : ""}` : ""}` : "your mentor");
  const prep = (feedbackRows[0]?.questionsToPrepare ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 2);

  return (
    <PortalPage>
      {enrolledCount > 0 && <WelcomeTour name={user.name?.split(" ")[0] ?? "there"} />}
      {next ? (
        <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-night p-5 shadow-lift ring-1 ring-white/5">
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="type-eyebrow text-dark-muted">Next up · {relative(next.startsAt!)}</p>
            <h2 className="mt-2 font-display text-[25px] font-bold leading-[1.2] text-surface">{sessionTitle(next.type, next.focus)}</h2>
            <p className="mt-[7px] text-[13px] leading-normal text-dark-soft">{fmtWhen(next.startsAt!)} IST · with {mentorName(next.mentor)}</p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {next.status === "CONFIRMED" && next.meetingUrl && (
                <a href={next.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold leading-none text-white shadow-glow no-underline transition hover:brightness-110 hover:text-white hover:no-underline">Join meeting</a>
              )}
              {next.status === "REQUESTED" && <span className="inline-flex min-h-11 items-center rounded-lg bg-dark-active px-4 text-[13px] font-semibold text-dark-text">Awaiting confirmation</span>}
              <Link href={`/student/sessions/${next.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-[#3A332B] px-3.5 text-[13px] font-medium leading-none text-dark-text no-underline hover:border-dark-muted hover:text-dark-text hover:no-underline">Details &amp; reschedule</Link>
            </div>
          </div>
          {next.status === "CONFIRMED" && <div className="basis-full"><AddToCalendar tone="dark" id={next.id} title={sessionTitle(next.type, next.focus)} startsAtIso={next.startsAt!.toISOString()} details={next.meetingUrl ? `Join: ${next.meetingUrl}` : "The Convert Club session"} /></div>}
          <div className="flex-[0_1_240px] border-dark-line md:border-l md:pl-5">
            <p className="type-eyebrow text-dark-muted">Prepare</p>
            {[...prep, "Keep your resume open in another tab."].slice(0, 3).map((p) => <p key={p} className="mt-2 text-[12.5px] leading-normal text-[#D5CEC5]">{p}</p>)}
          </div>
        </div>
      ) : enrolledCount === 0 ? (
        <div className="rounded-2xl bg-night p-5 shadow-lift ring-1 ring-white/5">
          <p className="type-eyebrow text-dark-muted">Not enrolled yet</p>
          <h2 className="mt-2 font-display text-[22px] font-bold leading-[1.2] text-surface">Pick a plan to get started</h2>
          <p className="mt-2 max-w-[52ch] text-[13px] leading-normal text-dark-soft">Mock PIs, GDs, WAT and SOP review — credits show up here the moment you enrol.</p>
          <ButtonLink href="/packages" variant="onDark" className="mt-3.5">See packages</ButtonLink>
        </div>
      ) : (
        <div className="rounded-2xl bg-night p-5 shadow-lift ring-1 ring-white/5">
          <p className="type-eyebrow text-dark-muted">Nothing booked</p>
          <h2 className="mt-2 font-display text-[22px] font-bold leading-[1.2] text-surface">Book your next session</h2>
          <p className="mt-2 max-w-[52ch] text-[13px] leading-normal text-dark-soft">{bookable > 0 ? `You have ${bookable} unused session credit${bookable === 1 ? "" : "s"} waiting. Pick a type, a focus and a time. Slots are released by mentors each Sunday.` : "Pick a type, a focus and a time. Slots are released by mentors each Sunday."}</p>
          <ButtonLink href="/student/book" variant="onDark" className="mt-3.5">Book a session</ButtonLink>
        </div>
      )}

      {promoPanel && panelProduct && (
        <section className="relative overflow-hidden rounded-2xl bg-night p-5 text-surface shadow-lift ring-1 ring-white/5" aria-label="Panel PI">
          <span aria-hidden className="absolute -right-12 -top-12 size-44 rounded-full bg-oxblood/40 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="min-w-[240px] flex-[1_1_320px]">
              <p className="type-eyebrow text-gold">Next level</p>
              <h2 className="mt-2 font-display text-[21px] font-bold leading-[1.2]">After your mock, face a real panel</h2>
              <p className="mt-2 max-w-[56ch] text-[13px] leading-[1.65] text-dark-soft">One mock tells you how you answer. A Panel PI shows how you hold up in front of three interviewers who cross-question each other&apos;s points, with a live debrief inside the same hour. It&apos;s the closest thing to the real interview.</p>
              <p className="mt-2 text-[12px] text-dark-muted">Once booked it can&apos;t be cancelled or moved, so pick a time you&apos;re sure of.</p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <p className="tnum font-display text-[30px] font-bold leading-none">{formatPaise(priceView(panelProduct).payablePaise)}{priceView(panelProduct).strikePaise ? <span className="ml-2 text-sm font-medium text-dark-muted line-through">{formatPaise(priceView(panelProduct).strikePaise!)}</span> : null}</p>
              {paymentsConfigured() && <PortalBuy slug="panel-pi" me={{ name: user.name?.replace(/\s*\(demo\)/, "") ?? "", email: user.email, phone: user.phone ?? "" }} label="Get a Panel PI" variant="onDark" />}
            </div>
          </div>
        </section>
      )}

      {rings.length > 0 && (
        <Panel title="Your credits" action={<Link href="/student/book" className="text-xs font-semibold">Book a session</Link>} flush={false}>
          <div className="flex flex-wrap gap-x-7 gap-y-5">
            {rings.map((r, i) => (
              <ProgressRing key={r.kind} value={r.available} max={r.granted} label={r.available} sub={`${CREDIT_LABEL[r.kind]}${r.reserved > 0 ? ` · ${r.reserved} held` : ""}`} tone={(["oxblood", "teal", "gold", "indigo"] as const)[i % 4]} size={78} stroke={7} />
            ))}
          </div>
        </Panel>
      )}

      <Section cols={260}>
        <Panel title="Upcoming" action={<Link href="/student/sessions" className="text-xs font-semibold">All sessions</Link>}>
          {rest.length === 0 ? <Empty art="calendar">No other sessions booked.</Empty> : rest.map((u) => (
            <Row key={u.id} href={`/student/sessions/${u.id}`}>
              <DateBadge day={fmtDayNum(u.startsAt!)} mon={fmtMon(u.startsAt!)} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-[1.3] text-ink-body">{sessionTitle(u.type, u.focus)}</p>
                <p className="mt-0.5 text-[11.5px] leading-[1.35] text-ink-faint">{fmtTime(u.startsAt!)}{u.status === "REQUESTED" ? " · awaiting confirmation" : ""}</p>
              </div>
            </Row>
          ))}
        </Panel>
        <Panel title="New feedback">
          {feedbackRows.length === 0 ? <Empty>Feedback from your sessions shows up here.</Empty> : feedbackRows.map((f) => (
            <Row key={f.id} href={`/student/sessions/${f.sessionId}`} className="block">
              <div className="flex items-baseline justify-between gap-2.5">
                <p className="text-[13px] font-medium leading-[1.3] text-ink-body">{f.session ? sessionTitle(f.session.type, f.session.focus) : "Session"}</p>
                <p className={`tnum font-display text-sm font-bold leading-none ${SCORE_TEXT[scoreTone(f.overall)]}`}>{f.overall.toFixed(1)}</p>
              </div>
              <p className="mt-1 text-[11.5px] leading-[1.4] text-ink-faint">{firstSentence(f.strengths)} {firstSentence(f.weaknesses)}</p>
            </Row>
          ))}
        </Panel>
      </Section>
    </PortalPage>
  );
}
