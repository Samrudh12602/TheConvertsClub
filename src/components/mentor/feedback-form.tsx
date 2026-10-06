"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, ClipboardList, Lightbulb, Lock, MessageSquareQuote, Sparkles, Target, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/charts";
import { useToast } from "@/components/ui/toast";
import { submitFeedbackAction } from "@/app/mentor/actions";

const RUBRIC = ["Content depth", "Clarity", "Structure", "Body language", "Stress handling", "Current affairs"];
const RECS = [["READY", "Ready"], ["NEARLY_THERE", "Nearly there"], ["NEEDS_MORE_MOCKS", "Needs more mocks"], ["REWORK_BASICS", "Rework the basics"]] as const;
const AREAS = [
  ["strengths", "Strengths", "text-teal", "Be specific. Name the answer, not the trait.", <CheckCircle2 key="s" />],
  ["weaknesses", "Weaknesses", "text-oxblood", "What cost them marks today?", <Target key="w" />],
  ["redFlags", "Red flags", "text-gold-deep", "Anything a panel would penalise: gaps, marks, attitude.", <AlertTriangle key="r" />],
  ["answerFraming", "Answer framing", "text-indigo", "Rewrite one weak answer the way it should have gone.", <Sparkles key="a" />],
  ["questionsToPrepare", "Questions to prepare", "text-ink-muted", "Three to five, based on their form and today's gaps.", <Lightbulb key="q" />],
] as const;
const REC_HINT: Record<string, string> = { READY: "Could walk into the real panel", NEARLY_THERE: "A couple of fixes away", NEEDS_MORE_MOCKS: "Needs more practice reps", REWORK_BASICS: "Fundamentals need work" };
const scoreCls = (n: number) => (n >= 7.5 ? "bg-teal text-white border-teal" : n >= 6 ? "bg-gold text-white border-gold" : "bg-oxblood text-white border-oxblood");

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
  const toast = useToast();
  const saveDraft = () => { try { localStorage.setItem(key, JSON.stringify(f)); setSaved(true); toast.success("Draft saved on this device."); setTimeout(() => setSaved(false), 2000); } catch { /* no storage */ } };

  async function submit() {
    setErr(null);
    if (!f.recommendation) { setErr("Choose an overall recommendation."); return; }
    if (proof?.required && !f.recordingUrl.trim()) { setErr("Add the recording link: it's how we confirm the session took place."); return; }
    if (proof?.notDueYet && !f.heldAt) { setErr("This session isn't due yet, so say when it actually took place."); return; }
    setBusy(true);
    const r = await submitFeedbackAction(targetId, { ...(proof ? { recordingUrl: f.recordingUrl.trim() || undefined, heldAt: f.heldAt ? new Date(f.heldAt).toISOString() : undefined } : {}), scores: f.scores, strengths: f.strengths, weaknesses: f.weaknesses, redFlags: f.redFlags, answerFraming: f.answerFraming, questionsToPrepare: f.questionsToPrepare, recommendation: f.recommendation as never, privateNote: f.privateNote });
    setBusy(false);
    if (!r.ok) { setErr(r.error); toast.error(r.error); return; }
    toast.success("Feedback published to the student.");
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    router.push("/mentor/sessions?submitted=1");
    router.refresh();
  }
  const card = "rounded-2xl border border-line bg-card p-5 shadow-card";
  const scored = RUBRIC.filter((r) => f.scores[r] !== undefined);
  const avg = scored.length ? scored.reduce((n, r) => n + f.scores[r], 0) / scored.length : 0;
  const filled = (["strengths", "weaknesses"] as const).filter((k) => f[k].trim().length > 0).length;
  const steps = RUBRIC.length + 2 + 1 + (proof?.required ? 1 : 0);
  const done = scored.length + filled + (f.recommendation ? 1 : 0) + (proof?.required && f.recordingUrl.trim() ? 1 : 0);
  const pct = Math.round((done / steps) * 100);

  return (
    <div className="flex max-w-[860px] flex-col gap-4">
      {proof && (
        <div className={card}>
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-tint text-indigo"><Video aria-hidden className="size-[18px]" /></span><div><h2 className="font-display text-[15.5px] font-bold leading-[1.2] text-ink">Proof the session took place</h2><p className="mt-0.5 text-[12px] leading-[1.4] text-ink-faint">Any time works: before, during or after the slot ({proof.scheduledAtLabel}).</p></div></div>
          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div>
              <label htmlFor="recordingUrl" className="type-label mb-1.5 block text-ink-faint">Recording or video link{proof.required ? "" : " (optional for you)"}</label>
              <input id="recordingUrl" type="url" inputMode="url" value={f.recordingUrl} onChange={(e) => setF({ ...f, recordingUrl: e.target.value })} placeholder="https://drive.google.com/…" className="min-h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-base text-ink transition focus:border-oxblood focus:ring-2 focus:ring-oxblood/15 md:text-[13px]" />
            </div>
            <div>
              <label htmlFor="heldAt" className="type-label mb-1.5 block text-ink-faint">When did it take place?{proof.notDueYet ? " (needed — it isn’t due yet)" : " (optional)"}</label>
              <input id="heldAt" type="datetime-local" value={f.heldAt} onChange={(e) => setF({ ...f, heldAt: e.target.value })} className="min-h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-base text-ink transition focus:border-oxblood focus:ring-2 focus:ring-oxblood/15 md:text-[13px]" />
            </div>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-[1.5] text-ink-faint">Share the link so that Samrudh and the student can open it. Your pay for the session is added when you submit.</p>
        </div>
      )}

      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-oxblood-tint text-oxblood"><ClipboardList aria-hidden className="size-[18px]" /></span><div><h2 className="font-display text-[15.5px] font-bold leading-[1.2] text-ink">Score the rubric</h2><p className="mt-0.5 text-[12px] text-ink-faint">1 to 10 · colour shows where it lands</p></div></div>
          <div className="text-right"><p className="type-label text-ink-faint">Average</p><p className="tnum font-display text-[24px] font-bold leading-none text-ink">{scored.length ? avg.toFixed(1) : "—"}</p></div>
        </div>
        <div className="mt-4 flex flex-col gap-3.5">
          {RUBRIC.map((r) => (
            <div key={r} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span id={`r-${r}`} className="w-[134px] flex-none text-[12.5px] font-medium leading-[1.3] text-ink-2">{r}</span>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-labelledby={`r-${r}`}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={f.scores[r] === n} onClick={() => setF({ ...f, scores: { ...f.scores, [r]: n } })}
                    className={clsx("flex size-8 items-center justify-center rounded-lg border text-[11.5px] font-semibold transition-all duration-150", f.scores[r] === n ? `${scoreCls(n)} scale-110 shadow-card` : "border-line-strong bg-white text-ink-faint hover:border-oxblood hover:text-ink")}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {AREAS.map(([k, label, tone, ph, icon]) => (
          <div key={k} className="rounded-2xl border border-line bg-card p-4 shadow-card">
            <div className="flex items-center justify-between"><label htmlFor={k} className={clsx("type-label flex items-center gap-1.5 [&>svg]:size-3.5", tone)}>{icon}{label}</label><span className="tnum text-[10.5px] text-ink-faint">{f[k].trim() ? f[k].trim().split(/\s+/).length : 0} words</span></div>
            <textarea id={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} rows={4} className="mt-2.5 min-h-[96px] w-full rounded-xl border border-line bg-surface p-3 text-base leading-[1.6] text-ink transition focus:border-oxblood focus:bg-white focus:ring-2 focus:ring-oxblood/15 md:text-[12.5px]" />
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-teal-tint text-teal"><MessageSquareQuote aria-hidden className="size-[18px]" /></span><div><h2 className="font-display text-[15.5px] font-bold leading-[1.2] text-ink">Overall recommendation</h2><p className="mt-0.5 text-[12px] text-ink-faint">The one line the student remembers.</p></div></div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Overall recommendation">
          {RECS.map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={f.recommendation === id} onClick={() => setF({ ...f, recommendation: id })} className={clsx("rounded-xl border p-3 text-left transition-all duration-200", f.recommendation === id ? "border-oxblood bg-oxblood-tint ring-1 ring-oxblood/30" : "border-line-strong bg-white hover:border-oxblood")}>
              <span className="block text-[13px] font-semibold text-ink">{label}</span><span className="mt-0.5 block text-[11.5px] text-ink-faint">{REC_HINT[id]}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-oxblood-line bg-oxblood-tint/40 p-3.5">
          <label htmlFor="privateNote" className="type-label flex items-center gap-1.5 text-oxblood"><Lock aria-hidden className="size-3.5" />Private note to Samrudh</label>
          <p className="mt-1 text-[11.5px] leading-normal text-ink-faint">Never shown to the student.</p>
          <textarea id="privateNote" value={f.privateNote} onChange={(e) => setF({ ...f, privateNote: e.target.value })} rows={3} placeholder="Red flags, plagiarism, attitude, anything Samrudh should know." className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-base leading-[1.6] text-ink md:text-[12.5px]" />
        </div>
      </div>

      {err && <p role="alert" className="rounded-xl border border-oxblood-line bg-oxblood-tint px-4 py-3 text-[12.5px] text-oxblood">{err}</p>}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3.5 rounded-2xl bg-night p-3.5 pl-4 shadow-lift ring-1 ring-white/5">
        <ProgressRing value={pct} max={100} label={`${pct}%`} size={48} stroke={5} tone={pct >= 100 ? "teal" : "gold"} />
        <p className="min-w-0 flex-1 text-[12.5px] leading-[1.4] text-dark-soft"><span className="font-semibold text-white">{pct >= 100 ? "Ready to publish" : "Keep going"}</span><br />{done} of {steps} key parts done</p>
        <Button variant="onDark" onClick={saveDraft}>{saved ? "Draft saved" : "Save draft"}</Button>
        <Button disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit & publish"}</Button>
      </div>
    </div>
  );
}
