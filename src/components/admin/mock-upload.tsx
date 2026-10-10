"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { RichText } from "@/components/mocks/rich-text";
import { createMockFromPaperAction, inspectMockPaperAction, type PaperSummary } from "@/app/admin/actions";

const field = "min-h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-[13px] text-ink";
const label = "mb-1 block text-[11.5px] font-semibold text-ink-2";

/** Upload a Word paper: it is read and checked straight away, then saved as a draft, published, or scheduled. */
export function MockUpload({ nextNumber }: { nextNumber: number }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [sum, setSum] = useState<PaperSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const [f, setF] = useState({ title: "", slug: "", description: "", durationMin: "60", sortOrder: String(nextNumber), isTest: "false", marks: "1", negative: "0.25", publish: "draft" as "draft" | "now" | "schedule", releaseAt: "" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const reset = () => { setFile(null); setSum(null); setErr(null); if (input.current) input.current.value = ""; };

  const choose = async (picked: File | null) => {
    reset();
    if (!picked) return;
    setFile(picked); setReading(true);
    const fd = new FormData(); fd.set("file", picked);
    const r = await inspectMockPaperAction(fd).catch(() => ({ ok: false as const, error: "Couldn't read that file. Please try again." }));
    setReading(false);
    if (!r.ok) { setErr(r.error); return; }
    setSum(r);
    setF((x) => ({ ...x, title: r.suggestedTitle, slug: r.suggestedSlug, sortOrder: String(r.suggestedNumber) }));
  };

  const create = () => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    for (const [k, v] of Object.entries(f)) if (k !== "releaseAt") fd.set(k, v);
    if (f.publish === "schedule" && f.releaseAt) fd.set("releaseAt", new Date(f.releaseAt).toISOString());
    start(async () => {
      const r = await createMockFromPaperAction(fd);
      if (r.ok) { toast.success(r.message ?? "Created."); reset(); router.refresh(); } else toast.error(r.error);
    });
  };

  const blocked = Boolean(sum && sum.problems.length > 0);
  return (
    <div>
      <label className={clsx("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition", file ? "border-teal/50 bg-teal-tint/40" : "border-line-strong bg-surface hover:border-oxblood hover:bg-oxblood-tint/30")}>
        {reading ? <Loader2 className="size-6 animate-spin text-oxblood" aria-hidden /> : <FileUp className="size-6 text-oxblood" aria-hidden />}
        <span className="text-[13.5px] font-semibold text-ink">{file ? file.name : "Choose the mock paper (.docx)"}</span>
        <span className="max-w-[60ch] text-[12px] leading-[1.55] text-ink-muted">{reading ? "Reading the paper…" : "The question paper, answer key and detailed solutions in one Word file. It is read and checked as soon as you pick it; nothing is saved yet."}</span>
        <input ref={input} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => void choose(e.target.files?.[0] ?? null)} />
      </label>

      {err && <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-oxblood-line bg-oxblood-tint p-3 text-[12.5px] text-oxblood"><AlertTriangle className="mt-0.5 size-4 flex-none" aria-hidden />{err}</p>}

      {sum && (
        <div className="mt-4 flex flex-col gap-4">
          <div className={clsx("rounded-2xl border p-4", blocked ? "border-oxblood-line bg-oxblood-tint/50" : "border-teal-line bg-teal-tint/50")}>
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">{blocked ? <AlertTriangle className="size-4.5 text-oxblood" aria-hidden /> : <CheckCircle2 className="size-4.5 text-teal" aria-hidden />}{blocked ? "The paper has problems to fix first" : "Paper read and checked"}</p>
            <p className="mt-1 text-[12.5px] text-ink-2">{sum.total} questions · {sum.solutions} worked solutions{sum.detectedTitle ? ` · “${sum.detectedTitle}”` : ""}</p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">{sum.sections.map((s) => <li key={s.name} className="rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-2">{s.name} · {s.count}</li>)}</ul>
            {blocked && (
              <ul className="mt-3 list-disc pl-5 text-[12px] leading-[1.6] text-oxblood">{sum.problems.map((p) => <li key={p}>{p}</li>)}</ul>
            )}
            {sum.underlined.length > 0 && <p className="mt-2.5 text-[12px] leading-[1.55] text-ink-2"><b>Underlined words kept</b> in question{sum.underlined.length === 1 ? "" : "s"} {sum.underlined.join(", ")} (students see them underlined).</p>}
            {sum.sample && !blocked && (
              <details className="mt-3 text-[12px] text-ink-2"><summary className="cursor-pointer font-semibold text-ink">Check question {sum.sample.number}</summary>
                <p className="mt-2 whitespace-pre-wrap leading-[1.6]"><RichText text={sum.sample.stem} /></p>
                <ul className="mt-1.5 flex flex-col gap-1">{sum.sample.options.map((o, i) => <li key={i} className={clsx(i === sum.sample!.correct && "font-semibold text-teal")}>{"abcd"[i]}) <RichText text={o} />{i === sum.sample!.correct ? "  ← correct" : ""}</li>)}</ul></details>
            )}
          </div>

          {sum.warnings.length > 0 && (
            <div className="rounded-2xl border border-gold-line bg-gold-tint p-4" role="status">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-deep"><AlertTriangle className="size-4" aria-hidden />Worth a look before you publish</p>
              <ul className="mt-1.5 list-disc pl-5 text-[12px] leading-[1.6] text-gold-deep">{sum.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              <p className="mt-1.5 text-[11.5px] text-gold-deep/80">These don&apos;t stop you creating the mock. Save it as a draft and use Preview to check.</p>
            </div>
          )}

          {!blocked && (
            <div className="rounded-2xl border border-line bg-card p-4">
              <p className="text-[13px] font-semibold text-ink">Set it up</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><label className={label} htmlFor="mu-title">Title students see</label><input id="mu-title" className={field} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
                <div><label className={label} htmlFor="mu-slug">Web address name</label><input id="mu-slug" className={field} value={f.slug} onChange={(e) => set("slug", e.target.value)} /><p className="mt-1 text-[11px] text-ink-faint">Used in the link: /exam/{f.slug || "…"}</p></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mu-desc">Short description <span className="font-normal text-ink-faint">(optional)</span></label><input id="mu-desc" className={field} value={f.description} placeholder="Shown on the mock card. Leave blank for the standard line." onChange={(e) => set("description", e.target.value)} /></div>
                <div><label className={label} htmlFor="mu-type">Type</label><select id="mu-type" className={field} value={f.isTest} onChange={(e) => set("isTest", e.target.value)}><option value="false">Series mock (uses a pack credit)</option><option value="true">Test mock (the one-per-person ₹50 trial)</option></select></div>
                <div><label className={label} htmlFor="mu-order">Mock number / order</label><input id="mu-order" type="number" min={0} className={field} value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></div>
                <div><label className={label} htmlFor="mu-dur">Time allowed (minutes)</label><input id="mu-dur" type="number" min={5} max={300} className={field} value={f.durationMin} onChange={(e) => set("durationMin", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3"><div><label className={label} htmlFor="mu-m">Marks for right</label><input id="mu-m" type="number" step="0.25" min={0.25} className={field} value={f.marks} onChange={(e) => set("marks", e.target.value)} /></div><div><label className={label} htmlFor="mu-n">Lost for wrong</label><input id="mu-n" type="number" step="0.05" min={0} className={field} value={f.negative} onChange={(e) => set("negative", e.target.value)} /></div></div>
              </div>
              <fieldset className="mt-4">
                <legend className={label}>What happens when it&apos;s created</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([["draft", "Save as a draft", "Hidden from students. Preview it first, then publish."], ["now", "Publish now", "Students with a credit can start it at once."], ["schedule", "Schedule it", "Goes live at the date and time you pick."]] as const).map(([v, t, d]) => (
                    <label key={v} className={clsx("flex cursor-pointer flex-col gap-0.5 rounded-xl border p-3 transition", f.publish === v ? "border-oxblood bg-oxblood-tint/50" : "border-line hover:border-line-strong")}>
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink"><input type="radio" name="mu-publish" checked={f.publish === v} onChange={() => set("publish", v)} className="accent-[#7a1f2b]" />{t}</span>
                      <span className="pl-6 text-[11.5px] leading-[1.5] text-ink-muted">{d}</span>
                    </label>
                  ))}
                </div>
                {f.publish === "schedule" && <div className="mt-3 max-w-[300px]"><label className={label} htmlFor="mu-at">Opens on (your local time)</label><input id="mu-at" type="datetime-local" className={field} value={f.releaseAt} onChange={(e) => set("releaseAt", e.target.value)} suppressHydrationWarning /></div>}
              </fieldset>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button disabled={saving || !f.title.trim()} onClick={create}>{saving ? <><Loader2 className="size-4 animate-spin" aria-hidden />Creating…</> : "Create the mock"}</Button>
                <Button variant="secondary" disabled={saving} onClick={reset}><X className="size-4" aria-hidden />Cancel</Button>
              </div>
            </div>
          )}
          {blocked && <div><Button variant="secondary" onClick={reset}>Choose a different file</Button></div>}
        </div>
      )}
    </div>
  );
}
