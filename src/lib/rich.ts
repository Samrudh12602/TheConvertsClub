/**
 * Question and solution text can carry two bits of formatting from the Word paper:
 *   <u>word</u>          an underlined word (a question like "the underlined word" is unanswerable without it)
 *   [[img:<id>|<px>]]    a picture (a diagram or chart), stored with the mock and served by /api/mock-images/<id>; |<px> is its width in Word
 * Nothing else is interpreted: everything outside these is plain text.
 */
export interface RichPart { text: string; underline: boolean; image?: { id: string; width: number | null } }

const TOKEN = /<u>([\s\S]*?)<\/u>|\[\[img:([A-Za-z0-9_-]+)(?:\|(\d+))?\]\]/g;

export function splitRich(input: string | null | undefined): RichPart[] {
  const out: RichPart[] = [];
  const s = input ?? "";
  const re = new RegExp(TOKEN.source, "g");
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), underline: false });
    if (m[2]) out.push({ text: "", underline: false, image: { id: m[2], width: m[3] ? Number(m[3]) : null } });
    else if (m[1]) out.push({ text: m[1], underline: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), underline: false });
  return out;
}

/** The text without the markup (for titles, search and topic tagging); a picture becomes "[figure]". */
export const stripMarkup = (s: string) => s.replace(/<\/?u>/g, "").replace(/\[\[img:[A-Za-z0-9_-]+(?:\|\d+)?\]\]/g, "[figure]");

/** Every picture id mentioned in some text. */
export const imageIds = (s: string | null | undefined): string[] => splitRich(s).flatMap((p) => (p.image ? [p.image.id] : []));
