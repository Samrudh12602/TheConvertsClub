import { notFound } from "next/navigation";
import { nowMs } from "@/lib/datetime";
import { PortalPage } from "@/components/portal/portal-page";
import { Insight, Panel, StatusPill } from "@/components/portal/ui";
import { NoShowButton } from "@/components/mentor/session-buttons";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { fmtDate, fmtWhen } from "@/lib/format";
import { CALL_OUTCOME, RUBRIC, SESSION_STATUS, sessionTitle } from "@/lib/labels";
import { requireMentor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Session" };
const nm = (n?: string | null) => n?.replace(/\s*\(demo\)/, "") ?? "Student";

export default async function MentorSession({ params }: { params: Promise<{ id: string }> }) {
  const { mentor } = await requireMentor();
  const { id } = await params;
  const s = await db.session.findUnique({ where: { id }, include: { feedback: true, student: { include: { studentProfile: true, calls: true } }, gdBatch: { include: { participants: { where: { status: "JOINED" }, include: { student: { select: { name: true } } } } } } } });
  if (!s || s.mentorId !== mentor.id) notFound();
  const st = SESSION_STATUS[s.status];
  const p = s.student?.studentProfile;
  const started = s.startsAt ? s.startsAt.getTime() < nowMs() : false;
  const f = s.feedback;
  const scores = (f?.scores ?? {}) as Record<string, number>;

  return (
    <PortalPage width="max-w-[800px]">
      <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-line bg-card p-4">
        <div>
          <h2 className="font-display text-[17px] font-bold leading-[1.25] text-ink">{s.type === "GD_BATCH" ? s.gdBatch?.topic ?? "GD batch" : `${nm(s.student?.name)} · ${sessionTitle(s.type, s.focus)}`}</h2>
          <p className="mt-1 text-[12.5px] leading-[1.45] text-ink-faint">{s.startsAt ? `${fmtWhen(s.startsAt)} IST` : ""}</p>
          <div className="mt-2"><StatusPill tone={st.tone}>{st.label}</StatusPill></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.status === "CONFIRMED" && s.meetingUrl && <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-white px-4 text-[13px] font-medium leading-none text-ink-2 no-underline hover:border-ink hover:text-ink hover:no-underline">Join meeting</a>}
          {s.status === "CONFIRMED" && started && <ButtonLink href={`/mentor/feedback/${s.id}`}>Submit feedback</ButtonLink>}
          {s.status === "CONFIRMED" && started && <NoShowButton sessionId={s.id} />}
        </div>
      </div>

      {s.student && s.type !== "GD_BATCH" && (
        <Panel title="Student dossier" flush={false}>
          <dl className="grid gap-x-6 gap-y-3 text-[13px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {([["College", p?.college], ["Degree", p?.degree], ["Work experience", p?.workExMonths != null ? `${p.workExMonths} months` : null], ["Target institutes", p?.targetInstitutes.join(", ")], ["Says they're weak on", p?.weakAreas.join(", ")]] as [string, string | null | undefined][]).map(([k, v]) => (
              <div key={k}><dt className="type-label text-ink-faint">{k}</dt><dd className="mt-1 text-ink-body">{v || "—"}</dd></div>
            ))}
          </dl>
          {s.student.calls.length > 0 && (
            <div className="mt-4 border-t border-line-soft pt-3.5">
              <p className="type-label text-ink-faint">Calls</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-ink-body">{s.student.calls.map((c) => <li key={c.id}>{c.institute}{c.interviewDate ? ` · ${fmtDate(c.interviewDate)}` : ""} <span className="text-ink-faint">({CALL_OUTCOME[c.outcome].label})</span></li>)}</ul>
            </div>
          )}
        </Panel>
      )}
      {s.type === "GD_BATCH" && s.gdBatch && <Panel title={`Participants (${s.gdBatch.participants.length})`} flush={false}><ul className="text-[13px] text-ink-body">{s.gdBatch.participants.map((x) => <li key={x.id}>{nm(x.student.name)}</li>)}</ul></Panel>}

      {f && (
        <>
          <Panel title="Feedback you submitted" flush={false}>
            <p className="text-[13px] text-ink-2">Overall <span className="tnum font-display text-lg font-bold text-ink">{f.overall.toFixed(1)}</span> · {RUBRIC.filter((r) => scores[r] !== undefined).map((r) => `${r} ${scores[r]}`).join(" · ")}</p>
          </Panel>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <Insight title="Strengths" tone="green"><p>{f.strengths}</p></Insight>
            <Insight title="Weaknesses" tone="oxblood"><p>{f.weaknesses}</p></Insight>
          </div>
        </>
      )}
    </PortalPage>
  );
}
