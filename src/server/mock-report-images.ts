import { db } from "@/lib/db";
import { imageIds } from "@/lib/rich";
import { imageSize, type PdfImages } from "@/server/mock-report-pdf";
import type { ResultView } from "@/server/mocks";

/** The pictures a finished attempt's report needs (from questions and solutions), ready to draw. */
export async function loadReportImages(view: ResultView): Promise<PdfImages> {
  const ids = new Set<string>();
  for (const q of view.questions) {
    const ctx = q.context as { lines?: string[] } | null;
    for (const t of [q.stem, q.explanation, ...q.options, ...(ctx?.lines ?? [])]) for (const id of imageIds(t)) ids.add(id);
  }
  const out: PdfImages = new Map();
  if (!ids.size) return out;
  const slug = view.mock.slug;
  const rows = await db.mockImage.findMany({ where: { id: { in: [...ids] }, mock: { slug } } });
  for (const r of rows) {
    const format = r.contentType === "image/png" ? "png" : r.contentType === "image/jpeg" ? "jpg" : null;
    if (!format) continue;
    const size = imageSize(r.bytes) ?? { w: 320, h: 200 };
    out.set(r.id, { data: Buffer.from(r.bytes), format, w: size.w, h: size.h });
  }
  return out;
}
