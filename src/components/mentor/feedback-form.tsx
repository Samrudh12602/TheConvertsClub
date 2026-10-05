"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { submitFeedbackAction } from "@/app/mentor/actions";

const RUBRIC = ["Content depth", "Clarity", "Structure", "Body language", "Stress handling", "Current affairs"];
const RECS = [["READY", "Ready"], ["NEARLY_THERE", "Nearly there"], ["NEEDS_MORE_MOCKS", "Needs more mocks"], ["REWORK_BASICS", "Rework the basics"]] as const;
const AREAS = [
  ["strengths", "Strengths", "text-green", "Be specific. Name the answer, not the trait."],
  ["weaknesses", "Weaknesses", "text-oxblood", "What cost them marks today?"],
  ["redFlags", "Red flags", "text-amber", "Anything a panel would penalise: gaps, marks, attitude."],
  ["answerFraming", "Answer framing", "text-indigo", "Rewrite one weak answer the way it should have gone."],
  ["questionsToPrepare", "Questions to prepare", "text-ink-muted", "Three to five, based on their form and today's gaps."],
] as const;

type Form = { recordingUrl: string; heldAt: string; scores: Record<string, number>; strengths: string; weaknesses: string; redFlags: string; answerFraming: string; questionsToPrepare: string; recommendation: string; privateNote: string };
const empty: Form = { recordingUrl: "", heldAt: "", scores: {}, strengths: "", weaknesses: "", redFlags: "", answerFraming: "", questionsToPrepare: "", recommendation: "", privateNote: "" };

/** `proof` is set for live sessions (not written reviews): the recording link that confirms it took place. */
export function FeedbackForm({ targetId, proof }: { targetId: string; proof?: { required: boolean; scheduledAtLabel: string; notDueYet: boolean; defaultLink: string } }) {
  const router = useRouter();
  const key = `feedback-draft:${targetId}`;
  // A saved draft lives in localStorage; read it as an external store so there is no setState-in-effect.
  const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
  const draft = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key); } catch { return null; } }, () => null);
  const [edited, setEdited] = useState<Form | null>(null);
  const f: Form = edited ?? (draft ? { ...empty, ...(JSON.parse(draft) as Partial<Form>) } : { ...empty, recordingUrl: proof?.defaultLink ?? "" });
  const setF = (next: Form) => setEdited(next);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const saveDraft = () => { try { localStorage.setItem(key, JSON.stringify(f)); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch { /* no storage */ } };

  async function submit() {
    setErr(null);
    if (!f.recommendation) { setErr("Choose an overall recommendation."); return; }
    if (proof?.required && !f.recordingUrl.trim()) { setErr("Add the recording link: it's how we confirm the session took place."); return; }
    if (proof?.notDueYet && !f.heldAt) { setErr("This session isn't due yet, so say when it actually took place."); return; }
    setBusy(true);
    const r = await submitFeedbackAction(targetId, { ...(proof ? { recordingUrl: f.recordingUrl.trim() || undefined, heldAt: f.heldAt ? new Date(f.heldAt).toISOString() : undefined } : {}), scores: f.scores, strengths: f.strengths, weaknesses: f.weaknesses, redFlags: f.redFlags, answerFraming: f.answerFraming, questionsToPrepare: f.questionsToPrepare, recommendation: f.recommendation as never, privateNote: f.privateNote });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    router.push("/mentor/sessions?submitted=1");
    router.refresh();
  }
  const card = "rounded-[11px] border border-line bg-card p-4";

  return (
    <div className="flex max-w-[800px] flex-col gap-3.5">
      {proof && (
        <div className={card}>
          <h2 className="text-[13px] font-bold leading-none text-ink">Proof the session took place</h2>
          <p className="mt-2 text-[12px] leading-[1.55] text-ink-faint">You can complete a session any time — before, during or after its booked slot ({proof.scheduledAtLabel}). Add the recording link and your feedback below and it is marked done.</p>
          <div className="mt-3.5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div>
              <label htmlFor="recordingUrl" className="type-label mb-1.5 block text-ink-faint">Recording or video link{proof.required ? "" : " (optional for you)"}</label>
              <input id="recordingUrl" type="url" inputMode="url" value={f.recordingUrl} onChange={(e) => setF({ ...f, recordingUrl: e.target.value })} placeholder="https://drive.google.com/…" className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:text-[13px]" />
            </div>
            <div>
              <label htmlFor="heldAt" className="type-label mb-1.5 block text-ink-faint">When did it take place?{proof.notDueYet ? " (needed — it isn’t due yet)" : " (optional)"}</label>
              <input id="heldAt" type="datetime-local" value={f.heldAt} onChange={(e) => setF({ ...f, heldAt: e.target.value })} className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink md:text-[13px]" />
            </div>
          </div>
          <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">Share the link so that Samrudh and the student can open it. Your pay for the session is added when you submit.</p>
        </div>
      )}
      <div className={card}>
        <h2 className="text-[13px] font-bold leading-none text-ink">Rubric · 1 to 10</h2>
        <div className="mt-3.5 flex flex-col gap-3">
          {RUBRIC.map((r) => (
            <div key={r} className="flex flex-wrap items-center gap-2.5">
              <span id={`r-${r}`} className="w-[134px] flex-none text-[12.5px] font-medium leading-[1.3] text-ink-2">{r}</span>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-labelledby={`r-${r}`}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={f.scores[r] === n} onClick={() => setF({ ...f, scores: { ...f.scores, [r]: n } })}
                    className={clsx("flex size-8 items-center justify-center rounded-md border text-[11.5px] font-semibold", f.scores[r] === n ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-faint hover:border-ink")}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {AREAS.map(([k, label, tone, ph]) => (
          <div key={k} className="rounded-[10px] border border-line bg-card p-3.5">
            <label htmlFor={k} className={clsx("type-label block", tone)}>{label}</label>
            <textarea id={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} rows={4} className="mt-[9px] min-h-[88px] w-full rounded-lg border border-[#EFEAE3] bg-surface p-[11px] text-base leading-[1.6] text-ink md:text-[12.5px]" />
          </div>
        ))}
      </div>

      <div className={card}>
        <p className="type-label text-ink-faint">Overall recommendation</p>
        <div className="mt-[11px] flex flex-wrap gap-[7px]" role="radiogroup" aria-label="Overall recommendation">
          {RECS.map(([id, label]) => <button key={id} type="button" role="radio" aria-checked={f.recommendation === id} onClick={() => setF({ ...f, recommendation: id })} className={clsx("min-h-11 rounded-lg border px-3.5 text-[12.5px] font-semibold", f.recommendation === id ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink")}>{label}</button>)}
        </div>
        <div className="mt-4 border-t border-line-soft pt-[15px]">
          <label htmlFor="privateNote" className="type-label block text-oxblood">Private note to Samrudh</label>
          <p className="mt-[5px] text-[11.5px] leading-normal text-ink-faint">Never shown to the student.</p>
          <textarea id="privateNote" value={f.privateNote} onChange={(e) => setF({ ...f, privateNote: e.target.value })} rows={3} placeholder="Red flags, plagiarism, attitude, anything Samrudh should know." className="mt-[9px] w-full rounded-lg border border-[#EFEAE3] bg-surface p-[11px] text-base leading-[1.6] text-ink md:text-[12.5px]" />
        </div>
      </div>

      {err && <p role="alert" className="text-[12.5px] text-oxblood">{err}</p>}
      <div className="sticky bottom-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={saveDraft}>{saved ? "Draft saved" : "Save draft"}</Button>
        <Button disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit & publish to student"}</Button>
      </div>
    </div>
  );
}
