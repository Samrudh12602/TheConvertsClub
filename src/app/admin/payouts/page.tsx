import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Kpi, KpiGrid, Panel, StatusPill } from "@/components/portal/ui";
import { ApproveAccrualsButton, ApproveBonusesButton, CreateRunForm, MarkPaidForm, PreviewBonusesButton } from "@/components/admin/payout-controls";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { ACCRUAL_STATUS } from "@/lib/labels";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";
const SERVICE: Record<string, string> = { PI: "Mock PI", GD: "GD batch", WAT: "WAT", GUIDANCE: "Guidance", SOP: "SOP review" };

export default async function PayoutsPage() {
  const [accrued, approved, paid, accrualRows, runs] = await Promise.all([
    db.payoutAccrual.aggregate({ where: { status: "ACCRUED" }, _sum: { amountPaise: true }, _count: true }),
    db.payoutAccrual.aggregate({ where: { status: "APPROVED" }, _sum: { amountPaise: true }, _count: true }),
    db.payoutAccrual.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true }, _count: true }),
    db.payoutAccrual.findMany({ where: { status: { in: ["ACCRUED", "APPROVED"] } }, orderBy: { createdAt: "desc" }, take: 30, include: { mentor: { include: { user: { select: { name: true } } } } } }),
    db.payoutRun.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { payouts: { include: { mentor: { include: { user: { select: { name: true } } } } } } } }),
  ]);

  return (
    <PortalPage width="max-w-[1000px]">
      <KpiGrid>
        <Kpi label="Accrued" value={formatPaise(accrued._sum.amountPaise ?? 0)} note={`${accrued._count} items`} />
        <Kpi label="Approved" value={formatPaise(approved._sum.amountPaise ?? 0)} note={`${approved._count} items`} />
        <Kpi label="Paid, season" value={formatPaise(paid._sum.amountPaise ?? 0)} note={`${paid._count} items`} />
      </KpiGrid>

      <div className="flex flex-wrap gap-2.5 rounded-[11px] border border-line bg-card p-4">
        <ApproveAccrualsButton /><ApproveBonusesButton /><PreviewBonusesButton />
      </div>

      <Panel title="Accrued & approved, awaiting a run">
        {accrualRows.length === 0 ? <Empty>Nothing pending.</Empty> : accrualRows.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
            <span className="text-ink-body">{nm(a.mentor.user.name)} · {SERVICE[a.service]} · {fmtDate(a.createdAt)}</span>
            <div className="flex items-center gap-2.5"><span className="tnum font-semibold text-ink">{formatPaise(a.amountPaise)}</span><StatusPill tone={ACCRUAL_STATUS[a.status].tone}>{ACCRUAL_STATUS[a.status].label}</StatusPill></div>
          </div>
        ))}
      </Panel>

      <Panel title="Create payout run" flush={false}><CreateRunForm /></Panel>

      <Panel title="Payout runs">
        {runs.length === 0 ? <Empty>No runs yet.</Empty> : runs.map((run) => (
          <div key={run.id} className="border-b border-line-soft px-3.5 py-3 last:border-b-0">
            <div className="flex items-center justify-between gap-3"><p className="text-[13px] font-semibold text-ink">{run.label}</p><StatusPill tone={run.status === "PAID" ? "green" : run.status === "APPROVED" ? "amber" : "stone"}>{run.status}</StatusPill></div>
            <div className="mt-2 flex flex-col gap-1.5">
              {run.payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-ink-2">{nm(p.mentor.user.name)}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="tnum font-medium text-ink">{formatPaise(p.amountPaise)}</span>
                    {p.paidAt ? <span className="text-[11px] text-green">Paid · {p.reference}</span> : <MarkPaidForm payoutId={p.id} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
