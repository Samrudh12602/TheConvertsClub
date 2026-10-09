import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, Check, Clock, Download, Eye, Lightbulb, Medal, Minus, Target, ThumbsUp, TriangleAlert, Users, X } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Meter, Panel, Section } from "@/components/portal/ui";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { ReviewExplorer, TimeBars, type MissGroup, type ReviewItem } from "@/components/mocks/result-parts";
import { takeaways, verdict, type InsightTone } from "@/lib/mock-insights";
import { MISS_LABEL, MIN_COHORT_FOR_PERCENTILE, mmss, paceSec, type MissKind } from "@/lib/mock-analysis";
import clsx from "clsx";
import { loadResult } from "@/server/mocks";
import { db } from "@/lib/db";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mock analysis" };

const pct = (b: { score: number; maxScore: number }) => (b.maxScore ? Math.max(0, Math.round((b.score / b.maxScore) * 100)) : 0);
const tone = (p: number) => (p >= 70 ? "green" : p >= 40 ? "amber" : "oxblood") as "green" | "amber" | "oxblood";

const num = (n: number) => n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

const INSIGHT: Record<InsightTone, { box: string; icon: React.ReactNode }> = {
  bad: { box: "bg-oxblood-tint text-oxblood", icon: <TriangleAlert className="size-5" aria-hidden /> },
  warn: { box: "bg-gold-tint text-gold-deep", icon: <Lightbulb className="size-5" aria-hidden /> },
  good: { box: "bg-teal-tint text-teal", icon: <ThumbsUp className="size-5" aria-hidden /> },
};

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
  const review: ReviewItem[] = a.results.map((x) => {
    const q = r.questions.find((y) => y.id === x.id)!;
    return { number: x.number, section: x.sectionName, topic: x.topic, stem: q.stem, context: q.context as ReviewItem["context"], options: q.options, correct: q.correct, choice: x.choice, outcome: x.outcome, timeSec: x.timeSec, marksEarned: x.marksEarned, explanation: q.explanation, cohortPct: q.cohortCorrectPct, miss: x.miss };
  });
  const groups: MissGroup[] = (Object.keys(MISS_LABEL) as MissKind[]).filter((k) => a.misses[k].length > 0).map((k) => ({ kind: k, title: MISS_LABEL[k].title, hint: MISS_LABEL[k].hint, numbers: a.misses[k], tone: ["rushed", "sink", "second-guess", "approach"].includes(k) ? "wrong" : "skip" }));
  const revisit = a.byTopic.filter((t) => t.b.correct < t.b.total).slice(0, 8);
  const strong = [...a.byTopic].reverse().filter((t) => t.b.correct === t.b.total && t.b.total > 0).slice(0, 5);
  const v = verdict(a.score, a.maxScore);
  const insights = takeaways(a, pace);
  const n = a.results.length;

  return (
    <PortalPage width="max-w-[1040px]">
      {/* 1. the score */}
      <section aria-label="Your score" className="relative overflow-hidden rounded-3xl bg-night text-surface shadow-lift ring-1 ring-white/10">
        <span aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-oxblood/50 blur-3xl" />
        <span aria-hidden className="absolute -bottom-24 left-10 size-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <p className="type-eyebrow text-gold">{r.mock.title} · your result</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <p className="tnum font-display text-[64px] font-bold leading-none sm:text-[80px]">{num(a.score)}<span className="ml-2 text-[24px] font-semibold text-dark-muted">/ {a.maxScore}</span></p>
            <div className="pb-2"><span className="inline-flex rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-gold ring-1 ring-white/15">{v.word}</span></div>
          </div>
          <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.65] text-dark-soft">{v.line}</p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-[520px]">
            {([["Right", a.correct, <Check key="c" className="size-4" aria-hidden />, "bg-teal"], ["Wrong", a.wrong, <X key="w" className="size-4" aria-hidden />, "bg-oxblood"], ["Blank", a.skipped, <Minus key="b" className="size-4" aria-hidden />, "bg-white/25"]] as const).map(([l, c, icon, bg]) => (
              <div key={l} className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10"><span className={clsx("flex size-7 items-center justify-center rounded-lg text-white", bg)}>{icon}</span><p className="tnum mt-2.5 font-display text-[28px] font-bold leading-none">{c}</p><p className="mt-1 text-[12px] text-dark-soft">{l}</p></div>
            ))}
          </div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/10 sm:max-w-[520px]" role="img" aria-label={`${a.correct} right, ${a.wrong} wrong, ${a.skipped} blank`}>
            <span className="bg-teal" style={{ width: `${(a.correct / n) * 100}%` }} /><span className="bg-oxblood" style={{ width: `${(a.wrong / n) * 100}%` }} /><span className="bg-white/25" style={{ width: `${(a.skipped / n) * 100}%` }} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-4">
            {([[Target, "Accuracy", `${a.accuracy}%`, `${a.correct} of ${a.attempted} attempted`], [Clock, "Time used", mmss(a.timeUsedSec), `of ${r.mock.durationMin}:00`], [ArrowRight, "Attempted", `${a.attempted} of ${n}`, `${a.attemptRate}% of the paper`], [Users, "Percentile", r.cohort.percentile !== null ? `${r.cohort.percentile}` : "Soon", r.cohort.percentile !== null ? `among ${r.cohort.attempts} students` : `needs ${MIN_COHORT_FOR_PERCENTILE} students (${r.cohort.attempts} so far)`]] as const).map(([Icon, l, val, note]) => (
              <div key={l} className="flex items-start gap-2.5"><Icon className="mt-1 size-4 flex-none text-gold" aria-hidden /><div><dt className="text-[11.5px] text-dark-muted">{l}</dt><dd className="tnum font-display text-[19px] font-bold leading-[1.2]">{val}</dd><p className="text-[11px] leading-[1.4] text-dark-muted">{note}</p></div></div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2.5"><ButtonAnchor href={`/api/mocks/${r.attemptId}/report`} download variant="onDark"><Download className="size-4" aria-hidden />Download the PDF report</ButtonAnchor><ButtonLink href="/student/mocks" variant="secondary" className="border-white/15 bg-white/10 text-surface hover:bg-white/15 hover:text-surface">All mocks</ButtonLink></div>
          {r.cohort.avgScore !== null && <p className="mt-3 text-[11.5px] text-dark-muted">Average score of other students on this mock: {r.cohort.avgScore}.</p>}
        </div>
      </section>

      {/* 2. what to take away */}
      <section aria-labelledby="takeaways">
        <h2 id="takeaways" className="font-display text-[19px] font-bold text-ink">What to take away</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">The few things that would move your score the most, in order.</p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2">
          {insights.map((x, i) => (
            <li key={x.title} className="flex gap-3.5 rounded-2xl border border-line bg-card p-4 shadow-card">
              <span className={clsx("flex size-10 flex-none items-center justify-center rounded-xl", INSIGHT[x.tone].box)}>{INSIGHT[x.tone].icon}</span>
              <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{x.tone === "good" ? "Keep doing" : `Fix ${i + 1}`}</p><h3 className="mt-0.5 text-[14.5px] font-bold leading-[1.3] text-ink">{x.title}</h3><p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-muted">{x.body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. section by section */}
      <section aria-labelledby="by-section">
        <h2 id="by-section" className="font-display text-[19px] font-bold text-ink">Section by section</h2>
        <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          {a.bySection.map((s) => {
            const t = s.b.total || 1;
            const perQ = s.b.total ? Math.round(s.b.timeSec / s.b.total) : 0;
            return (
              <div key={s.name} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                <p className="text-[13px] font-semibold text-ink">{s.name}</p>
                <p className="tnum mt-1.5 font-display text-[30px] font-bold leading-none text-ink">{num(s.b.score)}<span className="ml-1 text-[14px] font-semibold text-ink-faint">/ {s.b.maxScore}</span></p>
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-line-soft" role="img" aria-label={`${s.b.correct} right, ${s.b.wrong} wrong, ${s.b.skipped} blank`}><span className="bg-teal" style={{ width: `${(s.b.correct / t) * 100}%` }} /><span className="bg-oxblood" style={{ width: `${(s.b.wrong / t) * 100}%` }} /></div>
                <p className="tnum mt-2 text-[12px] text-ink-2"><b className="text-teal">{s.b.correct}</b> right · <b className="text-oxblood">{s.b.wrong}</b> wrong · <b>{s.b.skipped}</b> blank</p>
                <p className="mt-1.5 text-[11.5px] text-ink-faint">{perQ}s per question · even pace is {Math.round(pace)}s</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. where to work, and time */}
      <Section cols={460}>
        <Panel title="Where to work" flush={false}>
          <p className="mb-3 text-[12px] text-ink-faint">Skill areas, weakest first.</p>
          <ul className="flex flex-col gap-3">
            {a.byArea.slice(0, 7).map((t) => (
              <li key={t.name}><div className="flex items-baseline justify-between gap-2 text-[12.5px]"><span className="min-w-0 truncate font-medium text-ink-2">{t.name}</span><span className="tnum flex-none font-semibold text-ink">{t.b.correct}/{t.b.total}</span></div><div className="mt-1"><Meter pct={pct(t.b)} tone={tone(pct(t.b))} /></div></li>
            ))}
          </ul>
          {revisit.length > 0 && <div className="mt-4 rounded-xl bg-surface p-3"><p className="type-label text-ink-faint">Topics to revisit</p><p className="mt-1.5 flex flex-wrap gap-1.5">{revisit.map((t) => <span key={t.name} className="rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] font-medium text-ink-2">{t.name}</span>)}</p></div>}
          {strong.length > 0 && <p className="mt-3 flex items-start gap-2 text-[12px] leading-[1.55] text-ink-muted"><Medal aria-hidden className="mt-0.5 size-4 flex-none text-teal" />Fully right on: {strong.map((t) => t.name).join(", ")}.</p>}
        </Panel>
        <Panel title="Where your time went" flush={false}>
          <TimeBars items={a.results.map((x) => ({ number: x.number, timeSec: x.timeSec, outcome: x.outcome }))} paceSec={pace} />
          <div className="mt-2 flex flex-wrap gap-4 text-[11.5px] text-ink-muted"><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-teal" />right</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-oxblood" />wrong</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-line-strong" />blank</span></div>
          {r.tabSwitches > 0 && <p className="mt-3 flex items-start gap-2 rounded-lg bg-gold-tint p-3 text-[12px] leading-[1.55] text-gold-deep"><Eye aria-hidden className="mt-0.5 size-4 flex-none" />You left the exam tab {r.tabSwitches} time{r.tabSwitches === 1 ? "" : "s"}. On the real exam that is not possible, so try to stay on the page next time.</p>}
        </Panel>
      </Section>

      {/* 4. the paper, why, and every solution */}
      <ReviewExplorer items={review} groups={groups} />

      <p className="flex items-start gap-2 text-[11.5px] text-ink-faint"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 flex-none" />These are practice papers written by The Convert Club. Marks and percentiles are for practice and are not a prediction of the real exam result.</p>
    </PortalPage>
  );
}
