import { notFound } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel, Section, StatusPill } from "@/components/portal/ui";
import { CreditAdjustForm, StudentStatusToggle } from "@/components/admin/student-controls";
import { db } from "@/lib/db";
import { fmtDate, fmtWhen } from "@/lib/format";
import { CALL_OUTCOME, CREDIT_LABEL, SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { getBalances } from "@/server/credits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Student" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await db.user.findUnique({ where: { id, role: "STUDENT" }, include: { studentProfile: true, calls: true } });
  if (!student) notFound();
  const [balances, sessions, orders, ledger] = await Promise.all([
    getBalances(db, id),
    db.session.findMany({ where: { studentId: id }, orderBy: { startsAt: "desc" }, take: 20, include: { mentor: { include: { user: { select: { name: true } } } } } }),
    db.order.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true } } } }),
    db.creditLedger.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const p = student.studentProfile;

  return (
    <PortalPage width="max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-line bg-card p-4">
        <div>
          <h2 className="font-display text-lg font-bold leading-[1.25] text-ink">{nm(student.name)}{student.isDemo && <span className="ml-2 rounded bg-line-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">demo</span>}</h2>
          <p className="mt-1 text-[12.5px] text-ink-faint">{student.email}{student.phone ? ` · ${student.phone}` : ""}</p>
        </div>
        <div className="flex items-center gap-2"><StatusPill tone={student.status === "ACTIVE" ? "green" : "oxblood"}>{student.status === "ACTIVE" ? "Active" : "Suspended"}</StatusPill><StudentStatusToggle userId={student.id} status={student.status} /></div>
      </div>

      <Section cols={280}>
        <Panel title="Profile" flush={false}>
          <dl className="grid gap-3 text-[13px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {([["College", p?.college], ["Degree", p?.degree], ["Work-ex", p?.workExMonths != null ? `${p.workExMonths} mo` : null], ["Targets", p?.targetInstitutes.join(", ")], ["Weak areas", p?.weakAreas.join(", ")]] as [string, string | null | undefined][]).map(([k, v]) => <div key={k}><dt className="type-label text-ink-faint">{k}</dt><dd className="mt-1 text-ink-body">{v || "—"}</dd></div>)}
          </dl>
        </Panel>
        <Panel title="Credits" flush={false}>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(balances).filter(([, b]) => b && (b.available > 0 || b.reserved > 0)).map(([k, b]) => (
              <span key={k} className="tnum rounded-md bg-line-soft px-2.5 py-1.5 text-xs font-semibold text-ink-2">{CREDIT_LABEL[k as keyof typeof CREDIT_LABEL]}: {b!.available}{b!.reserved ? ` (+${b!.reserved} held)` : ""}</span>
            ))}
            {Object.values(balances).every((b) => !b || (b.available <= 0 && b.reserved <= 0)) && <span className="text-xs text-ink-faint">No credits.</span>}
          </div>
          <div className="mt-3.5 border-t border-line-soft pt-3.5"><CreditAdjustForm userId={student.id} /></div>
        </Panel>
      </Section>

      <Panel title="Calls" flush={false}>
        {student.calls.length === 0 ? <Empty>No calls tracked.</Empty> : <ul className="flex flex-col gap-1.5 text-[13px] text-ink-body">{student.calls.map((c) => <li key={c.id} className="flex items-center gap-2">{c.institute}{c.interviewDate ? ` · ${fmtDate(c.interviewDate)}` : ""} <StatusPill tone={CALL_OUTCOME[c.outcome].tone}>{CALL_OUTCOME[c.outcome].label}</StatusPill></li>)}</ul>}
      </Panel>

      <Panel title="Sessions">
        {sessions.length === 0 ? <Empty>No sessions yet.</Empty> : sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
            <span className="tnum w-32 flex-none text-ink-faint">{s.startsAt ? fmtWhen(s.startsAt) : "—"}</span>
            <span className="min-w-0 flex-1 text-ink-body">{sessionTitle(s.type, s.focus)}{s.mentor ? ` · ${nm(s.mentor.user.name)}` : ""}</span>
            <StatusPill tone={SESSION_STATUS[s.status].tone}>{SESSION_STATUS[s.status].label}</StatusPill>
          </div>
        ))}
      </Panel>

      <Panel title="Payments">
        {orders.length === 0 ? <Empty>No payments.</Empty> : orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-[12.5px] last:border-b-0">
            <span className="text-ink-body">{o.product.name}</span>
            <span className="text-ink-faint">{o.status}</span>
            <span className="tnum font-semibold text-ink">{formatPaise(o.amountPaise)}</span>
          </div>
        ))}
      </Panel>

      <Panel title="Credit ledger">
        {ledger.length === 0 ? <Empty>No ledger entries.</Empty> : ledger.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2 text-[11.5px] last:border-b-0">
            <span className="text-ink-muted">{fmtDate(l.createdAt)} · {l.type} · {l.kind}</span>
            <span className="tnum font-medium text-ink-body">{l.delta > 0 ? "+" : ""}{l.delta}{l.reservedDelta ? ` (res ${l.reservedDelta > 0 ? "+" : ""}${l.reservedDelta})` : ""}</span>
          </div>
        ))}
      </Panel>
    </PortalPage>
  );
}
