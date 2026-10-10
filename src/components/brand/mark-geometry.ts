/**
 * The brand mark: a doorway you step through. These are the exact shapes, traced from the approved artwork (brand/mark.svg),
 * so every place that draws the mark (site, emails, PDFs, share card) draws the same one. Coordinates are in a 970 x 873 box.
 */
export const MARK_VIEWBOX = { width: 970, height: 873 };
export const MARK_PATHS = {
  frame: "M387 238 L918 47 L918 732 L786 698 L786 225 L506 311 L506 660 L387 688 Z",
  wedge: "M52 826 L638 649 L713 670 L525 826 Z",
  door: "M647 357 L747 320 L747 672 L647 643 Z",
} as const;
export const MARK_COLORS = {
  color: { frame: "#7A1F2B", door: "#B07A1E" },
  paper: { frame: "#FBF9F6", door: "#C98F2A" },
} as const;
export type MarkTone = keyof typeof MARK_COLORS;
