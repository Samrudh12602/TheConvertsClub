import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Download, Eye, Gauge, Medal, Target, TrendingDown, Users } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Kpi, KpiGrid, Meter, Panel, Section } from "@/components/portal/ui";
import { ProgressRing } from "@/components/ui/charts";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { ReviewList, TimeBars, type ReviewItem } from "@/components/mocks/result-parts";
import { MISS_LABEL, MIN_COHORT_FOR_PERCENTILE, mmss, paceSec, type MissKind } from "@/lib/mock-analysis";
import { loadResult } from "@/server/mocks";
import { db } from "@/lib/db";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mock analysis" };

const pct = (b: { score: number; maxScore: number }) => (b.maxScore ? Math.max(0, Math.round((b.score / b.maxScore) * 100)) : 0);
const tone = (p: number) => (p >= 70 ? "green" : p >= 40 ? "amber" : "oxblood") as "green" | "amber" | "oxblood";

export default async function MockResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireStudent();
  const { attemptId } = await params;
  const r = await loadResult(user.id, attemptId);
  if (!r) {
    const att = await db.mockAttempt.findUnique({ where: { id: attemptId }, select: { userId: true, mock: { select: { slug: true } } } });
    if (att && att.userId === user.id) redirect(`/exam/${att.mock.slug}`); // still in progress
    notFound();
  }
  const a = r.analysis;
  const pace = paceSec(r.mock.durationMin * 60, a.results.length);
  const missKinds = (Object.keys(MISS_LABEL) as MissKind[]).filter((k) => a.misses[k].length > 0);
  const review: ReviewItem[] = a.results.map((x) => {
    const q = r.questions.find((y) => y.id === x.id)!;
    return { number: x.number, section: x.sectionName, topic: x.topic, stem: q.stem, context: q.context as ReviewItem["context"], options: q.options, correct: q.correct, choice: x.choice, outcome: x.outcome, timeSec: x.timeSec, marksEarned: x.marksEarned, explanation: q.explanation, cohortPct: q.cohortCorrectPct, miss: x.miss };
  });
  const revisit = a.byTopic.filter((t) => t.b.correct < t.b.total).slice(0, 8);
  const strong = [...a.byTopic].reverse().filter((t) => t.b.correct === t.b.total && t.b.total > 0).slice(0, 5);
  const scorePct = a.maxScore ? Math.max(0, Math.round((a.score / a.maxScore) * 100)) : 0;

  return (
    <PortalPage width="max-w-[1040px]">
      {/* headline */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <div className="h-1.5 bg-gradient-to-r from-oxblood via-gold to-teal" />
        <div className="flex flex-wrap items-center gap-6 p-5">
          <ProgressRing value={Math.max(0, a.score)} max={a.maxScore} label={a.score.toFixed(2).replace(/\.00$/, "")} sub={`of ${a.maxScore}`} tone={scorePct >= 70 ? "teal" : scorePct >= 40 ? "gold" : "oxblood"} size={116} stroke={10} />
          <div className="min-w-[240px] flex-1">
            <p className="type-eyebrow text-oxblood">{r.mock.title}</p>
            <h2 className="mt-1.5 font-display text-[23px] font-bold leading-[1.2] text-ink">You scored {a.score.toFixed(2).replace(/\.00$/, "")} out of {a.maxScore}</h2>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-muted">{a.correct} right, {a.wrong} wrong, {a.skipped} left blank. {a.negativeLost > 0 ? `Wrong answers cost you ${a.negativeLost} marks.` : "No marks lost to negative marking."}</p>
            <div className="mt-3 flex flex-wrap gap-2"><ButtonAnchor href={`/api/mocks/${r.attemptId}/report`} download><Download className="size-4" aria-hidden />Download the detailed PDF</ButtonAnchor><ButtonLink href="/student/mocks" variant="secondary">All mocks</ButtonLink></div>
          </div>
        </div>
      </div>

      <KpiGrid>
        <Kpi label="Accuracy" value={`${a.accuracy}%`} note={`${a.correct} of ${a.attempted} attempted`} icon={<Target />} accent="teal" />
        <Kpi label="Attempted" value={`${a.attempted} / ${a.results.length}`} note={`${a.attemptRate}% of the paper`} icon={<Gauge />} accent="indigo" />
        <Kpi label="Time used" value={mmss(a.timeUsedSec)} note={`of ${r.mock.durationMin}:00`} icon={<Clock />} accent="gold" />
        <Kpi label={r.cohort.percentile !== null ? "Percentile" : "Percentile"} value={r.cohort.percentile !== null ? `${r.cohort.percentile}` : "Soon"} note={r.cohort.percentile !== null ? `Among ${r.cohort.attempts} students` : `Shown once ${MIN_COHORT_FOR_PERCENTILE} students have taken it (${r.cohort.attempts} so far)`} noteTone={r.cohort.percentile !== null ? "green" : "muted"} icon={<Users />} accent="oxblood" />
      </KpiGrid>
      {r.cohort.avgScore !== null && <p className="-mt-1 text-[12px] text-ink-faint">The average score of other students on this mock is {r.cohort.avgScore}.</p>}

      {/* what went wrong */}
      <Panel title="What went wrong" flush={false}>
        {a.wrong + a.skipped === 0 ? <p className="text-[13px] text-ink-muted">Nothing: every question was answered correctly. That is a full-marks paper.</p> : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3.5 text-[13px] leading-[1.6] text-ink-2">
              <TrendingDown aria-hidden className="size-5 flex-none text-oxblood" />
              <p className="min-w-[220px] flex-1">You lost <b>{a.negativeLost.toFixed(2).replace(/\.00$/, "")} marks</b> to wrong answers and left <b>{a.skipped}</b> questions blank.{a.avoidableNegative > 0 && <> About <b>{a.avoidableNegative} of those marks</b> went on answers you rushed or changed your mind about: skipping those would have been safer.</>}</p>
            </div>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              {missKinds.map((k) => (
                <div key={k} className="rounded-xl border border-line bg-card p-3.5">
                  <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold text-ink">{MISS_LABEL[k].title}</p><span className="tnum rounded-full bg-oxblood-tint px-2.5 py-1 text-[11px] font-bold text-oxblood">{a.misses[k].length}</span></div>
                  <p className="mt-1 text-[12px] leading-[1.55] text-ink-muted">{MISS_LABEL[k].hint}</p>
                  <p className="mt-2 text-[11.5px] text-ink-faint">Questions: {a.misses[k].join(", ")}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-[1.55] text-ink-faint">These labels are inferred from how long you spent and how often you changed an answer. They are a guide to where to look, not a verdict.</p>
          </>
        )}
      </Panel>

      <Section cols={460}>
        <Panel title="Section by section" flush={false}>
          <div className="flex flex-col gap-4">
            {a.bySection.map((s) => (
              <div key={s.name}>
                <div className="flex items-baseline justify-between gap-2 text-[13px]"><span className="font-semibold text-ink">{s.name}</span><span className="tnum font-semibold text-ink">{s.b.score.toFixed(2).replace(/\.00$/, "")} / {s.b.maxScore}</span></div>
                <div className="mt-1.5"><Meter pct={pct(s.b)} tone={tone(pct(s.b))} /></div>
                <p className="tnum mt-1.5 text-[11.5px] text-ink-faint">{s.b.correct} right · {s.b.wrong} wrong · {s.b.skipped} blank · {mmss(s.b.timeSec)} spent ({s.b.total ? Math.round(s.b.timeSec / s.b.total) : 0}s per question)</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Where to work" flush={false}>
          <p className="mb-3 text-[12px] text-ink-faint">Skill areas, weakest first.</p>
          <ul className="flex flex-col gap-3">
            {a.byArea.map((t) => (
              <li key={t.name}><div className="flex items-baseline justify-between gap-2 text-[12.5px]"><span className="min-w-0 truncate font-medium text-ink-2">{t.name}</span><span className="tnum flex-none font-semibold text-ink">{t.b.correct}/{t.b.total} right</span></div><div className="mt-1"><Meter pct={pct(t.b)} tone={tone(pct(t.b))} /></div></li>
            ))}
          </ul>
          {revisit.length > 0 && <div className="mt-4 rounded-xl bg-surface p-3"><p className="type-label text-ink-faint">Topics to revisit</p><p className="mt-1.5 text-[12.5px] leading-[1.7] text-ink-2">{revisit.map((t) => t.name).join(" · ")}</p></div>}
          {strong.length > 0 && <p className="mt-3 flex items-start gap-2 text-[12px] leading-[1.55] text-ink-muted"><Medal aria-hidden className="mt-0.5 size-4 flex-none text-teal" />Fully right on: {strong.map((t) => t.name).join(", ")}.</p>}
        </Panel>
      </Section>

      <Panel title="Where your time went" flush={false}>
        <TimeBars items={a.results.map((x) => ({ number: x.number, timeSec: x.timeSec, outcome: x.outcome }))} paceSec={pace} />
        <div className="mt-2 flex flex-wrap gap-4 text-[11.5px] text-ink-muted"><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-teal" />right</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-oxblood" />wrong</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-line-strong" />blank</span></div>
        {r.tabSwitches > 0 && <p className="mt-3 flex items-start gap-2 rounded-lg bg-gold-tint p-3 text-[12px] leading-[1.55] text-gold-deep"><Eye aria-hidden className="mt-0.5 size-4 flex-none" />You left the exam tab {r.tabSwitches} time{r.tabSwitches === 1 ? "" : "s"}. On the real exam that is not possible, so try to stay on the page next time.</p>}
      </Panel>

      <section aria-label="Question review" className="flex flex-col gap-3">
        <div className="flex items-center gap-2"><CheckCircle2 aria-hidden className="size-5 text-teal" /><h2 className="font-display text-[18px] font-bold text-ink">Every question, with the solution</h2></div>
        <ReviewList items={review} />
      </section>
      <p className="flex items-start gap-2 text-[11.5px] text-ink-faint"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 flex-none" />These are practice papers written by The Convert Club. Marks and percentiles are for practice and are not a prediction of the real exam result.</p>
    </PortalPage>
  );
}
