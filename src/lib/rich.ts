/**
 * Question text can carry underlined words, written as <u>word</u> (the real exam underlines words in some questions, and a question
 * like "the underlined word" is unanswerable without it). Nothing else is interpreted: everything outside the tags is plain text.
 */
export interface RichPart { text: string; underline: boolean }

export function splitRich(input: string | null | undefined): RichPart[] {
  const out: RichPart[] = [];
  const re = /<u>([\s\S]*?)<\/u>/g;
  const s = input ?? "";
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), underline: false });
    if (m[1]) out.push({ text: m[1], underline: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), underline: false });
  return out;
}

/** The text without the markup (for titles, search and topic tagging). */
export const stripMarkup = (s: string) => s.replace(/<\/?u>/g, "");
