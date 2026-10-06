import { notFound } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCircle2, Lightbulb, PlayCircle, Sparkles, Target, TrendingDown, TrendingUp, Video } from "lucide-react";
import { ProgressRing, RadarChart } from "@/components/ui/charts";
import { PortalPage } from "@/components/portal/portal-page";
import { Flash, Insight, Meter, StatusPill } from "@/components/portal/ui";
import { RatingPicker, SessionActions } from "@/components/student/session-actions";
import { db } from "@/lib/db";
import { fmtWhen, relative } from "@/lib/format";
import { RUBRIC, SESSION_STATUS, scoreTone, sessionTitle } from "@/lib/labels";
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
  // The student's previous piece of feedback, so a score can be read as "up" or "down" rather than in isolation.
  const prev = f ? await db.feedback.findFirst({ where: { id: { not: f.id }, submittedAt: { lt: f.submittedAt }, OR: [{ session: { studentId: user.id } }, { review: { studentId: user.id } }] }, orderBy: { submittedAt: "desc" } }) : null;
  const prevScores = (prev?.scores ?? {}) as Record<string, number>;
  const delta = f && prev ? f.overall - prev.overall : null;
  const rubric = RUBRIC.filter((r) => scores[r] !== undefined);
  const band = { green: "from-teal to-[#2a8c83]", amber: "from-gold to-[#d4a04a]", oxblood: "from-oxblood to-oxblood-hover", indigo: "from-indigo to-[#4a49a6]", stone: "from-ink-faint to-ink-muted" } as Record<string, string>;

  const header = (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <div className={`h-1.5 bg-gradient-to-r ${band[st.tone] ?? band.stone}`} />
      <div className="flex flex-wrap items-center justify-between gap-5 p-5">
        <div className="min-w-0 flex-[1_1_300px]">
          <div className="flex flex-wrap items-center gap-2.5"><StatusPill tone={st.tone}>{st.label}</StatusPill>{s.startsAt && upcoming && <span className="inline-flex items-center gap-1 text-xs font-semibold text-oxblood"><CalendarClock aria-hidden className="size-3.5" />{relative(s.startsAt)}</span>}</div>
          <h2 className="mt-2.5 font-display text-[24px] font-bold leading-[1.2] text-ink">{title}</h2>
          <p className="mt-1.5 text-[13px] leading-normal text-ink-muted">{s.startsAt ? fmtWhen(s.startsAt) + " IST" : ""}{mentor ? ` · with ${mentor}` : ""}</p>
          {s.recordingUrl && <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-ink no-underline shadow-xs transition hover:border-oxblood hover:no-underline"><PlayCircle aria-hidden className="size-4 text-oxblood" />Watch the recording</a>}
        </div>
        {f && (
          <div className="flex items-center gap-3.5">
            <ProgressRing value={f.overall} max={10} label={f.overall.toFixed(1)} size={96} stroke={9} tone={scoreTone(f.overall) === "green" ? "teal" : scoreTone(f.overall) === "amber" ? "gold" : "oxblood"} />
            <div>
              <p className="type-label text-ink-faint">Overall</p>
              {delta !== null ? (
                <p className={`mt-1 inline-flex items-center gap-1 text-[13px] font-semibold ${delta >= 0 ? "text-teal" : "text-oxblood"}`}>{delta >= 0 ? <TrendingUp aria-hidden className="size-4" /> : <TrendingDown aria-hidden className="size-4" />}{delta >= 0 ? "+" : ""}{delta.toFixed(1)} vs last</p>
              ) : <p className="mt-1 text-xs text-ink-faint">Your first score</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PortalPage width="max-w-[920px]">
      {sp.booked && <Flash tone="green">{s.status === "REQUESTED" ? "Request received. We\u2019ll confirm shortly." : "You\u2019re booked. A confirmation is on its way to your inbox."}</Flash>}
      {sp.moved && <Flash tone="green">Session moved. We&apos;ve told your mentor.</Flash>}
      {header}

      {upcoming && s.startsAt && (
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-night p-5 text-white shadow-lift ring-1 ring-white/5">
            <div>
              <p className="type-eyebrow text-dark-muted">{s.status === "CONFIRMED" ? "Ready when you are" : "Waiting on us"}</p>
              <h3 className="mt-2 font-display text-[18px] font-bold leading-[1.25]">{s.status === "CONFIRMED" ? "Your meeting link" : "We\u2019re confirming a mentor"}</h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-dark-soft">{s.status === "CONFIRMED" ? "Join a couple of minutes early. Keep your resume open in another tab." : "You\u2019ll get an email the moment it\u2019s confirmed. Nothing else to do."}</p>
            </div>
            {s.status === "CONFIRMED" && s.meetingUrl && <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[14px] font-semibold leading-none text-white no-underline shadow-glow transition hover:brightness-110 hover:text-white hover:no-underline"><Video aria-hidden className="size-4" />Join meeting</a>}
          </div>
          <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <p className="type-label text-ink-faint">Need to change plans?</p>
            <div className="mt-3">
              <SessionActions id={s.id} canMove={s.type !== "GD_BATCH" && canReschedule(s.startsAt, now, settings.cancelNoticeHours, s.rescheduleCount, settings.maxReschedules)}
                policyNote={cancelOutcome(s.startsAt, now, settings.cancelNoticeHours) === "RELEASE" ? `Cancelling now returns your credit. Free changes close ${settings.cancelNoticeHours} hours before the start.` : `This is inside the ${settings.cancelNoticeHours}-hour window, so cancelling uses the credit.`} />
            </div>
          </div>
        </div>
      )}

      {f && (
        <>
          <div className="grid gap-4 rounded-2xl border border-line bg-card p-5 shadow-card md:grid-cols-[minmax(0,260px)_1fr] md:items-center">
            <div className="mx-auto w-full max-w-[260px]">
              <RadarChart labels={rubric.map((r) => r.replace("Body language", "Body lang.").replace("Stress handling", "Stress").replace("Current affairs", "Curr. affairs").replace("Content depth", "Depth"))} values={rubric.map((r) => scores[r])} compare={prev ? rubric.map((r) => prevScores[r] ?? 0) : undefined} />
              {prev && <p className="mt-1 flex items-center justify-center gap-3 text-[10.5px] text-ink-faint"><span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-oxblood" />This session</span><span className="inline-flex items-center gap-1"><span className="h-0 w-4 border-t border-dashed border-ink-faint" />Previous</span></p>}
            </div>
            <div>
              <h2 className="text-[13.5px] font-bold leading-none text-ink">Rubric</h2>
              <div className="mt-4 flex flex-col gap-3">
                {rubric.map((r) => (
                  <div key={r} className="flex items-center gap-3">
                    <span className="w-[116px] flex-none text-[12.5px] font-medium leading-[1.3] text-ink-2">{r}</span>
                    <div className="min-w-[60px] flex-1"><Meter pct={scores[r] * 10} tone={scoreTone(scores[r])} /></div>
                    <span className="tnum w-8 flex-none text-right text-[12.5px] font-semibold leading-none text-ink">{scores[r].toFixed(1)}</span>
                    {prevScores[r] !== undefined && <span className={`tnum w-9 flex-none text-right text-[11px] font-semibold leading-none ${scores[r] >= prevScores[r] ? "text-teal" : "text-oxblood"}`}>{scores[r] >= prevScores[r] ? "+" : ""}{(scores[r] - prevScores[r]).toFixed(1)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <Insight title="What worked" tone="green" icon={<CheckCircle2 />}>{lines(f.strengths).map((l) => <p key={l}>{l}</p>)}</Insight>
            <Insight title="What to fix" tone="oxblood" icon={<Target />}>{lines(f.weaknesses).map((l) => <p key={l}>{l}</p>)}{lines(f.redFlags).map((l) => <p key={l} className="flex items-start gap-1.5 font-medium text-oxblood"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 flex-none" />{l}</p>)}</Insight>
            {f.answerFraming && <Insight title="Answer framing" tone="amber" icon={<Sparkles />}>{lines(f.answerFraming).map((l) => <p key={l}>{l}</p>)}</Insight>}
            {f.questionsToPrepare && <Insight title="Prepare next" tone="indigo" icon={<Lightbulb />}>{lines(f.questionsToPrepare).map((l) => <p key={l}>{l}</p>)}</Insight>}
          </div>
          <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-line bg-card p-5 shadow-card">
            <div className="min-w-[240px] flex-1">
              <h2 className="text-[13.5px] font-bold leading-[1.3] text-ink">How was this session?</h2>
              <p className="mt-1 text-xs leading-[1.4] text-ink-faint">Your mentor never sees your rating.</p>
            </div>
            <RatingPicker sessionId={s.id} initial={s.rating?.rating ?? null} initialComment={s.rating?.comment ?? ""} initialConsent={s.rating?.featureConsent ?? false} />
          </div>
        </>
      )}
      {s.status === "COMPLETED" && !f && <Flash>Your mentor is writing up feedback. It&apos;s due {settings.feedbackDueHours} hours after the session.</Flash>}
    </PortalPage>
  );
}
