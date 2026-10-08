import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel, Section, StatusPill } from "@/components/portal/ui";
import { AdminHoursForm } from "@/components/admin/admin-schedule";
import { MentorCouponEditor, PublicVisibleToggle, ResendLoginButton, StatusSelect, TierSelect } from "@/components/admin/mentor-controls";
import { ReassignAll } from "@/components/admin/reassign-all";
import { LegalRecord } from "@/components/admin/legal-record";
import { db } from "@/lib/db";
import { fmtDate, fmtWhen } from "@/lib/format";
import { ACCRUAL_STATUS, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { decryptJson } from "@/server/crypto";
import { getSettings } from "@/lib/settings-db";

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
  const m = await db.mentorProfile.findUnique({ where: { id }, include: { user: true, referralCoupon: true } });
  if (!m) notFound();
  const [rates, awards, accruals, sessions, ratings, referralOrders] = await Promise.all([
    db.payRate.findMany({ where: { tier: m.tier }, orderBy: { service: "asc" } }),
    db.bonusAward.findMany({ where: { mentorId: id, kind: "REFERRAL" }, orderBy: { referralBatch: "asc" } }),
    db.payoutAccrual.findMany({ where: { mentorId: id }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.session.findMany({ where: { mentorId: id }, orderBy: { startsAt: "desc" }, take: 10, include: { student: { select: { name: true } } } }),
    db.sessionRating.aggregate({ where: { session: { mentorId: id } }, _avg: { rating: true }, _count: true }),
    m.referralCoupon
      ? db.order.findMany({ where: { couponId: m.referralCoupon.id, status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true } } } })
      : Promise.resolve([]),
  ]);
  const settings = await getSettings();
  const [upcomingCount, others] = await Promise.all([
    db.session.count({ where: { mentorId: id, status: { in: ["CONFIRMED", "REQUESTED"] }, startsAt: { gt: new Date() } } }),
    db.mentorProfile.findMany({ where: { status: "ACTIVE", id: { not: id }, user: { isDemo: m.user.isDemo } }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  const pendingAccrued = accruals.filter((a) => a.status !== "PAID").reduce((n, a) => n + a.amountPaise, 0);

  return (
    <PortalPage width="max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-line bg-card p-4">
        <div>
          <h2 className="font-display text-lg font-bold leading-[1.25] text-ink">{nm(m.user.name)}{m.user.isDemo && <span className="ml-2 rounded bg-line-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">demo</span>}</h2>
          <p className="mt-1 text-[12.5px] text-ink-faint">{m.user.email}{m.college ? ` · ${m.college}${m.batchYear ? `, ${m.batchYear}` : ""}` : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/messages?u=${m.userId}`} className="rounded-lg border border-line-strong px-3 py-2 text-xs font-semibold text-ink no-underline hover:no-underline">Message</Link><TierSelect mentorId={m.id} tier={m.tier} /><StatusSelect mentorId={m.id} status={m.status} /><PublicVisibleToggle mentorId={m.id} publicVisible={m.publicVisible} />{!m.user.isDemo && <ResendLoginButton mentorId={m.id} />}</div>
      </div>

      <Panel title="Referrals" flush={false}>
        {m.referralCoupon ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="type-label text-ink-faint">Referral code</p>
                <p className="tnum mt-1 font-display text-lg font-bold tracking-[0.08em] text-ink">{m.referralCoupon.code}</p>
              </div>
              <div className="text-right">
                <p className="type-label text-ink-faint">Students referred</p>
                <p className="tnum mt-1 font-display text-2xl font-bold text-oxblood">{referralOrders.length}</p>
              </div>
              <div className="text-right">
                <p className="type-label text-ink-faint">Discount</p>
                <p className="tnum mt-1 text-[13px] font-semibold text-ink">{m.referralCoupon.type === "PERCENT" ? `${m.referralCoupon.value}%` : formatPaise(m.referralCoupon.value)}</p>
              </div>
              <StatusPill tone={m.referralCoupon.active ? "green" : "oxblood"}>{m.referralCoupon.active ? "Active" : "Disabled"}</StatusPill>
            </div>
            <div className="mt-3.5 border-t border-line-soft pt-3.5">
              <MentorCouponEditor mentorId={m.id} coupon={{ code: m.referralCoupon.code, type: m.referralCoupon.type, value: m.referralCoupon.value, maxUses: m.referralCoupon.maxUses, active: m.referralCoupon.active }} />
            </div>
            {referralOrders.length > 0 && (
              <div className="mt-3.5 overflow-x-auto border-t border-line-soft pt-3.5">
                <table className="w-full min-w-[480px] border-collapse text-left text-[12.5px]">
                  <thead><tr className="border-b border-line">{["Student", "Service", "Date", "Paid"].map((h) => <th key={h} className="type-label px-2.5 py-2 text-ink-faint">{h}</th>)}</tr></thead>
                  <tbody>
                    {referralOrders.map((o) => (
                      <tr key={o.id} className="border-b border-line-soft last:border-b-0">
                        <td className="px-2.5 py-2 text-ink-body">{nm(o.guestName)}</td>
                        <td className="px-2.5 py-2 text-ink-2">{o.product.name}</td>
                        <td className="tnum px-2.5 py-2 text-ink-faint">{fmtDate(o.createdAt)}</td>
                        <td className="tnum px-2.5 py-2 font-semibold text-ink">{formatPaise(o.amountPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-[12.5px] text-ink-faint">No referral code on file — it&apos;s created automatically for new mentors; older ones won&apos;t have one until they&apos;re re-added.</p>
        )}
      </Panel>

      {m.status === "ACTIVE" && !m.user.isDemo && (
        <Panel title="Set hours for this mentor" flush={false}>
          <p className="mb-3 text-[12.5px] leading-[1.5] text-ink-faint">Adds bookable hours for {nm(m.user.name)} exactly as if they had added them themselves. Whole hours, IST.</p>
          <AdminHoursForm mentorId={m.id} />
        </Panel>
      )}

      <Panel title="Terms accepted" flush={false}><LegalRecord userId={m.userId} role="MENTOR" /></Panel>

      <Panel title="Going on leave? Move their sessions" flush={false}>
        <p className="mb-3 text-[12.5px] leading-[1.55] text-ink-muted">Hands every upcoming session to one other active mentor in one step. Students and mentors are emailed as usual.</p>
        <ReassignAll fromMentorId={id} upcoming={upcomingCount} options={others.map((o) => ({ id: o.id, label: nm(o.user.name) }))} />
      </Panel>
      <Section cols={280}>
        <Panel title={`Pay structure · ${m.tier}`} flush={false}>
          {rates.map((r) => <div key={r.id} className="tnum flex justify-between gap-2.5 border-b border-line-soft py-2 text-[12.5px] last:border-b-0"><span className="text-ink-2">{SERVICE[r.service]}</span><span className="font-semibold text-ink">{formatPaise(r.amountPaise)}</span></div>)}
        </Panel>
        <Panel title="Referral bonuses" flush={false}>
          {awards.length === 0 ? <p className="text-[12.5px] text-ink-faint">None yet. Every {settings.referralBonusEvery} referred students earn {settings.referralBonusPercent}% of the fees they paid.</p> : (
            <div className="flex flex-col gap-1.5">
              {awards.map((a) => <div key={a.id} className="tnum flex justify-between gap-2.5 border-b border-line-soft py-2 text-[12.5px] last:border-b-0"><span className="text-ink-2">Group {a.referralBatch} · {a.percent}% of {formatPaise(a.basePaise ?? 0)}</span><span className="font-semibold text-ink">{formatPaise(a.amountPaise)} <span className="ml-1 text-[11px] font-normal text-ink-faint">{a.status === "PAID" ? "paid" : a.status === "APPROVED" ? "approved" : "pending"}</span></span></div>)}
            </div>
          )}
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
