import Link from "next/link";
import clsx from "clsx";

export type ButtonVariant = "primary" | "onDark" | "dark" | "secondary" | "fillOnHover" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-brand text-white shadow-glow hover:brightness-110 hover:shadow-lift",
  onDark: "border-transparent bg-brand text-white shadow-glow hover:brightness-115 hover:shadow-lift",
  dark: "border-ink bg-ink text-white shadow-card hover:bg-ink-body hover:shadow-lift",
  secondary: "border-line-strong bg-white font-medium text-ink-2 shadow-xs hover:border-ink hover:text-ink hover:shadow-card",
  fillOnHover: "border-line-strong bg-white text-ink shadow-xs hover:border-ink hover:bg-ink hover:text-white hover:shadow-card",
  quiet: "border-oxblood-line bg-oxblood-tint text-oxblood hover:border-oxblood hover:shadow-xs",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 text-[12.5px]",
  md: "min-h-11 px-[18px] text-[13px]",
  lg: "min-h-12 px-5 text-[13.5px]",
};

export function buttonClasses(opts: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", block, className } = opts;
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold leading-none transition-all duration-200",
    "cursor-pointer no-underline hover:-translate-y-px hover:no-underline active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
    variants[variant],
    sizes[size],
    block && "w-full",
    className,
  );
}

type CommonProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

export function Button({ variant, size, block, className, type = "button", ...rest }: CommonProps & React.ComponentProps<"button">) {
  return <button type={type} className={buttonClasses({ variant, size, block, className })} {...rest} />;
}

export function ButtonLink({ variant, size, block, className, ...rest }: CommonProps & React.ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size, block, className })} {...rest} />;
}

/** A plain anchor styled as a button — for file downloads and API routes, where next/link's prefetch and client-side navigation are the wrong tool. */
export function ButtonAnchor({ variant, size, block, className, ...rest }: CommonProps & React.ComponentProps<"a">) {
  return <a className={buttonClasses({ variant, size, block, className })} {...rest} />;
}
