/** Pure upload checks (no database), so they can be unit-tested. */

export class ReviewError extends Error {}

export const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  [".pdf", "application/pdf"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

/** Check the real file signature, not just the extension or the browser-supplied type. */
export function sniff(name: string, bytes: Uint8Array): { ext: string; mime: string } {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  const mime = ALLOWED.get(ext);
  if (!mime) throw new ReviewError("Only PDF or DOCX files are accepted.");
  const head = String.fromCharCode(...bytes.slice(0, 4));
  if (ext === ".pdf" && !head.startsWith("%PDF")) throw new ReviewError("That file isn't a valid PDF.");
  if (ext === ".docx" && !head.startsWith("PK")) throw new ReviewError("That file isn't a valid DOCX.");
  return { ext, mime };
}
