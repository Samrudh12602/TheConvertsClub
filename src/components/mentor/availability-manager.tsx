"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, Crown, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useMode } from "@/components/mentor/availability-mode";
import { addWindowAction, blockDateAction, copyWeekAction, toggleSlotAction } from "@/app/mentor/actions";

export function WindowForm({ defaultDate, weekStart }: { defaultDate: string; weekStart: string }) {
  const router = useRouter();
  const [v, setV] = useState({ date: defaultDate, from: "18:00", to: "21:00", repeatUntil: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [blockDay, setBlockDay] = useState(defaultDate);
  const [pending, start] = useTransition();
  const { direct } = useMode();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Done." : r.error ?? "Failed." }); if (r.ok) router.refresh(); });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
        <div className="min-w-[140px] flex-[1_1_140px]"><Field label="Date" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></div>
        <div className="min-w-[110px] flex-[1_1_110px]"><Field label="From" type="time" step={3600} value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} /></div>
        <div className="min-w-[110px] flex-[1_1_110px]"><Field label="To" type="time" step={3600} value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} /></div>
        <div className="min-w-[150px] flex-[1_1_150px]"><Field label="Repeat weekly until" type="date" value={v.repeatUntil} onChange={(e) => setV({ ...v, repeatUntil: e.target.value })} /></div>
        <Button disabled={pending} onClick={() => run(() => addWindowAction({ ...v, direct }))}>{direct ? "Add special hours" : "Add window"}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => copyWeekAction(weekStart))}>Copy last week</Button>
        <input type="date" aria-label="Date to block" value={blockDay} onChange={(e) => setBlockDay(e.target.value)} className="min-h-10 rounded-lg border border-line-strong bg-white px-2 text-[12.5px]" />
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => blockDateAction(blockDay))}>Block this date</Button>
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => blockDateAction(blockDay, true))}>Unblock</Button>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={clsx("text-xs leading-normal", msg.ok ? "text-green" : "text-oxblood")}>{msg.text}</p>}
    </div>
  );
}

export type Cell = { iso: string; state: "booked" | "open" | "special" | "blocked" | "none" | "past"; label?: string };

export function WeekGrid({ days, rows }: { days: string[]; rows: { hour: string; cells: Cell[] }[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { direct } = useMode();
  const click = (c: Cell) => { if (c.state === "past") return; start(async () => { setErr(null); const r = await toggleSlotAction(c.iso, direct); if (!r.ok) setErr(r.error); else router.refresh(); }); };
  return (
    <div>
      <div className="overflow-x-auto pb-3">
        <div className="min-w-[640px]" aria-busy={pending}>
          <div className="grid border-b border-line" style={{ gridTemplateColumns: "70px repeat(7, 1fr)" }}>
            <div />
            {days.map((d) => <div key={d} className="px-1 py-[9px] text-center text-[11px] font-semibold leading-[1.3] text-ink-2">{d}</div>)}
          </div>
          {rows.map((r) => (
            <div key={r.hour} className="grid items-stretch border-b border-[#F5F1EB]" style={{ gridTemplateColumns: "70px repeat(7, 1fr)" }}>
              <div className="tnum flex items-center px-2.5 py-[7px] text-[10.5px] font-medium leading-none text-ink-faint">{r.hour}</div>
              {r.cells.map((c) => (
                <div key={c.iso} className="p-[3px]">
                  {c.state === "booked" ? <div className="flex min-h-[34px] items-center gap-1 overflow-hidden rounded-lg bg-brand px-2 py-1.5 text-[10px] font-semibold leading-[1.2] text-white shadow-xs" title="Booked. Ask Samrudh to move it."><Lock aria-hidden className="size-3 flex-none" /><span className="truncate">{c.label ?? "Booked"}</span></div>
                  : c.state === "open" ? <button aria-label={direct ? "Free-time slot, click to turn it into a special paid slot" : "Open slot, click to remove"} onClick={() => click(c)} className="flex min-h-[34px] w-full items-center justify-center rounded-lg border border-teal-line bg-teal-tint text-teal transition hover:border-teal hover:shadow-card"><Check aria-hidden className="size-4" /></button>
                  : c.state === "special" ? <button aria-label={direct ? "Special paid slot, click to remove" : "Special paid slot, click to turn it into free time"} onClick={() => click(c)} className="flex min-h-[34px] w-full items-center justify-center rounded-lg border border-gold-line bg-gold-tint text-gold-deep transition hover:border-gold hover:shadow-card"><Crown aria-hidden className="size-4" /></button>
                  : c.state === "blocked" ? <div className="min-h-[34px] rounded-lg border border-line bg-[repeating-linear-gradient(45deg,#F0EBE4,#F0EBE4_4px,#E5DFD7_4px,#E5DFD7_8px)]" title="Blocked" />
                  : c.state === "past" ? <div className="min-h-[34px] rounded-lg bg-line-soft/40" />
                  : <button aria-label="Not offered, click to open this hour" onClick={() => click(c)} className="group flex min-h-[34px] w-full items-center justify-center rounded-lg border border-dashed border-line text-transparent transition hover:border-oxblood hover:bg-oxblood-tint hover:text-oxblood"><Plus aria-hidden className="size-4" /></button>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {err && <p role="alert" className="px-3.5 pb-3 text-xs text-oxblood">{err}</p>}
    </div>
  );
}
