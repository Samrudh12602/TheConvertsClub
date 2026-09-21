"use client";

import { useState } from "react";
import { Sparkles, UserCheck, Plus, AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { ISTChip } from "@/components/ui/date-strip";
import { sessions, mentors, type Session } from "@/lib/data";
import { formatDate } from "@/lib/format";

const HOURS = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

export function SchedulerClient() {
  const [assignTarget, setAssignTarget] = useState<Session | null>(null);
  const [autoAssign, setAutoAssign] = useState(false);
  const [gdModalOpen, setGdModalOpen] = useState(false);
  const [assigned, setAssigned] = useState<Record<string, string>>({});

  const unassigned = sessions.filter((s) => s.status === "requested" && !assigned[s.id]);
  const laneMentors = mentors.filter((m) => m.status === "active").slice(0, 5);

  const bookedForMentorSlot = (mentorId: string, time: string) =>
    sessions.find((s) => s.mentorId === mentorId && s.startTime === time && s.status !== "cancelled") ||
    (assigned[time + mentorId] ? { type: "Assigned", studentName: "—" } : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Scheduler & allocation</h1>
          <p className="text-sm text-muted mt-1">{unassigned.length} sessions need a mentor.</p>
        </div>
        <div className="flex items-center gap-2">
          <ISTChip className="hidden sm:inline-flex" />
          <label className="flex items-center gap-2 text-xs font-semibold text-ink rounded-full border border-hairline px-3 py-1.5">
            <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold-500)]" />
            Auto-assign rules
          </label>
          <Button size="sm" variant="outline" onClick={() => setGdModalOpen(true)}>
            <Plus size={14} /> Create GD batch
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        {/* Unassigned queue */}
        <Card padding="sm">
          <CardHeader title="Unassigned queue" className="px-1" />
          <div className="space-y-2.5">
            {unassigned.length === 0 && <p className="text-sm text-muted px-1">All sessions assigned.</p>}
            {unassigned.map((s) => (
              <button
                key={s.id}
                onClick={() => setAssignTarget(s)}
                className="w-full text-left rounded-[var(--radius-md)] border border-hairline p-3 hover:border-brand"
              >
                <p className="text-sm font-medium text-ink">
                  {s.type} {s.focus && `· ${s.focus}`}
                </p>
                <p className="text-xs text-muted mt-0.5">{s.studentName}</p>
                <p className="text-xs text-muted">
                  {formatDate(s.date, { month: "short" })} · {s.startTime}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Swim lanes */}
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-hairline bg-sunken/50">
                <th className="px-3 py-3 text-left font-semibold text-muted w-36">Mentor</th>
                {HOURS.map((h) => (
                  <th key={h} className="px-2 py-3 text-center font-semibold text-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-hairline bg-gold-500/5">
                <td className="px-3 py-2.5 font-semibold text-ink whitespace-nowrap">Samrudh (you)</td>
                {HOURS.map((h) => (
                  <td key={h} className="px-1.5 py-1.5 text-center">
                    <div className="h-8 rounded-[6px] border border-dashed border-border-strong" />
                  </td>
                ))}
              </tr>
              {laneMentors.map((m) => (
                <tr key={m.id} className="border-b border-hairline last:border-0">
                  <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">{m.name}</td>
                  {HOURS.map((h) => {
                    const booking = bookedForMentorSlot(m.id, h);
                    return (
                      <td key={h} className="px-1.5 py-1.5 text-center">
                        {booking ? (
                          <div className="h-8 rounded-[6px] bg-info-bg border border-info/30 flex items-center justify-center text-[10px] font-semibold text-info px-1 truncate">
                            {booking.type}
                          </div>
                        ) : (
                          <div className="h-8 rounded-[6px] bg-success-bg/40 border border-success/20" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Assign panel */}
      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign a mentor" size="md">
        {assignTarget && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-3.5">
              <p className="text-sm font-semibold text-ink">
                {assignTarget.type} {assignTarget.focus && `· ${assignTarget.focus}`}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {assignTarget.studentName} · {formatDate(assignTarget.date, { month: "short" })} ·{" "}
                {assignTarget.startTime}
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-accent/30 bg-gold-500/10 p-3.5">
              <Sparkles size={16} className="text-accent-strong shrink-0 mt-0.5" />
              <p className="text-sm text-ink">
                Best match: <strong>{laneMentors[0]?.name}</strong> — free at this time, lowest load this week.
              </p>
            </div>

            <div className="space-y-2">
              {laneMentors.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setAssigned((a) => ({ ...a, [assignTarget.id]: m.id }));
                    setAssignTarget(null);
                  }}
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-hairline p-3 hover:border-brand"
                >
                  <span className="text-sm font-medium text-ink">{m.name}</span>
                  <span className="text-xs text-muted">{m.workloadThisWeek}h this week</span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setAssigned((a) => ({ ...a, [assignTarget.id]: "self" }));
                setAssignTarget(null);
              }}
            >
              <UserCheck size={15} /> Assign to me
            </Button>
          </div>
        )}
      </Modal>

      {/* Create GD batch */}
      <Modal open={gdModalOpen} onClose={() => setGdModalOpen(false)} title="Create GD/GE batch">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" />
            <Select label="Slot">
              {HOURS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
          </div>
          <Select label="Mentor">
            {laneMentors.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </Select>
          <Input label="Topic" placeholder="e.g. Should ONDC be mandatory for large retailers?" />
          <Input label="Capacity" type="number" defaultValue={8} />
          <Button fullWidth onClick={() => setGdModalOpen(false)}>
            Create batch
          </Button>
        </div>
      </Modal>

      <div className="flex items-center gap-2 text-xs text-muted">
        <AlertTriangle size={13} /> Reassigning a booked slot notifies the student automatically.
      </div>
    </div>
  );
}
