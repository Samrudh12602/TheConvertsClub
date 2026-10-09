"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import { mmss, type Outcome } from "@/lib/mock-analysis";

export interface ReviewItem {
  number: number; section: string; topic: string | null; stem: string; context: { lines?: string[]; table?: string[][] | null } | null; options: string[]; correct: number; choice: number | null;
  outcome: Outcome; timeSec: number; marksEarned: number; explanation: string | null; cohortPct: number | null; miss: string | null;
}

const LET = ["A", "B", "C", "D", "E"];
const TONE: Record<Outcome, { chip: string; icon: React.ReactNode; word: string }> = {
  correct: { chip: "bg-teal-tint text-teal", icon: <Check className="size-3.5" aria-hidden />, word: "Correct" },
  wrong: { chip: "bg-oxblood-tint text-oxblood", icon: <X className="size-3.5" aria-hidden />, word: "Wrong" },
  skipped: { chip: "bg-line-soft text-ink-muted", icon: <Minus className="size-3.5" aria-hidden />, word: "Skipped" },
};

/** Every question with your answer, the right one and the worked solution, filterable. */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  const [filter, setFilter] = useState<"all" | Outcome>("all");
  const [open, setOpen] = useState<number | null>(null);
  const counts = { all: items.length, wrong: items.filter((i) => i.outcome === "wrong").length, skipped: items.filter((i) => i.outcome === "skipped").length, correct: items.filter((i) => i.outcome === "correct").length };
  const shown = items.filter((i) => filter === "all" || i.outcome === filter);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter questions">
        {(["all", "wrong", "skipped", "correct"] as const).map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={clsx("rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition", filter === f ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2 hover:border-oxblood")}>{f === "all" ? "All" : f} · {counts[f]}</button>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {shown.map((i) => {
          const t = TONE[i.outcome];
          const isOpen = open === i.number;
          return (
            <li key={i.number} className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
              <button type="button" onClick={() => setOpen(isOpen ? null : i.number)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="tnum flex size-8 flex-none items-center justify-center rounded-lg bg-surface font-display text-[13px] font-bold text-ink">{i.number}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-ink-body">{i.stem.split("\n")[0].slice(0, 120)}</span><span className="mt-0.5 block text-[11px] text-ink-faint">{i.section}{i.topic ? ` · ${i.topic}` : ""} · {mmss(i.timeSec)}</span></span>
                <span className={clsx("inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", t.chip)}>{t.icon}{t.word} {i.marksEarned > 0 ? `+${i.marksEarned}` : i.marksEarned < 0 ? i.marksEarned : ""}</span>
                <ChevronDown aria-hidden className={clsx("size-4 flex-none text-ink-faint transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="border-t border-line-soft px-4 py-4 text-[13px] leading-[1.65] text-ink-body">
                  {i.context?.lines?.map((l, k) => <p key={k} className={k === 0 ? "font-semibold" : ""}>{l}</p>)}
                  {i.context?.table && <div className="my-2 overflow-x-auto"><table className="border-collapse text-[12.5px]"><tbody>{i.context.table.map((row, ri) => <tr key={ri}>{row.map((c, ci) => (ri === 0 ? <th key={ci} className="border border-line-strong bg-surface px-2.5 py-1 text-left font-semibold">{c}</th> : <td key={ci} className="border border-line-strong px-2.5 py-1">{c}</td>))}</tr>)}</tbody></table></div>}
                  <p className="mt-1 whitespace-pre-wrap">{i.stem}</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {i.options.map((o, oi) => {
                      const right = oi === i.correct, mine = oi === i.choice;
                      return <li key={oi} className={clsx("flex gap-2.5 rounded-lg border px-3 py-2", right ? "border-teal-line bg-teal-tint" : mine ? "border-oxblood-line bg-oxblood-tint" : "border-line-soft")}><span className="font-semibold">{LET[oi]}.</span><span className="min-w-0 flex-1 whitespace-pre-wrap">{o}</span>{right && <span className="flex-none text-[11px] font-bold text-teal">Correct answer</span>}{mine && !right && <span className="flex-none text-[11px] font-bold text-oxblood">Your answer</span>}{mine && right && <span className="flex-none text-[11px] font-bold text-teal">Your answer</span>}</li>;
                    })}
                  </ul>
                  {i.explanation && <div className="mt-3 rounded-lg bg-surface p-3"><p className="type-label text-ink-faint">Solution</p><p className="mt-1 whitespace-pre-wrap">{i.explanation}</p></div>}
                  <p className="mt-2 text-[11.5px] text-ink-faint">You spent {mmss(i.timeSec)} on this.{i.cohortPct !== null ? ` ${i.cohortPct}% of students who answered got it right.` : ""}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One bar per question, tall for the time it took, coloured by how it went. The dashed line is an even pace. */
export function TimeBars({ items, paceSec }: { items: { number: number; timeSec: number; outcome: Outcome }[]; paceSec: number }) {
  const max = Math.max(paceSec * 2.5, ...items.map((i) => i.timeSec), 1);
  const w = 760, h = 150, padB = 20, padT = 8;
  const bw = (w - 8) / items.length;
  const y = (v: number) => h - padB - (Math.min(v, max) / max) * (h - padB - padT);
  const fill: Record<Outcome, string> = { correct: "var(--color-teal)", wrong: "var(--color-oxblood)", skipped: "var(--color-line-strong)" };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Time spent on each question">
      <line x1="4" x2={w - 4} y1={y(paceSec)} y2={y(paceSec)} stroke="var(--color-gold)" strokeDasharray="5 4" strokeWidth="1.5" />
      <text x={w - 6} y={y(paceSec) - 5} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--color-gold-deep)">even pace · {Math.round(paceSec)}s</text>
      {items.map((i, k) => <rect key={i.number} x={4 + k * bw + 1} y={y(i.timeSec)} width={Math.max(2, bw - 2)} height={Math.max(1, h - padB - y(i.timeSec))} rx="2" fill={fill[i.outcome]} opacity={i.outcome === "skipped" ? 0.9 : 0.85} />)}
      {items.map((i, k) => (i.number % 10 === 0 || i.number === 1) ? <text key={`l${i.number}`} x={4 + k * bw + bw / 2} y={h - 5} textAnchor="middle" fontSize="9.5" fill="var(--color-ink-faint)">{i.number}</text> : null)}
    </svg>
  );
}
