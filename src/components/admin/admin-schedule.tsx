"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminAddHoursAction, adminBookForStudentAction, adminTimesForStudentAction, setAdminMentorModeAction } from "@/app/admin/actions";

const IST = "Asia/Kolkata";
const dayLabel = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
const timeLabel = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).toUpperCase();
const input = "min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px]";

/** Turns the owner's own mentor profile on or off ("Mentor mode"). */
export function MentorModeCard({ state }: { state: "off" | "on" | "paused" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = async (on: boolean) => { setBusy(true); setMsg(null); const r = await setAdminMentorModeAction(on); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Done.") : r.error }); if (r.ok) router.refresh(); };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 max-w-[560px]">
        <p className="text-[13px] leading-[1.55] text-ink-body">
          {state === "on" ? "Mentor mode is on. Open it to publish your hours and take sessions." : state === "paused" ? "Mentor mode is paused: students can't book you." : "Turn this on to take sessions yourself. Strategy calls (in the Call Convert packages) can only be booked with you, so students can't book them until you do."}
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-faint">Sessions you take earn no mentor pay: the whole fee stays with you (unless you switch on “Admin’s own sessions accrue pay” in Settings).</p>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-1.5 text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {state === "on" && <a href="/mentor/availability" className="inline-flex min-h-10 items-center rounded-lg bg-ink px-3.5 text-[12.5px] font-semibold text-white no-underline hover:text-white hover:no-underline">Set my hours</a>}
        {state === "on" ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => set(false)}>Pause</Button> : <Button size="sm" disabled={busy} onClick={() => set(true)}>{busy ? "…" : state === "paused" ? "Turn back on" : "Turn on mentor mode"}</Button>}
      </div>
    </div>
  );
}

/** Admin publishes hours on a mentor's behalf. */
export function AdminHoursForm({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const [v, setV] = useState({ date: "", from: "10:00", to: "13:00", repeatUntil: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form className="flex flex-wrap items-end gap-2.5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setMsg(null); const r = await adminAddHoursAction(mentorId, v); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Added.") : r.error }); if (r.ok) router.refresh(); }}>
      <div><label className="type-label mb-1.5 block text-ink-faint">Date</label><input aria-label="Date" type="date" required value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} className={input} /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">From (IST)</label><input aria-label="From (IST)" type="time" required value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} className={input} /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">To (IST)</label><input aria-label="To (IST)" type="time" required value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} className={input} /></div>
      <div><label className="type-label mb-1.5 block text-ink-faint">Repeat weekly until</label><input aria-label="Repeat weekly until" type="date" value={v.repeatUntil} onChange={(e) => setV({ ...v, repeatUntil: e.target.value })} className={input} /></div>
      <Button type="submit" size="sm" disabled={busy}>{busy ? "…" : "Add hours"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}

const TYPES = [["MOCK_PI", "Mock PI"], ["STRATEGY_CALL", "Strategy call"], ["GUIDANCE", "Guidance call"], ["PI_DIRECT", "PI with Samrudh"], ["STRATEGY_DIRECT", "Strategy call with Samrudh"], ["TRIAL_GUIDANCE", "Trial guidance call"], ["TRIAL_PI", "Trial mock PI"]] as const;
const FOCUS = [["HR_PROFILE", "HR / profile"], ["ACADEMICS", "Academics"], ["STRESS", "Stress"], ["INSTITUTE_FINAL", "Institute final"], ["CURRENT_AFFAIRS", "Current affairs"], ["CROSS_QUESTIONING", "Cross-questioning"]] as const;

/** Admin books a session for a student: normal rules, the student's own credit, the student gets the email. */
export function BookForStudent({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [type, setType] = useState<string>("MOCK_PI");
  const [focus, setFocus] = useState<string>("HR_PROFILE");
  const [times, setTimes] = useState<string[] | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const find = async () => {
    setBusy(true); setMsg(null); setPick(null);
    const r = await adminTimesForStudentAction(studentId, type, type === "MOCK_PI" ? focus : null);
    setBusy(false);
    if (r.ok) setTimes(r.times ?? []); else { setTimes(null); setMsg({ ok: false, text: r.error }); }
  };
  const book = async () => {
    if (!pick) return;
    setBusy(true); setMsg(null);
    const r = await adminBookForStudentAction(studentId, type, type === "MOCK_PI" ? focus : null, pick);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Booked.") : r.error });
    if (r.ok) { setTimes(null); setPick(null); router.refresh(); }
  };
  const days = times ? [...new Set(times.map(dayLabel))] : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2.5">
        <div><label className="type-label mb-1.5 block text-ink-faint">Session</label><select aria-label="Session" value={type} onChange={(e) => { setType(e.target.value); setTimes(null); setPick(null); }} className={input}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        {type === "MOCK_PI" && <div><label className="type-label mb-1.5 block text-ink-faint">Focus</label><select aria-label="Focus" value={focus} onChange={(e) => { setFocus(e.target.value); setTimes(null); setPick(null); }} className={input}>{FOCUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>}
        <Button size="sm" variant="secondary" disabled={busy} onClick={find}>{busy && !times ? "…" : "Find times"}</Button>
      </div>
      {times && (times.length === 0 ? <p className="text-[12.5px] text-ink-faint">No open times in the next 15 days. A mentor needs to publish hours first (see the mentor&apos;s page).</p> : (
        <div className="flex flex-col gap-2">
          {days.map((d) => (
            <div key={d} className="flex flex-wrap items-center gap-1.5">
              <span className="w-[88px] flex-none text-[11.5px] font-semibold text-ink-faint">{d}</span>
              {times.filter((t) => dayLabel(t) === d).map((t) => <button key={t} type="button" onClick={() => setPick(t)} className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold ${pick === t ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2 hover:border-ink"}`}>{timeLabel(t)}</button>)}
            </div>
          ))}
          <div className="pt-1"><Button size="sm" disabled={!pick || busy} onClick={book}>{busy ? "Booking…" : pick ? `Book ${dayLabel(pick)}, ${timeLabel(pick)} IST` : "Pick a time"}</Button></div>
        </div>
      ))}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </div>
  );
}
