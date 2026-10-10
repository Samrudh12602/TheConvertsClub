import { Path, Svg } from "@react-pdf/renderer";
import { MARK_COLORS, MARK_PATHS, MARK_VIEWBOX } from "@/components/brand/mark-geometry";

/** The brand mark for PDFs, drawn as vector paths so it stays sharp at any zoom. */
export function PdfMark({ height = 22 }: { height?: number }) {
  const c = MARK_COLORS.color;
  return (
    <Svg viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`} style={{ height, width: (height * MARK_VIEWBOX.width) / MARK_VIEWBOX.height }}>
      <Path d={MARK_PATHS.frame} fill={c.frame} />
      <Path d={MARK_PATHS.wedge} fill={c.frame} />
      <Path d={MARK_PATHS.door} fill={c.door} />
    </Svg>
  );
}
