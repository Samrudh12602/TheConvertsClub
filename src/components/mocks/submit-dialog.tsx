"use client";

import clsx from "clsx";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Flag, Send } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface SubmitSection { name: string; total: number; answered: number; marked: number; notAnswered: number; notVisited: number }
interface Props { open: boolean; onClose: () => void; onSubmit: () => void; busy: boolean; sections: SubmitSection[]; timeLeft: string; secondsLeft: number }

const TILES = [
  { key: "answered", label: "Answered", bar: "bg-[#3f9a2b]", tile: "bg-[#e9f6e4] text-[#2d7a1c]" },
  { key: "marked", label: "Review, no answer", bar: "bg-[#6b46ab]", tile: "bg-[#efe9f8] text-[#5f3a9e]" },
  { key: "notAnswered", label: "Not answered", bar: "bg-[#e0562d]", tile: "bg-[#fcebe5] text-[#b8431a]" },
  { key: "notVisited", label: "Not visited", bar: "bg-[#c4cbd3]", tile: "bg-[#eef1f4] text-[#4b5563]" },
] as const;

/** The confirm-before-you-submit pop-up: one glance at how complete the paper is, with a warning only when something is left. */
export function SubmitDialog({ open, onClose, onSubmit, busy, sections, timeLeft, secondsLeft }: Props) {
  // "For review" here means flagged-but-unanswered, so the four tiles add up to the paper.
  const sum = (k: keyof SubmitSection) => sections.reduce((n, s) => n + (s[k] as number), 0);
  const totals = { answered: sum("answered"), marked: sum("marked"), notAnswered: sum("notAnswered"), notVisited: sum("notVisited") };
  const total = sum("total");
  const unfinished = totals.notAnswered + totals.notVisited + totals.marked;
  const longLeft = secondsLeft > 300;
  return (
    <Dialog open={open} onClose={() => { if (!busy) onClose(); }} title="Ready to submit?" className="max-w-[560px]">
      <p className="-mt-1 text-[13.5px] leading-[1.6] text-ink-muted">Once you submit, the paper closes and your analysis opens. You can&apos;t come back to change an answer.</p>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-[#e5e8ec]" role="img" aria-label={`${totals.answered} of ${total} answered`}>
        {TILES.map((t) => totals[t.key] > 0 && <span key={t.key} className={clsx("h-full", t.bar)} style={{ width: `${(totals[t.key] / total) * 100}%` }} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {TILES.map((t) => (
          <div key={t.key} className={clsx("rounded-xl px-3 py-2.5", t.tile)}>
            <p className="tnum font-display text-[24px] font-bold leading-none">{totals[t.key]}</p>
            <p className="mt-1 text-[11.5px] font-semibold">{t.label}</p>
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {sections.map((s) => (
          <li key={s.name} className="flex items-center gap-3 text-[12.5px]">
            <span className="w-[42%] min-w-0 truncate font-medium text-ink-2">{s.name}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e8ec]"><span className="block h-full rounded-full bg-[#3f9a2b]" style={{ width: `${s.total ? (s.answered / s.total) * 100 : 0}%` }} /></span>
            <span className="tnum w-12 flex-none text-right font-semibold text-ink">{s.answered}/{s.total}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-[12.5px] text-ink-2"><Clock className="size-4 flex-none text-ink-faint" aria-hidden /><span><b className="tnum">{timeLeft}</b> left on the clock.{longLeft ? " You still have time to review." : ""}</span></div>
      {unfinished > 0 ? (
        <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-[#f0d9a8] bg-[#fdf6e3] px-3.5 py-3 text-[12.5px] leading-[1.55] text-[#7a5410]">
          <AlertTriangle className="mt-0.5 size-4 flex-none" aria-hidden />
          <p>{totals.notAnswered + totals.notVisited > 0 ? <><b>{totals.notAnswered + totals.notVisited} question{totals.notAnswered + totals.notVisited === 1 ? " has" : "s have"} no answer.</b> They score 0 with no penalty.</> : null}{totals.marked > 0 ? <> <Flag className="inline size-3.5 align-[-2px]" aria-hidden /> {totals.marked} marked for review {totals.marked === 1 ? "has" : "have"} no answer yet.</> : null}</p>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-[#c8e4bf] bg-[#eef8ea] px-3.5 py-3 text-[12.5px] font-medium text-[#2d7a1c]"><CheckCircle2 className="size-4 flex-none" aria-hidden />Every question has an answer.</div>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={busy} autoFocus><ArrowLeft className="size-4" aria-hidden />Go back to the exam</Button>
        <button type="button" onClick={onSubmit} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#3f9a2b] to-[#2d7a1c] px-5 text-[13px] font-semibold leading-none text-white shadow-card transition hover:brightness-110 disabled:opacity-60"><Send className="size-4" aria-hidden />{busy ? "Submitting…" : "Submit and see my analysis"}</button>
      </div>
    </Dialog>
  );
}
