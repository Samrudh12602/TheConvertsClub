"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
const TYPES = [["MOCK_PI", "Mock PI", "PI"], ["STRATEGY_CALL", "Strategy call", "STRATEGY"], ["GUIDANCE", "Guidance call", "GUIDANCE"]] as const;

interface Props {
  credits: Record<string, number>;
  guidancePrice: string;
  /** Reschedule mode: type and focus are fixed by the existing session. */
  reschedule?: { sessionId: string; type: string; focus: string | null; label: string };
}

export function BookFlow({ credits, guidancePrice, reschedule }: Props) {
  const router = useRouter();
  const [type, setType] = useState(reschedule?.type ?? "MOCK_PI");
  const [focus, setFocus] = useState<string | null>(reschedule?.focus ?? "HR_PROFILE");
  const [data, setData] = useState<{ key: string; times: string[] } | null>(null);
  const [reloadN, setReloadN] = useState(0);
  const [day, setDay] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [hold, setHold] = useState<{ slotId: string; until: number } | null>(null);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const holdRef = useRef<string | null>(null);

  const key = `${type}|${type === "MOCK_PI" ? focus : ""}`;
  const times = data?.key === key ? data.times : null;

  // Fetch bookable times whenever the choice changes (state is set only after the await).
  useEffect(() => {
    let cancelled = false;
    getTimesAction(type, type === "MOCK_PI" ? focus : null).then((r) => {
      if (cancelled) return;
      if (!r.ok) { setError(r.error); setData({ key, times: [] }); return; }
      setData({ key, times: r.times });
    });
    return () => { cancelled = true; };
  }, [key, reloadN, type, focus]);

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
    const r = await holdAction(type, type === "MOCK_PI" ? focus : null, iso);
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
  const card = "rounded-[11px] border border-line bg-card p-4";
  const step = "type-label text-ink-faint";

  return (
    <div className="flex max-w-[760px] flex-col gap-3.5">
      {reschedule && <Flash>Moving <strong>{reschedule.label}</strong>. Your credit stays reserved; pick a new time below.</Flash>}
      {error && <Flash tone="oxblood">{error}</Flash>}

      {!reschedule && (
        <div className={card}>
          <p className={step}>Step 1 · What kind of session</p>
          <div className="mt-[11px] flex flex-wrap gap-2">
            {TYPES.map(([id, label, kind]) => {
              const n = credits[kind] ?? 0;
              const on = type === id;
              if (n === 0 && kind === "GUIDANCE") return <Link key={id} href="/student/payments" className="min-h-11 flex-[1_1_168px] rounded-[9px] border border-line-strong bg-white p-3 text-ink-body no-underline hover:border-ink hover:no-underline"><span className="block text-[13px] font-semibold leading-[1.3]">{label}</span><span className="mt-1 block text-[11.5px] text-ink-faint">Buy · {guidancePrice}</span></Link>;
              return (
                <button key={id} type="button" disabled={n === 0} aria-pressed={on} onClick={() => choose(id, id === "MOCK_PI" ? focus ?? "HR_PROFILE" : null)}
                  className={clsx("min-h-11 flex-[1_1_168px] rounded-[9px] border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50", on ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink")}>
                  <span className="block text-[13px] font-semibold leading-[1.3]">{label}</span>
                  <span className={clsx("mt-1 block text-[11.5px] leading-[1.4]", on ? "text-dark-soft" : "text-ink-faint")}>{n} credit{n === 1 ? "" : "s"} left</span>
                </button>
              );
            })}
            <Link href="/student/gd" className="min-h-11 flex-[1_1_168px] rounded-[9px] border border-line-strong bg-white p-3 text-ink-body no-underline hover:border-ink hover:no-underline"><span className="block text-[13px] font-semibold leading-[1.3]">GD / GE batch</span><span className="mt-1 block text-[11.5px] text-ink-faint">{credits.GD ?? 0} credit{(credits.GD ?? 0) === 1 ? "" : "s"} · choose a batch</span></Link>
          </div>
        </div>
      )}

      {type === "MOCK_PI" && !reschedule && (
        <div className={card}>
          <p className={step}>Step 2 · Focus area</p>
          <div className="mt-[11px] flex flex-wrap gap-[7px]">
            {FOCUS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={focus === id} onClick={() => choose(type, id)}
                className={clsx("min-h-11 rounded-lg border px-[13px] text-[12.5px] font-medium", focus === id ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink")}>{label}</button>
            ))}
          </div>
        </div>
      )}

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <p className={step}>{reschedule ? "Pick a new time" : `Step ${type === "MOCK_PI" ? 3 : 2} · Pick a slot`} · IST</p>
          <p className="text-[11.5px] text-ink-faint">All slots are 1 hour</p>
        </div>
        {times === null ? <p className="mt-4 text-[13px] text-ink-faint">Loading times…</p> : days.length === 0 ? (
          <p className="mt-4 text-[13px] leading-normal text-ink-muted">No open slots in the next two weeks for this choice. Mentors release new hours every Sunday.</p>
        ) : (
          <>
            <div className="mt-3 flex gap-[7px] overflow-x-auto pb-1" role="tablist" aria-label="Day">
              {days.map((d) => { const p = parts(byDay.get(d)![0]); const on = d === activeDay; return (
                <button key={d} role="tab" aria-selected={on} onClick={() => setDay(d)} className={clsx("w-[62px] flex-none rounded-[9px] border px-1 py-[9px] text-center", on ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink")}>
                  <span className={clsx("block text-[10px] font-semibold uppercase leading-none tracking-[0.06em]", on ? "text-dark-soft" : "text-ink-faint")}>{p.dow}</span>
                  <span className="mt-[5px] block font-display text-[17px] font-bold leading-none">{p.num}</span>
                  <span className={clsx("mt-[5px] block text-[10px] font-medium leading-none", on ? "text-dark-soft" : "text-ink-faint")}>{byDay.get(d)!.length} free</span>
                </button>); })}
            </div>
            <div className="mt-3.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }}>
              {(activeDay ? byDay.get(activeDay) ?? [] : []).map((t) => (
                <button key={t} disabled={busy} aria-pressed={picked === t} onClick={() => pick(t)}
                  className={clsx("tnum flex min-h-11 items-center justify-center rounded-lg border px-2 text-[13px] font-semibold", picked === t ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink")}>{parts(t).time}</button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3.5 rounded-[11px] bg-ink p-4">
        <div className="min-w-0 flex-[1_1_220px]">
          {picked && hold ? (
            <>
              <p className="text-[13.5px] font-semibold leading-[1.3] text-surface">{reschedule ? reschedule.label : `${typeMeta[1]}${type === "MOCK_PI" ? ` · ${FOCUS.find((f) => f[0] === focus)?.[1]}` : ""}`} · {parts(picked).full}, {parts(picked).time}</p>
              <p className="mt-1 text-xs leading-[1.4] text-dark-soft">{reschedule ? "Keeps your reserved credit" : `Uses 1 credit · ${Math.max(0, left0 - 1)} left after this`} · slot held for <span className="tnum">{mm}</span></p>
            </>
          ) : <p className="text-[13px] leading-[1.4] text-dark-soft">Choose a time to hold it while you confirm.</p>}
        </div>
        <Button variant="onDark" disabled={!hold || busy} onClick={confirm} className="min-h-11">{busy ? "Working…" : reschedule ? "Confirm new time" : "Confirm booking"}</Button>
      </div>
    </div>
  );
}
