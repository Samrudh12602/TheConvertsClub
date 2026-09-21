"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { addWindowAction, blockDateAction, copyWeekAction, toggleSlotAction } from "@/app/mentor/actions";

export function WindowForm({ defaultDate, weekStart }: { defaultDate: string; weekStart: string }) {
  const router = useRouter();
  const [v, setV] = useState({ date: defaultDate, from: "18:00", to: "21:00", repeatUntil: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [blockDay, setBlockDay] = useState(defaultDate);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Done." : r.error ?? "Failed." }); if (r.ok) router.refresh(); });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 rounded-[11px] border border-line bg-card p-4">
        <div className="min-w-[140px] flex-[1_1_140px]"><Field label="Date" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></div>
        <div className="min-w-[110px] flex-[1_1_110px]"><Field label="From" type="time" step={3600} value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} /></div>
        <div className="min-w-[110px] flex-[1_1_110px]"><Field label="To" type="time" step={3600} value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} /></div>
        <div className="min-w-[150px] flex-[1_1_150px]"><Field label="Repeat weekly until" type="date" value={v.repeatUntil} onChange={(e) => setV({ ...v, repeatUntil: e.target.value })} /></div>
        <Button disabled={pending} onClick={() => run(() => addWindowAction(v))}>Add window</Button>
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

export type Cell = { iso: string; state: "booked" | "open" | "blocked" | "none" | "past"; label?: string };

export function WeekGrid({ days, rows }: { days: string[]; rows: { hour: string; cells: Cell[] }[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const click = (c: Cell) => { if (c.state === "past") return; start(async () => { setErr(null); const r = await toggleSlotAction(c.iso); if (!r.ok) setErr(r.error); else router.refresh(); }); };
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
                  {c.state === "booked" ? <div className="min-h-[30px] overflow-hidden text-ellipsis whitespace-nowrap rounded-[5px] bg-oxblood px-[5px] py-1.5 text-[9.5px] font-semibold leading-[1.2] text-white" title="Booked. Ask Samrudh to move it.">{c.label}</div>
                  : c.state === "open" ? <button aria-label="Open slot, click to remove" onClick={() => click(c)} className="min-h-[30px] w-full rounded-[5px] border border-[#DED3C4] bg-[#EFE7DC] hover:bg-[#E3D9CA]" />
                  : c.state === "blocked" ? <div className="min-h-[30px] rounded-[5px] border border-[#DED3C4] bg-[repeating-linear-gradient(45deg,#F0EBE4,#F0EBE4_4px,#E5DFD7_4px,#E5DFD7_8px)]" title="Blocked" />
                  : c.state === "past" ? <div className="min-h-[30px]" />
                  : <button aria-label="Not offered, click to open this hour" onClick={() => click(c)} className="min-h-[30px] w-full rounded-[5px] border border-dashed border-line hover:border-[#B9AF9F]" />}
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
