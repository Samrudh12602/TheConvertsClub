import { MARK_COLORS, MARK_PATHS, MARK_VIEWBOX, type MarkTone } from "@/components/brand/mark-geometry";

/** The brand mark as inline SVG. `color` is oxblood and gold for light backgrounds; `paper` is for dark ones. Size it with a height class. */
export function LogoMark({ tone = "color", className }: { tone?: MarkTone; className?: string }) {
  const c = MARK_COLORS[tone];
  return (
    <svg aria-hidden focusable="false" viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`} className={className} style={{ aspectRatio: `${MARK_VIEWBOX.width} / ${MARK_VIEWBOX.height}` }}>
      <path fill={c.frame} d={MARK_PATHS.frame} />
      <path fill={c.frame} d={MARK_PATHS.wedge} />
      <path fill={c.door} d={MARK_PATHS.door} />
    </svg>
  );
}
