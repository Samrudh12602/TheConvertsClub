import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  padding = "md",
  as: Comp = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  as?: React.ElementType;
  [key: string]: unknown;
}) {
  const pad = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-7 sm:p-8" }[padding];
  return (
    <Comp
      className={cn(
        "rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-[var(--shadow-token-sm)]",
        pad,
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
