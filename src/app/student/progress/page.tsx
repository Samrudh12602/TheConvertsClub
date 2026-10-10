import { guardGdpi } from "@/server/gdpi-guard";
import { CalendarPlus, Flame, Target, TrendingUp, Trophy } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Insight, Kpi, KpiGrid, Meter } from "@/components/portal/ui";
import { ScoreLine } from "@/components/ui/charts";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { FOCUS_LABEL, RUBRIC, scoreTone } from "@/lib/labels";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

/** Target readiness score used for the reference bar. */
const TARGET = 8.5;

export default async function ProgressPage() {
  await guardGdpi("progress");
  const user = await requireStudent();
  const fb = await db.feedback.findMany({
    where: { OR: [{ session: { studentId: user.id } }, { review: { studentId: user.id } }] },
    orderBy: { submittedAt: "asc" },
    include: { session: { select: { type: true, focus: true } }, review: { select: { kind: true } } },
  });
  const done = await db.session.findMany({ where: { studentId: user.id, status: "COMPLETED", type: { in: ["MOCK_PI", "PI_DIRECT", "PANEL_PI"] } }, select: { focus: true } });

  if (fb.length === 0) return <PortalPage width="max-w-[880px]"><Empty art="chart">Your progress appears after your first piece of feedback.</Empty></PortalPage>;

  let pi = 0;
  const bars = fb.map((f) => ({ label: f.session?.type === "MOCK_PI" || f.session?.type === "PI_DIRECT" || f.session?.type === "PANEL_PI" ? `Mock ${++pi}` : f.session?.type === "GD_BATCH" ? "GD" : f.review ? f.review.kind === "WAT" ? "WAT" : "SOP" : "Call", score: f.overall }));

  const avg = (rows: typeof fb, r: string) => { const v = rows.map((x) => (x.scores as Record<string, number>)[r]).filter((n) => typeof n === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const half = Math.floor(fb.length / 2);
  const first = fb.slice(0, Math.max(1, half)), last = fb.slice(-Math.max(1, half));
  const deltas = RUBRIC.map((r) => ({ r, d: (avg(last, r) ?? 0) - (avg(first, r) ?? 0), now: avg(fb, r) ?? 0 }));
  const up = fb.length >= 2 ? [...deltas].sort((a, b) => b.d - a.d)[0] : null;
  const stuck = [...deltas].sort((a, b) => a.now - b.now)[0];
  const flagged = fb.filter((f) => ((f.scores as Record<string, number>)[stuck.r] ?? 10) < 6).length;
  const tried = new Set(done.map((d) => d.focus));
  const untested = (Object.keys(FOCUS_LABEL) as (keyof typeof FOCUS_LABEL)[]).filter((k) => !tried.has(k));

  const overall = fb.reduce((n, f) => n + f.overall, 0) / fb.length;
  const best = Math.max(...fb.map((f) => f.overall));
  const trend = fb.length >= 2 ? fb[fb.length - 1].overall - fb[0].overall : null;
  const skills = deltas.map((d) => ({ ...d })).sort((a, b) => b.now - a.now);

  return (
    <PortalPage width="max-w-[920px]">
      <KpiGrid>
        <Kpi label="Average score" value={overall.toFixed(1)} note={`Across ${fb.length} feedback`} icon={<Target />} accent="indigo" />
        <Kpi label="Best score" value={best.toFixed(1)} note="Your high point" noteTone="green" icon={<Trophy />} accent="gold" />
        <Kpi label="Since your first" value={trend === null ? "\u2014" : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}`} note={trend === null ? "Needs two scores" : trend >= 0 ? "Heading the right way" : "Dipped, keep going"} noteTone={trend !== null && trend < 0 ? "oxblood" : "green"} icon={<TrendingUp />} />
        <Kpi label="Mock PIs done" value={done.length} note={`${untested.length} focus area${untested.length === 1 ? "" : "s"} untried`} icon={<Flame />} accent="oxblood" />
      </KpiGrid>
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-2"><h2 className="text-[14px] font-bold leading-none text-ink">Readiness over time</h2><span className="text-[11.5px] text-ink-faint">Score out of 10</span></div>
        <div className="mt-3"><ScoreLine points={bars.slice(-8)} target={TARGET} /></div>
      </div>
      <div className="grid gap-3.5 md:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <h2 className="text-[14px] font-bold leading-none text-ink">Your skills, strongest first</h2>
          <div className="mt-4 flex flex-col gap-3.5">
            {skills.map((k) => <Meter key={k.r} pct={k.now * 10} tone={scoreTone(k.now)} label={k.r} note={`${k.now.toFixed(1)}${fb.length >= 2 && Math.abs(k.d) >= 0.1 ? ` · ${k.d > 0 ? "+" : ""}${k.d.toFixed(1)}` : ""}`} />)}
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          {up && up.d > 0.2 && <Insight title="Trending up" tone="green" icon={<TrendingUp />}><p>{up.r} has moved {up.d.toFixed(1)} points since your first sessions. Keep doing what you&apos;re doing there.</p></Insight>}
          <Insight title="Still stuck" tone="oxblood" icon={<Target />}><p>{stuck.r} averages {stuck.now.toFixed(1)}{flagged > 1 ? ` and has been below 6 in ${flagged} of ${fb.length} pieces of feedback` : ""}. Book a session focused on it before your next call.</p></Insight>
          <Insight title="Untested" tone="amber" icon={<Flame />}><p>{untested.length ? `No mock has covered ${untested.slice(0, 3).map((k) => FOCUS_LABEL[k].toLowerCase()).join(", ")} yet. Book one next.` : "You've covered every focus area at least once."}</p></Insight>
          <ButtonLink href="/student/book" className="self-start"><CalendarPlus className="size-4" />Book your next mock</ButtonLink>
        </div>
      </div>
      <p className="sr-only">Scores are out of 10.</p>
    </PortalPage>
  );
}
