"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FileText, Paperclip, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { addProfileDocumentAction, deleteProfileDocumentAction } from "@/app/profile/actions";
import { DOC_KINDS, EXAMS, type DocKind } from "@/lib/profile";
import { areaCls, labelCls, selectCls } from "@/components/profile/shared";

export interface DocRow { id: string; kind: DocKind; title: string; year: number | null; score: string | null; note: string | null; fileName: string | null; hasFile: boolean }

const TITLE_LABEL: Record<DocKind, string> = { EXAM_RESULT: "Exam", CALL_LETTER: "Institute", ADMIT_LETTER: "Institute", OTHER: "What is it?" };
const TITLE_HINT: Record<DocKind, string> = { EXAM_RESULT: "CAT, XAT, NMAT, SNAP…", CALL_LETTER: "IIM Ahmedabad, XLRI…", ADMIT_LETTER: "IIM Ahmedabad, XLRI…", OTHER: "e.g. Work-experience letter" };

/** Add and manage call letters, admit letters and exam results. Files are private: only the owner and the admin team can open them. */
export function DocumentsPanel({ docs, kinds, defaultKind }: { docs: DocRow[]; kinds: DocKind[]; defaultKind: DocKind }) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<DocKind>(defaultKind);
  const [open, setOpen] = useState(docs.length === 0);
  const [pending, start] = useTransition();
  const [del, setDel] = useState<DocRow | null>(null);
  const form = useRef<HTMLFormElement | null>(null);

  const add = (fd: FormData) => start(async () => {
    const r = await addProfileDocumentAction(fd);
    if (r.ok) { toast.success("Added."); form.current?.reset(); setKind(defaultKind); setOpen(false); router.refresh(); } else toast.error(r.error);
  });

  return (
    <div className="flex flex-col gap-3">
      {docs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3">
              <span className={clsx("flex size-9 flex-none items-center justify-center rounded-lg", d.kind === "EXAM_RESULT" ? "bg-teal-tint text-teal" : d.kind === "OTHER" ? "bg-line-soft text-ink-muted" : "bg-oxblood-tint text-oxblood")}><FileText className="size-4" aria-hidden /></span>
              <div className="min-w-[180px] flex-1">
                <p className="text-[13px] font-semibold text-ink">{d.title}{d.year ? <span className="font-normal text-ink-faint"> · {d.year}</span> : null}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-faint">{DOC_KINDS[d.kind]}{d.score ? ` · ${d.score}` : ""}{d.note ? ` · ${d.note}` : ""}</p>
              </div>
              {d.hasFile && <a href={`/api/profile-docs/${d.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink no-underline hover:border-oxblood hover:no-underline"><Paperclip className="size-3.5" aria-hidden />View file</a>}
              <button type="button" onClick={() => setDel(d)} aria-label={`Remove ${d.title}`} className="rounded-lg p-2 text-ink-faint hover:bg-line-soft hover:text-oxblood"><Trash2 className="size-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <div><Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden />Add a letter or result</Button></div>
      ) : (
        <form ref={form} action={add} className="rounded-xl border border-line bg-surface/60 p-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            <div><label htmlFor="pd-kind" className={labelCls}>What are you adding?</label><select id="pd-kind" name="kind" className={selectCls} value={kind} onChange={(e) => setKind(e.target.value as DocKind)}>{kinds.map((k) => <option key={k} value={k}>{DOC_KINDS[k]}</option>)}</select></div>
            <Field label={TITLE_LABEL[kind]} name="title" list={kind === "EXAM_RESULT" ? "pd-exams" : undefined} placeholder={TITLE_HINT[kind]} required />
            <Field label="Year" name="year" inputMode="numeric" placeholder="2026" />
            <Field label={kind === "EXAM_RESULT" ? "Score or percentile" : "Outcome"} name="score" placeholder={kind === "EXAM_RESULT" ? "98.4 percentile" : "Shortlisted for PI"} />
          </div>
          <datalist id="pd-exams">{EXAMS.map((e) => <option key={e} value={e} />)}</datalist>
          <div className="mt-3"><label htmlFor="pd-note" className={labelCls}>Note (optional)</label><textarea id="pd-note" name="note" rows={2} maxLength={300} className={areaCls} /></div>
          <div className="mt-3"><label htmlFor="pd-file" className={labelCls}>File (optional): PDF, JPG or PNG, up to 5 MB</label><input id="pd-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" className="block w-full text-[13px] text-ink-2 file:mr-3 file:rounded-lg file:border file:border-line-strong file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold" /></div>
          <div className="mt-4 flex flex-wrap items-center gap-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>{docs.length > 0 && <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>}<span className="text-[11.5px] text-ink-faint">Private: only you and the admin team can open it.</span></div>
        </form>
      )}

      <ConfirmDialog open={del !== null} onClose={() => setDel(null)} title="Remove this?" confirmLabel="Remove" danger busy={pending}
        body={<p>“{del?.title}” and its file will be deleted.</p>}
        onConfirm={() => { const d = del; setDel(null); if (d) start(async () => { const r = await deleteProfileDocumentAction(d.id); if (r.ok) { toast.success("Removed."); router.refresh(); } else toast.error(r.error); }); }} />
    </div>
  );
}
