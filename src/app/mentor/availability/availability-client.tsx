"use client";

import { useMemo, useState } from "react";
import { Plus, Copy, Ban, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { SlotChip, SlotState } from "@/components/ui/slot-chip";
import { ISTChip } from "@/components/ui/date-strip";
import { formatDate } from "@/lib/format";

const HOURS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

function startOfWeek(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offsetDays * 7); // Monday
  return d;
}

function weekDates(base: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

type Grid = Record<string, SlotState>;

function key(date: Date, time: string) {
  return `${date.toDateString()}__${time}`;
}

function seedGrid(dates: Date[]): Grid {
  const g: Grid = {};
  dates.forEach((d, di) => {
    HOURS.forEach((h, hi) => {
      if ((di + hi) % 5 === 0) g[key(d, h)] = "open";
      if (di === 1 && h === "5:00 PM") g[key(d, h)] = "booked";
      if (di === 1 && h === "6:00 PM") g[key(d, h)] = "held";
      if (di === 3 && h === "10:00 AM") g[key(d, h)] = "booked";
    });
  });
  return g;
}

export function AvailabilityClient() {
  const base = useMemo(() => startOfWeek(0), []);
  const dates = useMemo(() => weekDates(base), [base]);
  const [grid, setGrid] = useState<Grid>(() => seedGrid(dates));
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState("5:00 PM");
  const [endTime, setEndTime] = useState("8:00 PM");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [conflictKey, setConflictKey] = useState<string | null>(null);
  const [blockDate, setBlockDate] = useState<Date | null>(null);

  const totalOpenHours = Object.values(grid).filter((s) => s === "open" || s === "booked" || s === "held").length;

  const handleClickSlot = (date: Date, time: string) => {
    const k = key(date, time);
    const state = grid[k];
    if (state === "booked" || state === "held") {
      setConflictKey(k);
      return;
    }
    setGrid((g) => ({ ...g, [k]: state === "open" ? "blocked" : "open" }));
  };

  const toggleDay = (d: Date) => {
    const k = d.toDateString();
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const applyRange = () => {
    const startIdx = HOURS.indexOf(startTime);
    const endIdx = HOURS.indexOf(endTime);
    const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    setGrid((g) => {
      const next = { ...g };
      dates.forEach((d) => {
        if (selectedDays.has(d.toDateString())) {
          for (let i = from; i < to; i++) {
            next[key(d, HOURS[i])] = "open";
          }
        }
      });
      return next;
    });
    setAddOpen(false);
    setSelectedDays(new Set());
  };

  const copyPreviousWeek = () => {
    setGrid((g) => {
      const next = { ...g };
      dates.forEach((d) => {
        HOURS.forEach((h) => {
          if (!next[key(d, h)]) next[key(d, h)] = "open";
        });
      });
      return next;
    });
  };

  const confirmBlockDate = () => {
    if (!blockDate) return;
    setGrid((g) => {
      const next = { ...g };
      HOURS.forEach((h) => {
        const k = key(blockDate, h);
        if (next[k] !== "booked" && next[k] !== "held") next[k] = "blocked";
      });
      return next;
    });
    setBlockDate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Availability</h1>
          <p className="text-sm text-muted mt-1">
            <strong className="text-ink tabular-nums">{totalOpenHours} hours</strong> opened this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ISTChip className="hidden sm:inline-flex" />
          <Button variant="outline" size="sm" onClick={copyPreviousWeek}>
            <Copy size={14} /> Copy previous week
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add availability
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <LegendDot state="open" label="Open" />
        <LegendDot state="booked" label="Booked" />
        <LegendDot state="held" label="Held" />
        <LegendDot state="blocked" label="Blocked" />
      </div>

      {/* Desktop week grid */}
      <Card padding="none" className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-sunken/50">
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted w-24"></th>
              {dates.map((d) => (
                <th key={d.toDateString()} className="px-2 py-3 text-center">
                  <div className="text-xs font-semibold text-muted">{formatDate(d, { weekday: "short", day: false })}</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-display text-sm font-bold text-ink">{d.getDate()}</span>
                    <button onClick={() => setBlockDate(d)} className="text-muted hover:text-danger" title="Block this date">
                      <Ban size={12} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h} className="border-b border-hairline last:border-0">
                <td className="px-3 py-2 text-xs font-medium text-muted whitespace-nowrap">{h}</td>
                {dates.map((d) => {
                  const state = grid[key(d, h)] ?? "blocked";
                  return (
                    <td key={d.toDateString()} className="px-1.5 py-1.5 text-center">
                      <button
                        onClick={() => handleClickSlot(d, h)}
                        className={`h-7 w-full rounded-[6px] transition-colors ${cellClass(state)}`}
                        title={state}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile day list */}
      <div className="md:hidden space-y-4">
        {dates.map((d) => (
          <Card key={d.toDateString()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-ink text-sm">{formatDate(d, { weekday: "long", month: "short" })}</p>
              <button onClick={() => setBlockDate(d)} className="text-muted hover:text-danger">
                <Ban size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {HOURS.map((h) => {
                const state = grid[key(d, h)] ?? "blocked";
                return <SlotChip key={h} label={h} state={state} onClick={() => handleClickSlot(d, h)} />;
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Add availability modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add availability" size="md">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink mb-2">Select dates</p>
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <button
                  key={d.toDateString()}
                  onClick={() => toggleDay(d)}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-xs font-semibold ${
                    selectedDays.has(d.toDateString()) ? "border-accent bg-accent text-on-gold" : "border-border-strong text-ink"
                  }`}
                >
                  {formatDate(d, { weekday: "short" })}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Start time" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              {HOURS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
            <Select label="End time" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              {HOURS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} className="h-4 w-4 accent-[var(--gold-500)]" />
            Repeat weekly
          </label>
          {repeatWeekly && <Input label="Repeat until" type="date" />}
          <p className="text-xs text-muted">The range is automatically split into 1-hour slots.</p>
          <Button fullWidth onClick={applyRange} disabled={selectedDays.size === 0}>
            Add slots
          </Button>
        </div>
      </Modal>

      {/* Conflict dialog */}
      <Modal open={!!conflictKey} onClose={() => setConflictKey(null)} title="This slot has a booking" size="sm">
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warning/30 bg-warning-bg p-4">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            Editing a booked or held slot needs Admin to reassign or notify the student. Send a change request instead of editing directly.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConflictKey(null)}>
            Cancel
          </Button>
          <Button onClick={() => setConflictKey(null)}>Send request to Admin</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!blockDate}
        onClose={() => setBlockDate(null)}
        onConfirm={confirmBlockDate}
        title="Block this date?"
        description="All open slots on this date will be marked unavailable. Booked and held slots are unaffected — Admin will be notified to reassign them."
        confirmLabel="Block date"
        destructive
      />
    </div>
  );
}

function cellClass(state: SlotState) {
  switch (state) {
    case "open":
      return "bg-success-bg border border-success/30 hover:bg-success/20";
    case "booked":
      return "bg-info text-white";
    case "held":
      return "bg-warning-bg border border-warning/40";
    case "blocked":
    default:
      return "bg-sunken/60 border border-hairline";
  }
}

function LegendDot({ state, label }: { state: SlotState; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-[3px] ${cellClass(state)}`} />
      {label}
    </span>
  );
}
