"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ChevronDown, Eye, EyeOff, Loader2, Lock, Rocket, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { deleteMockAction, replaceMockPaperAction, setMockMarkingAction, setMockStatusAction, updateMockAction } from "@/app/admin/actions";

export interface MockCardData { id: string; slug: string; title: string; description: string | null; durationMin: number; sortOrder: number; isTest: boolean; status: "DRAFT" | "PUBLISHED"; releaseAt: string | null; questions: number; marks: number; negative: number; attempts: number; submitted: number; avgScore: number | null; bestScore: number | null }

const field = "min-h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-[13px] text-ink disabled:bg-surface disabled:text-ink-faint";
const lbl = "mb-1 block text-[11.5px] font-semibold text-ink-2";
const localInput = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-line bg-surface/60 p-4"><h4 className="text-[13px] font-bold text-ink">{title}</h4>{hint && <p className="mt-0.5 text-[11.5px] leading-[1.55] text-ink-muted">{hint}</p>}<div className="mt-3">{children}</div></section>;
}

/** One mock: status, numbers, and everything an admin might want to change about it. */
export function MockCard({ m }: { m: MockCardData }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const locked = m.attempts > 0;
  const upcoming = m.status === "PUBLISHED" && m.releaseAt !== null && new Date(m.releaseAt) > new Date();
  const state = m.status !== "PUBLISHED" ? "Draft" : upcoming ? "Scheduled" : "Live";

  const [d, setD] = useState({ title: m.title, description: m.description ?? "", durationMin: String(m.durationMin), sortOrder: String(m.sortOrder), isTest: m.isTest });
  const [mk, setMk] = useState({ marks: String(m.marks), negative: String(m.negative) });
  const [mode, setMode] = useState<"draft" | "now" | "schedule">(m.status !== "PUBLISHED" ? "draft" : upcoming ? "schedule" : "now");
  const [at, setAt] = useState(localInput(m.releaseAt));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const done = (r: { ok: true; message?: string } | { ok: false; error: string }) => { if (r.ok) { toast.success(r.message ?? "Saved."); router.refresh(); } else toast.error(r.error); };
  const setStatus = (status: "DRAFT" | "PUBLISHED", releaseAt: string | null) => start(async () => done(await setMockStatusAction({ id: m.id, status, releaseAt })));
  const applySchedule = () => {
    if (mode === "draft") return setStatus("DRAFT", null);
    if (mode === "schedule") { if (!at) return toast.error("Pick the date and time it should open."); return setStatus("PUBLISHED", new Date(at).toISOString()); }
    return setStatus("PUBLISHED", null);
  };
  const saveDetails = () => start(async () => done(await updateMockAction({ id: m.id, title: d.title, description: d.description || null, durationMin: Number(d.durationMin), sortOrder: Number(d.sortOrder), isTest: d.isTest })));
  const saveMarking = () => start(async () => done(await setMockMarkingAction({ id: m.id, marks: Number(mk.marks), negative: Number(mk.negative) })));
  const replace = (file: File | undefined) => {
    if (!file) return;
    const fd = new FormData(); fd.set("id", m.id); fd.set("file", file);
    start(async () => done(await replaceMockPaperAction(fd)));
  };

  return (
    <li className="rounded-2xl border border-line bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-ink">{m.title}
            {m.isTest && <span className="rounded-full bg-gold-tint px-2.5 py-1 text-[10.5px] font-semibold text-gold-deep">Test mock</span>}
            <span className={clsx("rounded-full px-2.5 py-1 text-[10.5px] font-semibold", state === "Live" ? "bg-teal-tint text-teal" : state === "Scheduled" ? "bg-gold-tint text-gold-deep" : "bg-line-soft text-ink-muted")}>{state}</span></p>
          <p className="mt-1 text-[12px] text-ink-faint">/{m.slug} · {m.questions} questions · {m.durationMin} min · +{m.marks} / −{m.negative}{state === "Scheduled" && m.releaseAt ? ` · opens ${when(m.releaseAt)}` : ""}</p>
          <p className="mt-1 text-[12px] text-ink-muted"><b className="tnum text-ink">{m.attempts}</b> attempt{m.attempts === 1 ? "" : "s"} · <b className="tnum text-ink">{m.submitted}</b> submitted{m.avgScore !== null ? <> · average <b className="tnum text-ink">{m.avgScore.toFixed(1)}</b> · best <b className="tnum text-ink">{m.bestScore?.toFixed(1)}</b></> : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {m.status === "PUBLISHED"
            ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("DRAFT", null)}><EyeOff className="size-3.5" aria-hidden />Hide</Button>
            : <Button size="sm" disabled={pending} onClick={() => setStatus("PUBLISHED", null)}><Rocket className="size-3.5" aria-hidden />Publish now</Button>}
          <Link href={`/exam/${m.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink no-underline hover:border-oxblood hover:no-underline"><Eye className="size-3.5" aria-hidden />Preview</Link>
          <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>Settings<ChevronDown className={clsx("size-3.5 transition-transform", open && "rotate-180")} aria-hidden /></Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Block title="When students can take it" hint="Draft hides it. Live opens it at once to anyone with a credit. Scheduled opens it at the time you choose.">
            <div className="flex flex-wrap gap-2">{([["draft", "Draft (hidden)"], ["now", "Live now"], ["schedule", "Scheduled"]] as const).map(([v, t]) => <button key={v} type="button" onClick={() => setMode(v)} aria-pressed={mode === v} className={clsx("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition", mode === v ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2 hover:border-ink")}>{t}</button>)}</div>
            {mode === "schedule" && <div className="mt-3 max-w-[280px]"><label className={lbl} htmlFor={`at-${m.id}`}>Opens on (your local time)</label><input id={`at-${m.id}`} type="datetime-local" className={field} value={at} onChange={(e) => setAt(e.target.value)} suppressHydrationWarning /></div>}
            <div className="mt-3"><Button size="sm" disabled={pending} onClick={applySchedule}>Save</Button></div>
          </Block>

          <Block title="Details" hint="What students see on the mock card, and where it sits in the list.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={lbl} htmlFor={`t-${m.id}`}>Title</label><input id={`t-${m.id}`} className={field} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={lbl} htmlFor={`d-${m.id}`}>Description</label><input id={`d-${m.id}`} className={field} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
              <div><label className={lbl} htmlFor={`m-${m.id}`}>Time allowed (min)</label><input id={`m-${m.id}`} type="number" min={5} max={300} className={field} value={d.durationMin} onChange={(e) => setD({ ...d, durationMin: e.target.value })} /></div>
              <div><label className={lbl} htmlFor={`o-${m.id}`}>Order in the list</label><input id={`o-${m.id}`} type="number" min={0} className={field} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-[12.5px] font-medium text-ink-2 sm:col-span-2"><input type="checkbox" checked={d.isTest} disabled={locked} onChange={(e) => setD({ ...d, isTest: e.target.checked })} />Test mock (the one-per-person trial){locked && <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint"><Lock className="size-3" aria-hidden />locked: it has attempts</span>}</label>
            </div>
            <div className="mt-3"><Button size="sm" disabled={pending || !d.title.trim()} onClick={saveDetails}>Save details</Button></div>
          </Block>

          <Block title="Marking" hint={locked ? "Locked: students have attempted this mock, and changing the marking would change their scores." : "Applied to every question in this mock."}>
            <div className="grid max-w-[360px] grid-cols-2 gap-3">
              <div><label className={lbl} htmlFor={`mk-${m.id}`}>Marks for a right answer</label><input id={`mk-${m.id}`} type="number" step="0.25" min={0.25} className={field} disabled={locked} value={mk.marks} onChange={(e) => setMk({ ...mk, marks: e.target.value })} /></div>
              <div><label className={lbl} htmlFor={`ng-${m.id}`}>Lost for a wrong answer</label><input id={`ng-${m.id}`} type="number" step="0.05" min={0} className={field} disabled={locked} value={mk.negative} onChange={(e) => setMk({ ...mk, negative: e.target.value })} /></div>
            </div>
            <div className="mt-3"><Button size="sm" disabled={pending || locked} onClick={saveMarking}>Save marking</Button></div>
          </Block>

          <Block title="Replace the paper" hint={locked ? "Locked: students have attempted this mock. Upload the corrected paper as a new mock instead." : "Upload a corrected .docx to swap in new questions and solutions. The mock goes back to draft so you can preview it first."}>
            <label className={clsx("inline-flex min-h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-3.5 text-xs font-semibold text-ink", locked || pending ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-oxblood")}>
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}Choose a .docx
              <input type="file" accept=".docx" className="sr-only" disabled={locked || pending} onChange={(e) => { replace(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <div className="mt-4 border-t border-line pt-3">
              <Button size="sm" variant="secondary" disabled={locked || pending} onClick={() => setConfirmDelete(true)} className="text-oxblood"><Trash2 className="size-3.5" aria-hidden />Delete this mock</Button>
              {locked && <p className="mt-1.5 text-[11.5px] text-ink-faint">A mock with attempts can&apos;t be deleted. Hide it instead.</p>}
            </div>
          </Block>
        </div>
      )}

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this mock?" confirmLabel="Delete" danger busy={pending}
        body={<p>“{m.title}” and all its questions will be removed. This can&apos;t be undone. Nobody has attempted it, so no student results are affected.</p>}
        onConfirm={() => { setConfirmDelete(false); start(async () => done(await deleteMockAction(m.id))); }} />
    </li>
  );
}
