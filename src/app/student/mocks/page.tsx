import { OpenExamButton } from "@/components/mocks/open-exam";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock, FileCheck2, Lock, Play } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel, StatusPill } from "@/components/portal/ui";
import { SnapOffers } from "@/components/student/snap-offers";
import { ButtonLink } from "@/components/ui/button";
import { fmtWhen } from "@/lib/format";
import { listMocksFor } from "@/server/mocks";
import { snapStanding } from "@/server/snap-offers";
import { db } from "@/lib/db";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP Mocks" };

export default async function StudentMocksPage() {
  const user = await requireStudent();
  const [{ mocks, balances }, standing] = await Promise.all([listMocksFor(user.id), snapStanding(db, user.id)]);
  const done = mocks.filter((m) => m.attempt?.status === "SUBMITTED");
  const scores = done.map((m) => m.attempt!.score).filter((s): s is number => s !== null);
  const best = scores.length ? Math.max(...scores) : null;
  return (
    <PortalPage width="max-w-[980px]">
      <KpiGrid>
        <Kpi label="Mocks left" value={balances.series + balances.test} note={`${balances.series} series · ${balances.test} test`} icon={<FileCheck2 />} accent="oxblood" />
        <Kpi label="Taken" value={done.length} note="Analysis ready" icon={<CheckCircle2 />} accent="teal" />
        <Kpi label="Best score" value={best !== null ? best.toFixed(2).replace(/\.00$/, "") : "—"} note="Out of 60" icon={<BarChart3 />} accent="gold" />
        <Kpi label="Live now" value={mocks.filter((m) => m.released).length} note={`${mocks.length} published`} icon={<Play />} accent="indigo" />
      </KpiGrid>

      <Panel title="Mocks" flush={false}>
        {mocks.length === 0 ? <Empty art="sessions">No mocks are live yet. The first one opens soon.</Empty> : (
          <ul className="flex flex-col gap-3">
            {mocks.map((m) => {
              const a = m.attempt;
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-xs transition hover:shadow-card">
                  <span className={`flex size-11 flex-none items-center justify-center rounded-xl ${a?.status === "SUBMITTED" ? "bg-teal-tint text-teal" : "bg-oxblood-tint text-oxblood"}`}>{a?.status === "SUBMITTED" ? <CheckCircle2 className="size-5" aria-hidden /> : !m.released ? <Lock className="size-5" aria-hidden /> : <FileCheck2 className="size-5" aria-hidden />}</span>
                  <div className="min-w-[200px] flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-ink">{m.title}{m.isTest && <StatusPill tone="amber">Test mock</StatusPill>}</p>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-ink-faint">{m.questions} questions · {m.durationMin} minutes · {m.sections.length} sections</p>
                  </div>
                  {a?.status === "SUBMITTED" ? (
                    <><span className="tnum rounded-lg bg-surface px-3 py-2 font-display text-[16px] font-bold text-ink">{a.score?.toFixed(2).replace(/\.00$/, "")}</span><ButtonLink href={`/student/mocks/${a.id}`} variant="secondary">View analysis <ArrowRight className="size-4" aria-hidden /></ButtonLink></>
                  ) : a?.status === "IN_PROGRESS" ? (
                    <OpenExamButton slug={m.slug}><Clock className="size-4" aria-hidden />Continue the exam</OpenExamButton>
                  ) : !m.released ? (
                    <StatusPill tone="stone">{m.releaseAt ? `Opens ${fmtWhen(m.releaseAt)}` : "Coming soon"}</StatusPill>
                  ) : m.canStart ? (
                    <OpenExamButton slug={m.slug}><Play className="size-4" aria-hidden />Start the mock</OpenExamButton>
                  ) : (
                    <span className="text-[12px] font-medium text-ink-muted">{m.isTest ? "Buy the test mock below" : "Buy a pack below to take it"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <SnapOffers user={user} title={standing.five ? "Want all 10? Add 5 more mocks" : standing.test ? "Ready for more? Take the full mocks" : "Pick a plan and take your first mock"} lead={standing.five ? undefined : "A mock is only worth the time you spend learning from it: every one ends with an analysis of exactly where your marks went."} />
      <p className="text-[11.5px] text-ink-faint">Each mock can be taken once, in one sitting, on a laptop or desktop. <Link href="/student/help" className="underline">Need help?</Link></p>
    </PortalPage>
  );
}
