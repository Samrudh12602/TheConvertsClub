import { splitRich } from "@/lib/rich";

/** Plain text with <u>underlined</u> words drawn as underlines. Everything else is rendered as text (never as HTML). */
export function RichText({ text }: { text: string | null | undefined }) {
  return <>{splitRich(text).map((p, i) => (p.underline ? <u key={i} className="underline decoration-2 underline-offset-[3px]">{p.text}</u> : <span key={i}>{p.text}</span>))}</>;
}
