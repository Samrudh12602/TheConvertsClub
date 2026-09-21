import Link from "next/link";
import clsx from "clsx";

export type ButtonVariant = "primary" | "onDark" | "dark" | "secondary" | "fillOnHover" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-oxblood text-white hover:bg-oxblood-deep",
  onDark: "border-transparent bg-oxblood text-white hover:bg-oxblood-hover",
  dark: "border-ink bg-ink text-white hover:bg-ink-body",
  secondary: "border-line-strong bg-white font-medium text-ink-2 hover:border-ink hover:text-ink",
  fillOnHover: "border-line-strong bg-white text-ink hover:border-ink hover:bg-ink hover:text-white",
  quiet: "border-oxblood-line bg-oxblood-tint text-oxblood hover:border-oxblood",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 text-[12.5px]",
  md: "min-h-11 px-[18px] text-[13px]",
  lg: "min-h-12 px-5 text-[13.5px]",
};

export function buttonClasses(opts: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", block, className } = opts;
  return clsx(
    "inline-flex items-center justify-center rounded-lg border font-semibold leading-none transition-colors",
    "cursor-pointer no-underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-60",
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
