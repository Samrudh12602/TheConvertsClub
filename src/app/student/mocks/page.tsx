import { OpenExamButton } from "@/components/mocks/open-exam";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock, FileCheck2, Lock, Play } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel, StatusPill } from "@/components/portal/ui";
import { PortalBuy } from "@/components/student/portal-buy";
import { ButtonLink } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { fmtWhen } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { priceView } from "@/lib/pricing";
import { paymentsConfigured } from "@/server/razorpay";
import { listMocksFor } from "@/server/mocks";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNAP Mocks" };

export default async function StudentMocksPage() {
  const user = await requireStudent();
  const [{ mocks, balances }, test, five, ten] = await Promise.all([listMocksFor(user.id), getProduct("snap-test-mock"), getProduct("snap-mocks-5"), getProduct("snap-mocks-10")]);
  const me = { name: user.name?.replace(/\s*\(demo\)/, "") ?? "", email: user.email, phone: user.phone ?? "" };
  const canPay = paymentsConfigured();
  const done = mocks.filter((m) => m.attempt?.status === "SUBMITTED");
  const scores = done.map((m) => m.attempt!.score).filter((s): s is number => s !== null);
  const best = scores.length ? Math.max(...scores) : null;
  const low = balances.series === 0;
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

      {(low || balances.test === 0) && (test || five || ten) && (
        <section aria-label="Get more mocks" className="overflow-hidden rounded-2xl bg-night p-5 text-surface shadow-lift ring-1 ring-white/5">
          <p className="type-eyebrow text-gold">Get mocks</p>
          <h2 className="mt-1.5 font-display text-[20px] font-bold leading-[1.2]">Take the real thing, then see exactly what went wrong</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[test, five, ten].filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => (
              <div key={p.slug} className="flex flex-col gap-2 rounded-xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                <p className="text-[13.5px] font-semibold">{p.name}</p>
                <p className="tnum font-display text-[26px] font-bold leading-none">{formatPaise(priceView(p).payablePaise)}</p>
                <p className="text-[12px] leading-[1.5] text-dark-soft">{p.summary}</p>
                {canPay && <PortalBuy slug={p.slug} me={me} label="Buy" variant="onDark" />}
              </div>
            ))}
          </div>
        </section>
      )}
      <p className="text-[11.5px] text-ink-faint">Each mock can be taken once, in one sitting, on a laptop or desktop. <Link href="/student/help" className="underline">Need help?</Link></p>
    </PortalPage>
  );
}
