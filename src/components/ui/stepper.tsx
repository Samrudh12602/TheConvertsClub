import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0",
                  state === "done" && "bg-brand text-inverse",
                  state === "active" && "bg-accent text-on-gold ring-4 ring-accent/20",
                  state === "upcoming" && "bg-sunken text-muted"
                )}
              >
                {state === "done" ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium text-center max-w-20 hidden sm:block",
                  state === "upcoming" ? "text-muted" : "text-ink"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1 mx-2", state === "done" ? "bg-brand" : "bg-hairline")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-sunken overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
