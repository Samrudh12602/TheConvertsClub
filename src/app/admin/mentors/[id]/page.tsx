import { notFound } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Meter, Panel, Section, StatusPill } from "@/components/portal/ui";
import { StatusSelect, TierSelect } from "@/components/admin/mentor-controls";
import { db } from "@/lib/db";
import { fmtDate, fmtWhen } from "@/lib/format";
import { ACCRUAL_STATUS, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { decryptJson } from "@/server/crypto";
import { nextThreshold } from "@/server/payroll";
import { countMocks } from "@/app/mentor/page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";
const SERVICE: Record<string, string> = { PI: "Mock PI", GD: "GD / GE batch", WAT: "WAT evaluation", GUIDANCE: "Guidance call", SOP: "SOP review" };

function maskPayout(enc: string | null): string {
  if (!enc) return "not set";
  try { const p = decryptJson<{ upi?: string; accountNumber?: string }>(enc); if (p.upi) return `UPI ••••${p.upi.slice(p.upi.indexOf("@"))}`; if (p.accountNumber) return `Account ••••${p.accountNumber.slice(-4)}`; } catch { /* unreadable */ }
  return "on file";
}

export default async function MentorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.mentorProfile.findUnique({ where: { id }, include: { user: true } });
  if (!m) notFound();
  const [rates, bonusRules, awards, accruals, sessions, ratings, mocks] = await Promise.all([
    db.payRate.findMany({ where: { tier: m.tier }, orderBy: { service: "asc" } }),
    db.bonusRule.findMany({ where: { tier: m.tier, active: true }, orderBy: { threshold: "asc" } }),
    db.bonusAward.findMany({ where: { mentorId: id } }),
    db.payoutAccrual.findMany({ where: { mentorId: id }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.session.findMany({ where: { mentorId: id }, orderBy: { startsAt: "desc" }, take: 10, include: { student: { select: { name: true } } } }),
    db.sessionRating.aggregate({ where: { session: { mentorId: id } }, _avg: { rating: true }, _count: true }),
    countMocks(id, (await import("@/lib/settings")).DEFAULT_SETTINGS.mockCounts),
  ]);
  const ruleLite = bonusRules.map((r) => ({ id: r.id, tier: r.tier, threshold: r.threshold, amountPaise: r.amountPaise, active: r.active }));
  const next = nextThreshold(m.tier, mocks, ruleLite);
  const awarded = new Set(awards.map((a) => a.ruleId));
  const pendingAccrued = accruals.filter((a) => a.status !== "PAID").reduce((n, a) => n + a.amountPaise, 0);

  return (
    <PortalPage width="max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-line bg-card p-4">
        <div>
          <h2 className="font-display text-lg font-bold leading-[1.25] text-ink">{nm(m.user.name)}{m.user.isDemo && <span className="ml-2 rounded bg-line-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">demo</span>}</h2>
          <p className="mt-1 text-[12.5px] text-ink-faint">{m.user.email}{m.college ? ` · ${m.college}${m.batchYear ? `, ${m.batchYear}` : ""}` : ""}</p>
        </div>
        <div className="flex items-center gap-2"><TierSelect mentorId={m.id} tier={m.tier} /><StatusSelect mentorId={m.id} status={m.status} /></div>
      </div>

      <Section cols={280}>
        <Panel title={`Pay structure · ${m.tier}`} flush={false}>
          {rates.map((r) => <div key={r.id} className="tnum flex justify-between gap-2.5 border-b border-line-soft py-2 text-[12.5px] last:border-b-0"><span className="text-ink-2">{SERVICE[r.service]}</span><span className="font-semibold text-ink">{formatPaise(r.amountPaise)}</span></div>)}
        </Panel>
        <Panel title="Bonus progress" flush={false}>
          <div className="flex flex-col gap-3">
            {bonusRules.map((r) => { const done = awarded.has(r.id) || mocks >= r.threshold; return <Meter key={r.id} label={`${r.threshold} mocks · ${formatPaise(r.amountPaise)}`} note={done ? "Awarded" : `${mocks} of ${r.threshold}`} pct={Math.min(100, (mocks / r.threshold) * 100)} tone={done ? "green" : "oxblood"} />; })}
            {next && <p className="text-[11.5px] text-ink-faint">{next.threshold - mocks} mocks to next tier.</p>}
          </div>
        </Panel>
      </Section>

      <Section cols={280}>
        <Panel title="Payout account" flush={false}><p className="text-[13px] text-ink-body">{maskPayout(m.payoutEncrypted)}</p><p className="mt-1.5 text-[11.5px] text-ink-faint">Encrypted at rest. Mentor manages this from their own Profile screen.</p></Panel>
        <Panel title="Standing" flush={false}><p className="text-[13px] text-ink-body">Avg rating {ratings._avg.rating ? ratings._avg.rating.toFixed(1) : "—"} across {ratings._count} sessions</p><p className="mt-1.5 tnum text-[13px] font-semibold text-ink">{formatPaise(pendingAccrued)} pending payout</p></Panel>
      </Section>

      <Panel title="Recent accruals">
        {accruals.length === 0 ? <Empty>No accruals yet.</Empty> : accruals.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
            <span className="text-ink-body">{SERVICE[a.service]} · {fmtDate(a.createdAt)}</span>
            <div className="flex items-center gap-2.5"><span className="tnum font-semibold text-ink">{formatPaise(a.amountPaise)}</span><StatusPill tone={ACCRUAL_STATUS[a.status].tone}>{ACCRUAL_STATUS[a.status].label}</StatusPill></div>
          </div>
        ))}
      </Panel>

      <Panel title="Recent sessions">
        {sessions.length === 0 ? <Empty>No sessions yet.</Empty> : sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
            <span className="tnum w-32 flex-none text-ink-faint">{s.startsAt ? fmtWhen(s.startsAt) : "—"}</span>
            <span className="text-ink-body">{sessionTitle(s.type, s.focus)}{s.student ? ` · ${nm(s.student.name)}` : ""}</span>
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
