import clsx from "clsx";

const tones = {
  amber: "border-amber-line bg-amber-tint text-amber-ink",
  green: "border-green/20 bg-green-tint text-green",
  oxblood: "border-oxblood-line bg-oxblood-tint text-oxblood",
};

export function Notice({ tone = "amber", className, ...rest }: { tone?: keyof typeof tones } & React.ComponentProps<"div">) {
  return <div className={clsx("rounded-[10px] border px-4 py-3.5 text-[12.5px] leading-[1.55]", tones[tone], className)} {...rest} />;
}
