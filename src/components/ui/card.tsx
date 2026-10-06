import clsx from "clsx";

/** White card on paper: a soft warm shadow plus a hairline border. `lift` adds a hover rise for clickable cards. */
export function Card({ className, lift, ...rest }: React.ComponentProps<"div"> & { lift?: boolean }) {
  return <div className={clsx("rounded-xl border border-line bg-card p-5 shadow-card", lift && "transition-all duration-300 hover:-translate-y-1 hover:shadow-lift", className)} {...rest} />;
}

/** Ink (dark) panel used for the order summary, "Most bought" tile and stat cards: a warm gradient with a soft glow. */
export function DarkPanel({ className, ...rest }: React.ComponentProps<"div">) {
  return <div className={clsx("rounded-xl bg-night p-[22px] text-surface shadow-lift ring-1 ring-white/5", className)} {...rest} />;
}
