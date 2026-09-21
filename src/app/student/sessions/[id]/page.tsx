import { notFound } from "next/navigation";
import { PortalPage } from "@/components/portal/portal-page";
import { Flash, Insight, Meter, StatusPill } from "@/components/portal/ui";
import { RatingPicker, SessionActions } from "@/components/student/session-actions";
import { db } from "@/lib/db";
import { fmtWhen, relative } from "@/lib/format";
import { RUBRIC, SCORE_TEXT, SESSION_STATUS, scoreTone, sessionTitle } from "@/lib/labels";
import { getSettings } from "@/lib/settings-db";
import { requireStudent } from "@/server/session";
import { canReschedule, cancelOutcome } from "@/server/scheduling";

export const dynamic = "force-dynamic";
export const metadata = { title: "Session" };

const lines = (s?: string | null) => (s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

export default async function SessionDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ booked?: string; moved?: string }> }) {
  const user = await requireStudent();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const s = await db.session.findUnique({ where: { id }, include: { mentor: { include: { user: { select: { name: true } } } }, feedback: true, rating: true } });
  if (!s || s.studentId !== user.id) notFound();
  const settings = await getSettings();
  const now = new Date();
  const title = sessionTitle(s.type, s.focus);
  const upcoming = ["CONFIRMED", "REQUESTED"].includes(s.status) && s.startsAt && s.startsAt > now;
  const mentor = s.mentor?.user.name?.replace(/\s*\(demo\)/, "");
  const f = s.feedback;
  const scores = (f?.scores ?? {}) as Record<string, number>;
  const st = SESSION_STATUS[s.status];

  const header = (
    <div className="rounded-[11px] border border-line bg-card p-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <h2 className="font-display text-[19px] font-bold leading-[1.25] text-ink">{title}</h2>
          <p className="mt-[5px] text-[12.5px] leading-normal text-ink-faint">{s.startsAt ? fmtWhen(s.startsAt) + " IST" : ""}{mentor ? ` · ${mentor}` : ""}{s.startsAt && upcoming ? ` · ${relative(s.startsAt)}` : ""}</p>
          <div className="mt-2"><StatusPill tone={st.tone}>{st.label}</StatusPill></div>
        </div>
        {f && <div className="text-right"><p className="type-label text-ink-faint">Overall</p><p className={`tnum mt-1.5 font-display text-[30px] font-bold leading-none ${SCORE_TEXT[scoreTone(f.overall)]}`}>{f.overall.toFixed(1)}</p></div>}
      </div>
    </div>
  );

  return (
    <PortalPage width="max-w-[820px]">
      {sp.booked && <Flash tone="green">{s.status === "REQUESTED" ? "Request received. We&apos;ll confirm shortly." : "You&apos;re booked. A confirmation is on its way to your inbox."}</Flash>}
      {sp.moved && <Flash tone="green">Session moved. We&apos;ve told your mentor.</Flash>}
      {header}

      {upcoming && s.startsAt && (
        <div className="rounded-[11px] border border-line bg-card p-[18px]">
          {s.status === "CONFIRMED" && s.meetingUrl && <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="mb-3.5 inline-flex min-h-11 items-center rounded-lg bg-oxblood px-[18px] text-[13px] font-semibold leading-none text-white no-underline hover:bg-oxblood-deep hover:text-white hover:no-underline">Join meeting</a>}
          <SessionActions id={s.id} canMove={s.type !== "GD_BATCH" && canReschedule(s.startsAt, now, settings.cancelNoticeHours, s.rescheduleCount, settings.maxReschedules)}
            policyNote={cancelOutcome(s.startsAt, now, settings.cancelNoticeHours) === "RELEASE" ? `Cancelling now returns your credit. Free changes close ${settings.cancelNoticeHours} hours before the start.` : `This is inside the ${settings.cancelNoticeHours}-hour window, so cancelling uses the credit.`} />
        </div>
      )}

      {f && (
        <>
          <div className="rounded-[11px] border border-line bg-card p-[18px]">
            <h2 className="text-[13.5px] font-bold leading-none text-ink">Rubric</h2>
            <div className="mt-[13px] flex flex-col gap-[11px]">
              {RUBRIC.map((r) => scores[r] !== undefined && (
                <div key={r} className="flex items-center gap-3">
                  <span className="w-[132px] flex-none text-[12.5px] font-medium leading-[1.3] text-ink-2">{r}</span>
                  <div className="min-w-[60px] flex-1"><Meter pct={scores[r] * 10} tone={scoreTone(scores[r])} /></div>
                  <span className="tnum w-8 flex-none text-right text-[12.5px] font-semibold leading-none text-ink">{scores[r].toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <Insight title="What worked" tone="green">{lines(f.strengths).map((l) => <p key={l}>{l}</p>)}</Insight>
            <Insight title="What to fix" tone="oxblood">{lines(f.weaknesses).map((l) => <p key={l}>{l}</p>)}{lines(f.redFlags).map((l) => <p key={l}>{l}</p>)}</Insight>
            {f.answerFraming && <Insight title="Answer framing" tone="amber">{lines(f.answerFraming).map((l) => <p key={l}>{l}</p>)}</Insight>}
            {f.questionsToPrepare && <Insight title="Prepare next" tone="indigo">{lines(f.questionsToPrepare).map((l) => <p key={l}>{l}</p>)}</Insight>}
          </div>
          <div className="flex flex-wrap items-center gap-3.5 rounded-[11px] border border-line bg-card p-[18px]">
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[13.5px] font-bold leading-[1.3] text-ink">Rate this session</h2>
              <p className="mt-1 text-xs leading-[1.4] text-ink-faint">Only Samrudh sees your rating.</p>
            </div>
            <RatingPicker sessionId={s.id} initial={s.rating?.rating ?? null} />
          </div>
        </>
      )}
      {s.status === "COMPLETED" && !f && <Flash>Your mentor is writing up feedback. It&apos;s due {settings.feedbackDueHours} hours after the session.</Flash>}
    </PortalPage>
  );
}
