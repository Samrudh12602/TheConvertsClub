"use client";

import { cn } from "@/lib/cn";
import { Clock3 } from "lucide-react";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface DateOption {
  date: Date;
  hasAvailability: boolean;
}

export function DateStrip({
  options,
  selected,
  onSelect,
}: {
  options: DateOption[];
  selected: Date | null;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {options.map(({ date, hasAvailability }) => {
        const isSelected = selected?.toDateString() === date.toDateString();
        return (
          <button
            key={date.toISOString()}
            disabled={!hasAvailability}
            onClick={() => onSelect(date)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-[var(--radius-md)] border px-3.5 py-2.5 min-w-[64px] transition-colors",
              isSelected
                ? "border-brand bg-brand text-inverse"
                : hasAvailability
                ? "border-hairline bg-surface text-ink hover:border-brand"
                : "border-hairline bg-sunken/50 text-muted/50 cursor-not-allowed"
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
              {WEEKDAY[date.getDay()]}
            </span>
            <span className="text-lg font-bold leading-none">{date.getDate()}</span>
            <span className="text-[10px] opacity-80">{MONTH[date.getMonth()]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ISTChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-[11px] font-semibold text-muted",
        className
      )}
    >
      <Clock3 size={12} />
      All times in IST
    </span>
  );
}
