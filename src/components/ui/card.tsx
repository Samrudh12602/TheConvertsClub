import clsx from "clsx";

/** White card on paper, 1px line border, 12px radius, no shadow. */
export function Card({ className, ...rest }: React.ComponentProps<"div">) {
  return <div className={clsx("rounded-xl border border-line bg-card p-5", className)} {...rest} />;
}

/** Ink (dark) panel used for the order summary, "Most bought" tile and stat cards. */
export function DarkPanel({ className, ...rest }: React.ComponentProps<"div">) {
  return <div className={clsx("rounded-xl bg-ink p-[22px] text-surface", className)} {...rest} />;
}
