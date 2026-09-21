import { cn } from "@/lib/cn";

export type SlotState = "open" | "selected" | "booked" | "held" | "blocked" | "just-taken";

export function SlotChip({
  label,
  state = "open",
  onClick,
  className,
}: {
  label: string;
  state?: SlotState;
  onClick?: () => void;
  className?: string;
}) {
  const disabled = state === "booked" || state === "blocked" || state === "just-taken";

  const styles: Record<SlotState, string> = {
    open: "border-border-strong text-ink hover:border-brand hover:bg-sunken",
    selected: "border-accent bg-accent text-on-gold",
    booked: "border-hairline bg-sunken text-muted line-through cursor-not-allowed",
    held: "border-warning/40 bg-warning-bg text-warning cursor-not-allowed",
    blocked: "border-hairline bg-sunken/60 text-muted/60 cursor-not-allowed opacity-50",
    "just-taken": "border-danger/30 bg-danger-bg text-danger cursor-not-allowed",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={state === "held" ? "Held — awaiting another student's confirmation" : state === "just-taken" ? "Just taken by another student" : undefined}
      className={cn(
        "min-w-[92px] rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm font-semibold transition-colors",
        styles[state],
        className
      )}
    >
      {label}
    </button>
  );
}
