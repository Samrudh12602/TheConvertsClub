import clsx from "clsx";

/** Green = fine. Amber = time-sensitive. Oxblood = blocked or needs a person. Indigo = informational. Stone = inert or finished. */
const tones = {
  green: "bg-green-tint text-green",
  amber: "bg-amber-tint text-amber",
  oxblood: "bg-oxblood-tint text-oxblood",
  indigo: "bg-indigo-tint text-indigo",
  stone: "bg-line-soft text-ink-2",
};

export function Pill({ tone = "stone", className, ...rest }: { tone?: keyof typeof tones } & React.ComponentProps<"span">) {
  return <span className={clsx("inline-block rounded-full px-2.5 py-1.5 text-[11px] font-semibold leading-none", tones[tone], className)} {...rest} />;
}
