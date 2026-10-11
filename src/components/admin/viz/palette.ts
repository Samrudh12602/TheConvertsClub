/** One palette for every admin chart, so the same colour always means the same kind of thing. Values are theme tokens, so dark mode recolours them. */
export type Tone = "oxblood" | "teal" | "gold" | "indigo" | "plum" | "green";

export const COLOR: Record<Tone, string> = {
  oxblood: "var(--color-oxblood)", teal: "var(--color-teal)", gold: "var(--color-gold)",
  indigo: "var(--color-indigo)", plum: "var(--color-plum)", green: "var(--color-green)",
};

/** The order colours are handed out in for slices and bars. */
export const CYCLE: Tone[] = ["oxblood", "gold", "teal", "indigo", "plum", "green"];

/** Gradient fills for the big stat tiles (white text sits on top of these). */
export const TILE: Record<Tone, string> = {
  oxblood: "from-oxblood-deep via-oxblood to-oxblood-hover",
  gold: "from-gold-deep via-gold to-[#d4a04a]",
  teal: "from-[#0f4d47] via-teal to-[#2a8c83]",
  indigo: "from-[#1d1c5c] via-indigo to-[#4a49a6]",
  plum: "from-[#42203d] via-plum to-[#8a4a82]",
  green: "from-[#0d3322] via-green to-[#2c7a52]",
};

export const TINT: Record<Tone, string> = {
  oxblood: "bg-oxblood-tint text-oxblood", gold: "bg-gold-tint text-gold-deep", teal: "bg-teal-tint text-teal",
  indigo: "bg-indigo-tint text-indigo", plum: "bg-plum-tint text-plum", green: "bg-green-tint text-green",
};
