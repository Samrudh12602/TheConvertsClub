import { splitRich } from "@/lib/rich";

/** Plain text with <u>underlined</u> words drawn as underlines and [[img:…]] pictures drawn as images. Everything else is text, never HTML. */
export function RichText({ text }: { text: string | null | undefined }) {
  return (
    <>
      {splitRich(text).map((p, i) => {
        if (p.image) {
          /* eslint-disable-next-line @next/next/no-img-element */
          return <img key={i} src={`/api/mock-images/${p.image.id}`} alt="Figure from the question paper" draggable={false} loading="eager" className="my-2 block h-auto max-w-full rounded border border-[#d5dde6] bg-white" style={p.image.width ? { width: Math.min(p.image.width, 720) } : undefined} />;
        }
        return p.underline ? <u key={i} className="underline decoration-2 underline-offset-[3px]">{p.text}</u> : <span key={i}>{p.text}</span>;
      })}
    </>
  );
}
