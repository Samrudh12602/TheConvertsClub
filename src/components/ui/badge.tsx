import { cn } from "@/lib/cn";

type BadgeVariant = "gold" | "navy" | "success" | "warning" | "danger" | "info" | "violet" | "neutral" | "outline";

const variants: Record<BadgeVariant, string> = {
  gold: "bg-accent text-on-gold",
  navy: "bg-brand text-inverse",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-sunken text-muted",
  outline: "border border-border-strong text-ink",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
