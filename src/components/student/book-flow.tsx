"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, BadgeCheck, UserCheck, CalendarClock, CheckCircle2, Clock3, Compass, Crown, Lightbulb, Mic, Moon, Sun, Sunset, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/charts";
import { ConfirmDialog } from "@/components/ui/dialog";
import { nowMs } from "@/lib/datetime";
import { Flash } from "@/components/portal/ui";
import { confirmBookingAction, getTimesAction, holdAction, releaseHoldAction, rescheduleAction } from "@/app/student/actions";

const IST = "Asia/Kolkata";
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date(iso)); // YYYY-MM-DD
const parts = (iso: string) => {
  const d = new Date(iso);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...o }).format(d);
  return { dow: f({ weekday: "short" }), num: f({ day: "numeric" }), time: f({ hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase(), full: f({ weekday: "short", day: "numeric", month: "short" }) };
};

const FOCUS = [["HR_PROFILE", "HR / profile"], ["ACADEMICS", "Academics"], ["STRESS", "Stress"], ["INSTITUTE_FINAL", "Institute final"], ["CURRENT_AFFAIRS", "Current affairs"], ["CROSS_QUESTIONING", "Cross-questioning"]] as const;
const FOCUS_HINT: Record<string, string> = { HR_PROFILE: "Your story, why MBA, work-ex", ACADEMICS: "Subjects, projects, marks", STRESS: "Pushback and pressure", INSTITUTE_FINAL: "Full panel dry-run", CURRENT_AFFAIRS: "News and opinions", CROSS_QUESTIONING: "Defend every claim" };
const TYPE_ICON: Record<string, React.ReactNode> = { MOCK_PI: <Mic />, STRATEGY_CALL: <Compass />, GUIDANCE: <Lightbulb />, PI_DIRECT: <Crown />, STRATEGY_DIRECT: <Crown />, TRIAL_GUIDANCE: <Lightbulb />, TRIAL_PI: <Mic />, PANEL_PI: <Users /> };
const PART = (iso: string) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "numeric", hour12: false }).format(new Date(iso))) % 24;
const DAYPARTS = [["Morning", <Sun key="m" />, (h: number) => h < 12], ["Afternoon", <Sunset key="a" />, (h: number) => h >= 12 && h < 17], ["Evening", <Moon key="e" />, (h: number) => h >= 17]] as const;
const TYPES = [["MOCK_PI", "Mock PI", "PI"], ["STRATEGY_CALL", "Strategy call", "STRATEGY"], ["GUIDANCE", "Guidance call", "GUIDANCE"], ["PI_DIRECT", "PI with Samrudh", "PI_DIRECT"], ["STRATEGY_DIRECT", "Strategy call with Samrudh", "STRATEGY_DIRECT"], ["TRIAL_GUIDANCE", "Trial guidance call · 25 min", "TRIAL_GUIDANCE"], ["TRIAL_PI", "Trial mock PI", "TRIAL_PI"], ["PANEL_PI", "Panel PI · 3 panelists", "PANEL_PI"]] as const;

interface Props {
  credits: Record<string, number>;
  guidancePrice: string;
  /** Reschedule mode: type and focus are fixed by the existing session. */
  reschedule?: { sessionId: string; type: string; focus: string | null; label: string };
  /** Rebooking a mentor the student has already had a session with. */
  rebook?: { mentorId: string; name: string };
  initialType?: string;
  initialFocus?: string;
}

function StepHead({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 flex-none items-center justify-center rounded-full bg-brand font-display text-[13px] font-bold text-white shadow-glow">{n}</span>
      <div><h2 className="font-display text-[16px] font-bold leading-[1.2] text-ink">{title}</h2>{hint && <p className="mt-0.5 text-[12px] leading-[1.4] text-ink-faint">{hint}</p>}</div>
    </div>
  );
}

export function BookFlow({ credits, guidancePrice, reschedule, rebook, initialType, initialFocus }: Props) {
  const router = useRouter();
  const [type, setType] = useState(reschedule?.type ?? initialType ?? TYPES.find(([, , k]) => (credits[k] ?? 0) > 0)?.[0] ?? "MOCK_PI");
  const [focus, setFocus] = useState<string | null>(reschedule?.focus ?? initialFocus ?? "HR_PROFILE");
  const [data, setData] = useState<{ key: string; times: string[] } | null>(null);
  const [reloadN, setReloadN] = useState(0);
  const [day, setDay] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [hold, setHold] = useState<{ slotId: string; until: number } | null>(null);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const holdRef = useRef<string | null>(null);

  const [anyMentor, setAnyMentor] = useState(false);
  const [askPanel, setAskPanel] = useState(false);
  const mentorId = rebook && !anyMentor ? rebook.mentorId : null;
  const key = `${type}|${type === "MOCK_PI" ? focus : ""}|${mentorId ?? ""}`;
  const times = data?.key === key ? data.times : null;

  // Fetch bookable times whenever the choice changes (state is set only after the await).
  useEffect(() => {
    let cancelled = false;
    getTimesAction(type, type === "MOCK_PI" ? focus : null, mentorId).then((r) => {
      if (cancelled) return;
      if (!r.ok) { setError(r.error); setData({ key, times: [] }); return; }
      setData({ key, times: r.times });
    });
    return () => { cancelled = true; };
  }, [key, reloadN, type, focus, mentorId]);

  const dropHold = useCallback(() => {
    if (holdRef.current) void releaseHoldAction(holdRef.current);
    holdRef.current = null; setHold(null); setPicked(null);
  }, []);
  const reload = () => setReloadN((n) => n + 1);
  const choose = (t: string, f: string | null) => { dropHold(); setError(null); setType(t); setFocus(f); };

  // Countdown on the hold; when it hits zero the slot is released server-side by the cron too.
  useEffect(() => {
    if (!hold) return;
    const i = setInterval(() => {
      const s = Math.max(0, Math.round((hold.until - nowMs()) / 1000));
      setLeft(s);
      if (s === 0) { holdRef.current = null; setHold(null); setPicked(null); setError("Your hold expired. Pick a time again."); setReloadN((n) => n + 1); }
    }, 1000);
    return () => clearInterval(i);
  }, [hold]);

  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const t of times ?? []) { const k = dayKey(t); m.set(k, [...(m.get(k) ?? []), t]); }
    return m;
  }, [times]);
  const days = useMemo(() => [...byDay.keys()], [byDay]);
  const activeDay = day && byDay.has(day) ? day : days[0] ?? null;

  async function pick(iso: string) {
    setError(null); setBusy(true);
    const r = await holdAction(type, type === "MOCK_PI" ? focus : null, iso, mentorId);
    setBusy(false);
    if (!r.ok) { setError(r.error); reload(); return; }
    holdRef.current = r.slotId;
    setPicked(iso);
    const until = new Date(r.heldUntil).getTime();
    setLeft(Math.max(0, Math.round((until - nowMs()) / 1000)));
    setHold({ slotId: r.slotId, until });
  }

  async function confirm() {
    if (!hold) return;
    setBusy(true); setError(null);
    if (reschedule) {
      const r = await rescheduleAction(reschedule.sessionId, hold.slotId);
      setBusy(false);
      if (!r.ok) { setError(r.error); if (/expired/i.test(r.error)) reload(); return; }
      holdRef.current = null;
      router.push(`/student/sessions/${reschedule.sessionId}?moved=1`);
      return;
    }
    const r = await confirmBookingAction(hold.slotId, type, type === "MOCK_PI" ? focus : null);
    setBusy(false);
    if (!r.ok) { setError(r.error); if (/expired|took that/i.test(r.error)) reload(); return; }
    holdRef.current = null;
    router.push(`/student/sessions/${r.sessionId}?booked=1`);
  }

  const typeMeta = TYPES.find((t) => t[0] === type)!;
  const left0 = credits[typeMeta[2]] ?? 0;
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const card = "rounded-2xl border border-line bg-card p-5 shadow-card";
  const stepNo = reschedule ? 1 : type === "MOCK_PI" ? 3 : 2;
  const dayTimes = activeDay ? byDay.get(activeDay) ?? [] : [];
  const focusLabel = FOCUS.find((f) => f[0] === focus)?.[1];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {reschedule && <Flash>Moving <strong>{reschedule.label}</strong>. Your credit stays reserved; pick a new time below.</Flash>}
        {error && <Flash tone="oxblood">{error}</Flash>}
        {rebook && !reschedule && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-teal-line bg-teal-tint p-3.5">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-teal text-white"><UserCheck aria-hidden className="size-[18px]" /></span>
            <p className="min-w-0 flex-1 text-[13px] leading-[1.45] text-ink-2">{anyMentor ? <>Showing times with <strong>any mentor</strong>.</> : <>Booking <strong>{rebook.name}</strong> again. Only their open times show below.</>}</p>
            <button type="button" onClick={() => { dropHold(); setAnyMentor((v) => !v); }} className="rounded-lg border border-teal-line bg-white px-3 py-1.5 text-xs font-semibold text-teal transition hover:border-teal">{anyMentor ? `Back to ${rebook.name}` : "Show any mentor"}</button>
          </div>
        )}

        {!reschedule && (
          <div className={card}>
            <StepHead n={1} title="What kind of session?" hint="Each type draws on its own credit." />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {TYPES.map(([id, label, kind]) => {
                const n = credits[kind] ?? 0;
                const on = type === id;
                if (n === 0 && (kind === "PI_DIRECT" || kind === "STRATEGY_DIRECT" || kind === "TRIAL_GUIDANCE" || kind === "TRIAL_PI" || kind === "PANEL_PI")) return null; // only shown to people who bought it
                const inner = (sub: React.ReactNode, active: boolean) => (
                  <>
                    <span className={clsx("flex size-10 flex-none items-center justify-center rounded-xl [&>svg]:size-5", active ? "bg-white/15 text-white" : "bg-oxblood-tint text-oxblood")}>{TYPE_ICON[id]}</span>
                    <span className="min-w-0"><span className="block text-[13.5px] font-semibold leading-[1.3]">{label}</span><span className={clsx("mt-0.5 block text-[11.5px] leading-[1.4]", active ? "text-white/70" : "text-ink-faint")}>{sub}</span></span>
                    {active && <CheckCircle2 aria-hidden className="ml-auto size-5 flex-none text-white" />}
                  </>
                );
                if (n === 0 && kind === "GUIDANCE") return <Link key={id} href="/student/payments" className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-white p-3.5 text-ink-body no-underline transition hover:border-oxblood hover:no-underline">{inner(`Buy · ${guidancePrice}`, false)}</Link>;
                return (
                  <button key={id} type="button" disabled={n === 0} aria-pressed={on} onClick={() => choose(id, id === "MOCK_PI" ? focus ?? "HR_PROFILE" : null)}
                    className={clsx("flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50", on ? "border-transparent bg-brand text-white shadow-glow" : "border-line-strong bg-white text-ink-body hover:-translate-y-px hover:border-oxblood hover:shadow-card")}>
                    {inner(`${n} credit${n === 1 ? "" : "s"} left`, on)}
                  </button>
                );
              })}
              <Link href="/student/gd" className="flex items-center gap-3 rounded-xl border border-line-strong bg-white p-3.5 text-ink-body no-underline transition hover:-translate-y-px hover:border-oxblood hover:shadow-card hover:no-underline">
                <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-teal-tint text-teal [&>svg]:size-5"><Users /></span>
                <span className="min-w-0"><span className="block text-[13.5px] font-semibold leading-[1.3]">GD / GE batch</span><span className="mt-0.5 block text-[11.5px] leading-[1.4] text-ink-faint">{credits.GD ?? 0} credit{(credits.GD ?? 0) === 1 ? "" : "s"} · choose a batch</span></span>
                <ArrowRight aria-hidden className="ml-auto size-4 flex-none text-ink-faint" />
              </Link>
            </div>
          </div>
        )}

        {type === "MOCK_PI" && !reschedule && (
          <div className={card}>
            <StepHead n={2} title="Pick a focus" hint="Your mentor builds the interview around this." />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FOCUS.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={focus === id} onClick={() => choose(type, id)}
                  className={clsx("rounded-xl border p-3 text-left transition-all duration-200", focus === id ? "border-oxblood bg-oxblood-tint shadow-xs ring-1 ring-oxblood/30" : "border-line-strong bg-white hover:border-oxblood")}>
                  <span className="block text-[13px] font-semibold leading-[1.3] text-ink">{label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-[1.35] text-ink-faint">{FOCUS_HINT[id]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <StepHead n={stepNo} title={reschedule ? "Pick a new time" : "Choose a day and time"} hint="All times in IST · every slot is one hour" />
          </div>
          {times === null ? (
            <div className="mt-4 flex gap-2" aria-busy>{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[74px] w-[66px] flex-none animate-shimmer rounded-xl bg-shimmer" />)}</div>
          ) : days.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl bg-surface px-4 py-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-line-soft text-ink-faint"><CalendarClock className="size-5" /></span>
              <p className="mt-3 text-[13.5px] font-semibold text-ink">No open slots in the next two weeks</p>
              <p className="mt-1 max-w-[40ch] text-[12.5px] leading-normal text-ink-muted">{mentorId ? `${rebook?.name} has no open times that fit right now. Try “Show any mentor”, or check back after Sunday.` : "Mentors release new hours every Sunday. Try another focus or check back then."}</p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1.5" role="tablist" aria-label="Day">
                {days.map((d) => { const p = parts(byDay.get(d)![0]); const on = d === activeDay; return (
                  <button key={d} role="tab" aria-selected={on} onClick={() => setDay(d)} className={clsx("w-[66px] flex-none rounded-xl border px-1 py-2.5 text-center transition-all duration-200", on ? "border-transparent bg-brand text-white shadow-glow" : "border-line-strong bg-white text-ink-body hover:border-oxblood")}>
                    <span className={clsx("block text-[10px] font-semibold uppercase leading-none tracking-[0.06em]", on ? "text-white/75" : "text-ink-faint")}>{p.dow}</span>
                    <span className="mt-1.5 block font-display text-[20px] font-bold leading-none">{p.num}</span>
                    <span className={clsx("mt-1.5 block text-[10px] font-medium leading-none", on ? "text-white/75" : "text-teal")}>{byDay.get(d)!.length} free</span>
                  </button>); })}
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {DAYPARTS.map(([name, icon, test]) => {
                  const list = dayTimes.filter((t) => test(PART(t)));
                  if (!list.length) return null;
                  return (
                    <div key={name}>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint [&>svg]:size-3.5">{icon}{name}</p>
                      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }}>
                        {list.map((t) => (
                          <button key={t} disabled={busy} aria-pressed={picked === t} onClick={() => pick(t)}
                            className={clsx("tnum flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-[13px] font-semibold transition-all duration-200", picked === t ? "border-transparent bg-brand text-white shadow-glow" : "border-line-strong bg-white text-ink-body hover:-translate-y-px hover:border-oxblood hover:shadow-card")}>
                            {picked === t && <CheckCircle2 aria-hidden className="size-4" />}{parts(t).time}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <aside className="sticky bottom-4 flex flex-col gap-3.5 rounded-2xl bg-night p-5 text-white shadow-lift ring-1 ring-white/5 lg:top-[84px] lg:bottom-auto">
        <p className="type-eyebrow text-dark-muted">Your booking</p>
        <div>
          <h3 className="font-display text-[19px] font-bold leading-[1.25]">{reschedule ? reschedule.label : typeMeta[1]}</h3>
          {type === "MOCK_PI" && !reschedule && focusLabel && <p className="mt-1 text-[12.5px] text-dark-soft">Focus · {focusLabel}</p>}
        </div>
        {picked && hold ? (
          <div className="flex items-center gap-3.5 rounded-xl bg-white/[0.06] p-3.5">
            <ProgressRing value={left} max={600} label={mm} size={62} stroke={5} tone="gold" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13.5px] font-semibold leading-[1.3]"><Clock3 aria-hidden className="size-4 flex-none text-gold" />{parts(picked).full}</p>
              <p className="tnum mt-0.5 text-[15px] font-bold">{parts(picked).time} <span className="text-[11px] font-medium text-dark-soft">IST</span></p>
              <p className="mt-1 text-[11.5px] leading-[1.4] text-dark-soft">Held for you · {mm} left</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 p-3.5 text-[12.5px] leading-[1.5] text-dark-soft">Pick a time and we&apos;ll hold it for you while you confirm.</div>
        )}
        <ul className="flex flex-col gap-1.5 text-[12px] leading-[1.45] text-dark-soft">
          <li className="flex items-start gap-2"><BadgeCheck aria-hidden className="mt-0.5 size-3.5 flex-none text-teal" />{reschedule ? "Keeps your reserved credit" : `Uses 1 credit · ${Math.max(0, left0 - (picked ? 1 : 0))} left ${picked ? "after this" : ""}`}</li>
          {type === "PANEL_PI" ? <li className="flex items-start gap-2 rounded-lg bg-gold/15 p-2 text-gold"><BadgeCheck aria-hidden className="mt-0.5 size-3.5 flex-none" /><span><strong>Can&apos;t be cancelled or moved once booked.</strong> Three panelists, one hour in total with the live debrief. We confirm your panelists after you book.</span></li> : <li className="flex items-start gap-2"><BadgeCheck aria-hidden className="mt-0.5 size-3.5 flex-none text-teal" />Free to move up to your notice period</li>}
          <li className="flex items-start gap-2"><BadgeCheck aria-hidden className="mt-0.5 size-3.5 flex-none text-teal" />Written feedback after the session</li>
        </ul>
        <Button variant="onDark" size="lg" disabled={!hold || busy} onClick={() => (type === "PANEL_PI" && !reschedule ? setAskPanel(true) : confirm())} className="min-h-12 w-full">{busy ? "Working…" : reschedule ? "Confirm new time" : "Confirm booking"}</Button>
      </aside>
      <ConfirmDialog open={askPanel} onClose={() => setAskPanel(false)} danger title="Once booked, a Panel PI can't be cancelled" confirmLabel="Yes, book it" busy={busy}
        body={<>A Panel PI holds the hour for three people, so <strong>you can&apos;t cancel or move it after booking</strong>. If something urgent comes up, message us: only we can cancel it, and your credit comes straight back. Book this time?</>}
        onConfirm={() => { setAskPanel(false); void confirm(); }} />
    </div>
  );
}
