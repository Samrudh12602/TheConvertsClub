import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-on-gold hover:bg-accent-strong active:bg-accent-strong shadow-sm",
  secondary:
    "bg-brand text-inverse hover:bg-brand-strong active:bg-brand-strong shadow-sm",
  outline:
    "bg-transparent text-ink border border-border-strong hover:bg-sunken",
  ghost: "bg-transparent text-ink hover:bg-sunken",
  danger: "bg-danger text-white hover:opacity-90",
  link: "bg-transparent text-brand underline-offset-4 hover:underline px-0 h-auto",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none",
    variantClasses[variant],
    variant !== "link" && sizeClasses[size],
    fullWidth && "w-full",
    className
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })}>
      {children}
    </Link>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none",
          variantClasses[variant],
          variant !== "link" && sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
