"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { adminBookSlotAction } from "@/app/admin/actions";

export interface Chip { slotId: string; mentorId: string; mentor: string; status: "OPEN" | "BOOKED" | "BLOCKED" | "HELD"; student?: string; admin?: boolean }
export interface CalRow { hour: string; cells: { iso: string; chips: Chip[]; past: boolean }[] }
export interface StudentOpt { id: string; label: string; credits: Record<string, number> }

const TYPES = [["MOCK_PI", "Mock PI", "PI"], ["STRATEGY_CALL", "Strategy call", "STRATEGY"], ["GUIDANCE", "Guidance call", "GUIDANCE"]] as const;
const FOCUS = [["HR_PROFILE", "HR / profile"], ["ACADEMICS", "Academics"], ["STRESS", "Stress"], ["INSTITUTE_FINAL", "Institute final"], ["CURRENT_AFFAIRS", "Current affairs"], ["CROSS_QUESTIONING", "Cross-questioning"]] as const;
const field = "min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px]";
const IST = "Asia/Kolkata";
const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).toUpperCase();

/** Week calendar: for every hour, which mentors are free (green), booked (dark) or blocked (grey). Click a free mentor to book a student with them. */
export function CalendarGrid({ days, rows, students }: { days: { label: string; date: string }[]; rows: CalRow[]; students: StudentOpt[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<{ chip: Chip; iso: string } | null>(null);
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState<string>("MOCK_PI");
  const [focus, setFocus] = useState<string>("HR_PROFILE");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const creditKind = TYPES.find((t) => t[0] === type)![2];
  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);

  const book = async () => {
    if (!sel || !studentId) return;
    setBusy(true); setMsg(null);
    const r = await adminBookSlotAction(studentId, sel.chip.slotId, type, type === "MOCK_PI" ? focus : null);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Booked.") : r.error });
    if (r.ok) { setSel(null); router.refresh(); }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="overflow-x-auto rounded-[11px] border border-line bg-card">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="w-16 px-2.5 py-2" />
              {days.map((d) => <th key={d.date} className="type-label px-2 py-2 text-ink-faint">{d.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.hour} className="border-b border-line-soft align-top last:border-b-0">
                <td className="tnum px-2.5 py-2 text-[11px] font-semibold text-ink-faint">{row.hour}</td>
                {row.cells.map((c) => (
                  <td key={c.iso} className={clsx("min-w-[112px] px-1.5 py-1.5", c.past && "bg-line-soft/40")}>
                    <div className="flex flex-col gap-1">
                      {c.chips.map((chip) => {
                        const open = chip.status === "OPEN" && !c.past;
                        const style = chip.status === "BOOKED" ? "bg-ink text-surface" : chip.status === "BLOCKED" ? "bg-line-soft text-ink-faint line-through" : chip.status === "HELD" ? "border border-amber-line bg-amber-tint text-amber-ink" : "border border-green/40 bg-green-tint text-green";
                        const text = chip.status === "BOOKED" ? `${chip.mentor} · ${chip.student ?? "booked"}` : chip.status === "HELD" ? `${chip.mentor} · held` : chip.mentor;
                        return open ? (
                          <button key={chip.slotId} type="button" onClick={() => { setSel({ chip, iso: c.iso }); setMsg(null); }} className={clsx("truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold leading-none hover:ring-2 hover:ring-green/50", style, sel?.chip.slotId === chip.slotId && "ring-2 ring-green")} title={`${chip.mentor} is free. Click to book a student.`}>
                            {chip.admin ? "★ " : ""}{text}
                          </button>
                        ) : (
                          <span key={chip.slotId} className={clsx("truncate rounded-md px-1.5 py-1 text-[11px] font-semibold leading-none", style, c.past && "opacity-50")} title={text}>{chip.admin ? "★ " : ""}{text}</span>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-faint">
        <span><span className="mr-1 inline-block size-2.5 rounded-sm border border-green/40 bg-green-tint align-middle" />free (click to book)</span>
        <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-ink align-middle" />booked</span>
        <span><span className="mr-1 inline-block size-2.5 rounded-sm border border-amber-line bg-amber-tint align-middle" />held</span>
        <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-line-soft align-middle" />blocked</span>
        <span>★ you</span>
      </div>

      {sel && (
        <div className="rounded-[11px] border border-ink bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[13px] font-semibold text-ink">Book with {sel.chip.mentor} · {when(sel.iso)} IST</p>
            <button type="button" onClick={() => setSel(null)} className="text-xs font-semibold text-ink-faint underline">Close</button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2.5">
            <div className="min-w-[220px] flex-1"><label className="type-label mb-1.5 block text-ink-faint">Student</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={clsx(field, "w-full")}>
                <option value="">Choose a student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select></div>
            <div><label className="type-label mb-1.5 block text-ink-faint">Session</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={field}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            {type === "MOCK_PI" && <div><label className="type-label mb-1.5 block text-ink-faint">Focus</label>
              <select value={focus} onChange={(e) => setFocus(e.target.value)} className={field}>{FOCUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>}
            <Button size="sm" disabled={!studentId || busy} onClick={book}>{busy ? "Booking…" : "Book"}</Button>
          </div>
          {student && <p className="mt-2 text-[12px] text-ink-faint">{student.label.split(" · ")[0]} has <strong className="text-ink-2">{student.credits[creditKind] ?? 0}</strong> {TYPES.find((t) => t[0] === type)![1].toLowerCase()} credit(s) left.</p>}
          {students.length === 0 && <p className="mt-2 text-[12px] text-ink-faint">There are no students yet.</p>}
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </div>
  );
}
