import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { ProfileDocumentsView } from "@/components/admin/profile-documents-view";
import { CreditBreakdown } from "@/components/portal/credit-breakdown";
import { Empty, Panel, StatusPill } from "@/components/portal/ui";
import { BookForStudent } from "@/components/admin/admin-schedule";
import { CreditAdjustForm, StudentStatusToggle } from "@/components/admin/student-controls";
import { LegalRecord } from "@/components/admin/legal-record";
import { db } from "@/lib/db";
import { fmtDate, fmtWhen } from "@/lib/format";
import { CALL_OUTCOME, SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { formatPaise } from "@/lib/money";
import { getCreditSummary, getEnrollmentBreakdown } from "@/server/credits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Student" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo.*?\)/, "") ?? "—";

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await db.user.findUnique({ where: { id, role: "STUDENT" }, include: { studentProfile: true, calls: true, profileDocuments: { orderBy: { createdAt: "desc" } } } });
  if (!student) notFound();
  const [creditSummary, enrollments, sessions, orders, ledger] = await Promise.all([
    getCreditSummary(db, id),
    getEnrollmentBreakdown(db, id),
    db.session.findMany({ where: { studentId: id }, orderBy: { startsAt: "desc" }, take: 20, include: { mentor: { include: { user: { select: { name: true } } } } } }),
    db.order.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true } } } }),
    db.creditLedger.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const p = student.studentProfile;
  const activePlans = enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.productName);

  return (
    <PortalPage width="max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-line bg-card p-4">
        <div>
          <h2 className="font-display text-lg font-bold leading-[1.25] text-ink">{nm(student.name)}{student.isDemo && <span className="ml-2 rounded bg-line-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-faint">demo</span>}</h2>
          <p className="mt-1 text-[12.5px] text-ink-faint">{student.email}{student.phone ? ` · ${student.phone}` : ""}</p>
          <p className="mt-1.5 text-[12.5px] font-medium text-oxblood">{activePlans.length > 0 ? activePlans.join(" · ") : "Not enrolled in anything yet"}</p>
        </div>
        <div className="flex items-center gap-2"><Link href={`/admin/messages?u=${student.id}`} className="rounded-lg border border-line-strong px-3 py-2 text-xs font-semibold text-ink no-underline hover:no-underline">Message</Link><StatusPill tone={student.status === "ACTIVE" ? "green" : "oxblood"}>{student.status === "ACTIVE" ? "Active" : "Suspended"}</StatusPill><StudentStatusToggle userId={student.id} status={student.status} /></div>
      </div>

      <Panel title="Profile" flush={false}>
        <dl className="grid gap-3 text-[13px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {([
            ["Date of birth", p?.dob ? p.dob.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null], ["State", [p?.city, p?.state].filter(Boolean).join(", ") || null], ["Exams", p?.examsAppearing?.join(", ")],
            ["10th", p?.tenthPercent != null ? `${p.tenthPercent}%${p.tenthBoard ? ` · ${p.tenthBoard}` : ""}${p.tenthYear ? ` · ${p.tenthYear}` : ""}` : null],
            ["12th", p?.twelfthPercent != null ? `${p.twelfthPercent}%${p.twelfthStream ? ` · ${p.twelfthStream}` : ""}${p.twelfthBoard ? ` · ${p.twelfthBoard}` : ""}${p.twelfthYear ? ` · ${p.twelfthYear}` : ""}` : null],
            ["College", [p?.college, p?.degree].filter(Boolean).join(" · ") || null], ["Graduated", [p?.gradYear, p?.gradScore].filter(Boolean).join(" · ") || null],
            ["Work-ex", p?.workExMonths != null ? `${p.workExMonths} mo${p.company ? ` · ${p.company}` : ""}${p.jobRole ? `, ${p.jobRole}` : ""}` : null],
            ["Targets", p?.targetInstitutes.join(", ")], ["Weak areas", p?.weakAreas.join(", ")],
          ] as [string, string | null | undefined][]).map(([k, v]) => <div key={k}><dt className="type-label text-ink-faint">{k}</dt><dd className="mt-1 text-ink-body">{v || "—"}</dd></div>)}
        </dl>
        {p?.about && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-surface p-3 text-[12.5px] leading-[1.6] text-ink-2">{p.about}</p>}
      </Panel>

      <Panel title="Exam results and call letters" flush={false}>
        <ProfileDocumentsView docs={student.profileDocuments.map((d) => ({ id: d.id, kind: d.kind, title: d.title, year: d.year, score: d.score, note: d.note, hasFile: Boolean(d.fileKey) }))} empty="Nothing added yet." />
      </Panel>

      <Panel title="Terms accepted" flush={false}><LegalRecord userId={student.id} role="STUDENT" /></Panel>

      <CreditBreakdown summary={creditSummary} enrollments={enrollments} />
      <Panel title="Book a session for this student" flush={false}>
        <p className="mb-3 text-[12.5px] leading-[1.5] text-ink-faint">Uses their own credit and the normal matching rules, and emails them the confirmation. No credit? Add one below first.</p>
        <BookForStudent studentId={student.id} />
      </Panel>
      <Panel title="Adjust a credit" flush={false}><CreditAdjustForm userId={student.id} /></Panel>

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
