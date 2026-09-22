/** Pure upload checks (no database), so they can be unit-tested. */

export class UploadError extends Error {}
/** Back-compat alias: WAT/SOP review code imports this name specifically. */
export { UploadError as ReviewError };

export const MAX_BYTES = 5 * 1024 * 1024;
const DOC_TYPES = new Map([
  [".pdf", "application/pdf"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

/** Check the real file signature, not just the extension or the browser-supplied type. */
export function sniff(name: string, bytes: Uint8Array): { ext: string; mime: string } {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  const mime = DOC_TYPES.get(ext);
  if (!mime) throw new UploadError("Only PDF or DOCX files are accepted.");
  const head = String.fromCharCode(...bytes.slice(0, 4));
  if (ext === ".pdf" && !head.startsWith("%PDF")) throw new UploadError("That file isn't a valid PDF.");
  if (ext === ".docx" && !head.startsWith("PK")) throw new UploadError("That file isn't a valid DOCX.");
  return { ext, mime };
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

/** Same idea as sniff(), for the photo uploads on mentor applications and Admin's mentor form. */
export function sniffImage(name: string, bytes: Uint8Array): { ext: string; mime: string } {
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  const mime = IMAGE_TYPES.get(ext);
  if (!mime) throw new UploadError("Only JPG, PNG or WEBP photos are accepted.");
  const b = bytes;
  const isJpeg = b.length > 2 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const isPng = b.length > 7 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const isWebp = b.length > 11 && String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP";
  if ((ext === ".jpg" || ext === ".jpeg") && !isJpeg) throw new UploadError("That file isn't a valid JPG.");
  if (ext === ".png" && !isPng) throw new UploadError("That file isn't a valid PNG.");
  if (ext === ".webp" && !isWebp) throw new UploadError("That file isn't a valid WEBP.");
  return { ext: ext === ".jpeg" ? ".jpg" : ext, mime };
}
