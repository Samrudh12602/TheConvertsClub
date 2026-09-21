import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel, Section, StatusPill } from "@/components/portal/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { ACCRUAL_STATUS, REVIEW_LABEL, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earnings" };
const SERVICE: Record<string, string> = { PI: "Mock PI", GD: "GD / GE batch", WAT: "WAT evaluation", GUIDANCE: "Guidance call", SOP: "SOP review" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo\)/, "") ?? "Student";

export default async function Earnings() {
  const { mentor } = await requireMentor();
  const [accruals, rates, bonus] = await Promise.all([
    db.payoutAccrual.findMany({ where: { mentorId: mentor.id }, orderBy: { createdAt: "desc" }, take: 40, include: { session: { include: { student: { select: { name: true } } } }, review: { include: { student: { select: { name: true } } } } } }),
    db.payRate.findMany({ where: { tier: mentor.tier }, orderBy: { service: "asc" } }),
    db.bonusAward.aggregate({ where: { mentorId: mentor.id }, _sum: { amountPaise: true } }),
  ]);
  const sum = async (status: "ACCRUED" | "APPROVED" | "PAID") => (await db.payoutAccrual.aggregate({ where: { mentorId: mentor.id, status }, _sum: { amountPaise: true }, _count: true }));
  const [a, p, d] = await Promise.all([sum("ACCRUED"), sum("APPROVED"), sum("PAID")]);
  return (
    <PortalPage>
      <KpiGrid>
        <Kpi label="Accrued" value={formatPaise(a._sum.amountPaise ?? 0)} note={`${a._count} items awaiting approval`} />
        <Kpi label="Approved" value={formatPaise(p._sum.amountPaise ?? 0)} note="In the next payout run" />
        <Kpi label="Paid, season" value={formatPaise(d._sum.amountPaise ?? 0)} note={`${d._count} items`} />
        <Kpi label="Bonuses" value={formatPaise(bonus._sum.amountPaise ?? 0)} note="Milestone awards" />
      </KpiGrid>
      <Section cols={280}>
        <Panel title="Recent accruals">
          {accruals.length === 0 ? <Empty>Pay accrues when you submit feedback.</Empty> : accruals.map((x) => {
            const st = ACCRUAL_STATUS[x.status];
            const who = nm(x.session?.student?.name ?? x.review?.student.name);
            const what = x.session ? `${sessionTitle(x.session.type, x.session.focus)} · ${who}` : x.review ? `${REVIEW_LABEL[x.review.kind]} · ${who}` : SERVICE[x.service];
            return (
              <div key={x.id} className="tnum flex items-center justify-between gap-2.5 border-b border-line-soft px-3.5 py-[11px] last:border-b-0">
                <div className="min-w-0"><p className="text-[12.5px] font-medium leading-[1.3] text-ink-body">{what}</p><p className="mt-0.5 text-[11px] leading-[1.3] text-ink-faint">{fmtDate(x.createdAt)}</p></div>
                <div className="flex flex-none items-center gap-2.5"><span className="text-[12.5px] font-semibold text-ink">{formatPaise(x.amountPaise)}</span><StatusPill tone={st.tone}>{st.label}</StatusPill></div>
              </div>
            );
          })}
        </Panel>
        <Panel title={`Your pay structure · ${mentor.tier}`}>
          {rates.map((r) => <div key={r.id} className="tnum flex justify-between gap-2.5 border-b border-line-soft px-3.5 py-2.5 last:border-b-0"><span className="text-[12.5px] text-ink-2">{SERVICE[r.service]}</span><span className="text-[12.5px] font-semibold text-ink">{formatPaise(r.amountPaise)}</span></div>)}
          <p className="px-3.5 py-3 text-[11.5px] leading-[1.55] text-ink-faint">Rates are snapshotted when you submit feedback. A later change never alters what you&apos;ve already earned.</p>
        </Panel>
      </Section>
    </PortalPage>
  );
}
