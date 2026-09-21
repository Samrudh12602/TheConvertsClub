import { cn } from "@/lib/cn";

export type SessionStatus =
  | "requested"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "feedback-pending"
  | "cancelled"
  | "no-show"
  | "rescheduled";

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; dot?: boolean; outline?: boolean }> = {
  requested: { label: "Requested", color: "var(--status-requested)", bg: "var(--status-requested-bg)" },
  confirmed: { label: "Confirmed", color: "var(--status-confirmed)", bg: "var(--status-confirmed-bg)" },
  "in-progress": { label: "In progress", color: "var(--status-inprogress)", bg: "transparent", outline: true },
  completed: { label: "Completed", color: "var(--status-completed)", bg: "var(--status-completed-bg)" },
  "feedback-pending": { label: "Feedback pending", color: "var(--status-feedbackpending)", bg: "var(--status-feedbackpending-bg)" },
  cancelled: { label: "Cancelled", color: "var(--status-cancelled)", bg: "var(--status-cancelled-bg)" },
  "no-show": { label: "No-show", color: "var(--status-noshow)", bg: "var(--status-noshow-bg)" },
  rescheduled: { label: "Rescheduled", color: "var(--status-rescheduled)", bg: "var(--status-rescheduled-bg)" },
};

export function StatusChip({ status, className }: { status: SessionStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        cfg.outline && "border",
        className
      )}
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        borderColor: cfg.outline ? cfg.color : undefined,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}
