import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Insight } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { FOCUS_LABEL, RUBRIC, SCORE_TEXT, scoreTone } from "@/lib/labels";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

/** Target readiness score used for the reference bar. */
const TARGET = 8.5;
const BAR = { green: "bg-green", amber: "bg-amber", oxblood: "bg-oxblood" } as const;

export default async function ProgressPage() {
  const user = await requireStudent();
  const fb = await db.feedback.findMany({
    where: { OR: [{ session: { studentId: user.id } }, { review: { studentId: user.id } }] },
    orderBy: { submittedAt: "asc" },
    include: { session: { select: { type: true, focus: true } }, review: { select: { kind: true } } },
  });
  const done = await db.session.findMany({ where: { studentId: user.id, status: "COMPLETED", type: "MOCK_PI" }, select: { focus: true } });

  if (fb.length === 0) return <PortalPage width="max-w-[880px]"><Empty>Your progress appears after your first piece of feedback.</Empty></PortalPage>;

  let pi = 0;
  const bars = fb.map((f) => ({ label: f.session?.type === "MOCK_PI" ? `Mock ${++pi}` : f.session?.type === "GD_BATCH" ? "GD" : f.review ? f.review.kind === "WAT" ? "WAT" : "SOP" : "Call", score: f.overall }));
  const all = [...bars.slice(-7), { label: "Target", score: TARGET }];

  const avg = (rows: typeof fb, r: string) => { const v = rows.map((x) => (x.scores as Record<string, number>)[r]).filter((n) => typeof n === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const half = Math.floor(fb.length / 2);
  const first = fb.slice(0, Math.max(1, half)), last = fb.slice(-Math.max(1, half));
  const deltas = RUBRIC.map((r) => ({ r, d: (avg(last, r) ?? 0) - (avg(first, r) ?? 0), now: avg(fb, r) ?? 0 }));
  const up = fb.length >= 2 ? [...deltas].sort((a, b) => b.d - a.d)[0] : null;
  const stuck = [...deltas].sort((a, b) => a.now - b.now)[0];
  const flagged = fb.filter((f) => ((f.scores as Record<string, number>)[stuck.r] ?? 10) < 6).length;
  const tried = new Set(done.map((d) => d.focus));
  const untested = (Object.keys(FOCUS_LABEL) as (keyof typeof FOCUS_LABEL)[]).filter((k) => !tried.has(k));

  return (
    <PortalPage width="max-w-[880px]">
      <div className="rounded-[11px] border border-line bg-card p-[18px]">
        <h2 className="text-[13.5px] font-bold leading-none text-ink">Readiness over time</h2>
        <div className="mt-4 flex h-[150px] items-end gap-2.5" role="img" aria-label={`Scores: ${all.map((b) => `${b.label} ${b.score.toFixed(1)}`).join(", ")}`}>
          {all.map((b, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-[7px]">
              <span className="tnum text-[11.5px] font-semibold leading-none text-ink">{b.score.toFixed(1)}</span>
              <div className={`w-full rounded-t ${b.label === "Target" ? "bg-line" : BAR[scoreTone(b.score)]}`} style={{ height: `${b.score * 10.5}px` }} />
              <span className="text-[10.5px] leading-none text-ink-faint">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {up && up.d > 0.2 && <Insight title="Trending up" tone="green"><p>{up.r} has moved {up.d.toFixed(1)} points since your first sessions. Keep doing what you&apos;re doing there.</p></Insight>}
        <Insight title="Still stuck" tone="oxblood"><p>{stuck.r} averages {stuck.now.toFixed(1)}{flagged > 1 ? ` and has been below 6 in ${flagged} of ${fb.length} pieces of feedback` : ""}. Book a session focused on it before your next call.</p></Insight>
        <Insight title="Untested" tone="amber"><p>{untested.length ? `No mock has covered ${untested.slice(0, 3).map((k) => FOCUS_LABEL[k].toLowerCase()).join(", ")} yet. Book one next.` : "You&apos;ve covered every focus area at least once."}</p></Insight>
      </div>
      <p className={`text-xs ${SCORE_TEXT.green} sr-only`}>Scores are out of 10.</p>
    </PortalPage>
  );
}
