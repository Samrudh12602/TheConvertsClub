import { Paperclip } from "lucide-react";
import { DOC_KINDS, type DocKind } from "@/lib/profile";

export interface AdminDoc { id: string; kind: DocKind; title: string; year: number | null; score: string | null; note: string | null; hasFile: boolean }

/** Read-only list of the documents a student or mentor added to their profile, with a link to open each file. */
export function ProfileDocumentsView({ docs, empty }: { docs: AdminDoc[]; empty: string }) {
  if (docs.length === 0) return <p className="text-[12.5px] text-ink-faint">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5">
          <div className="min-w-[180px] flex-1"><p className="text-[13px] font-semibold text-ink">{d.title}{d.year ? <span className="font-normal text-ink-faint"> · {d.year}</span> : null}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{DOC_KINDS[d.kind]}{d.score ? ` · ${d.score}` : ""}{d.note ? ` · ${d.note}` : ""}</p></div>
          {d.hasFile && <a href={`/api/profile-docs/${d.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink no-underline hover:border-oxblood hover:no-underline"><Paperclip className="size-3.5" aria-hidden />Open file</a>}
        </li>
      ))}
    </ul>
  );
}
