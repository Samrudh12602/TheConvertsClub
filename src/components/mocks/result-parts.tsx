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

export interface MissGroup { kind: string; title: string; hint: string; numbers: number[]; tone: "wrong" | "skip" }

const TILE: Record<Outcome, string> = {
  correct: "bg-teal text-white",
  wrong: "bg-oxblood text-white",
  skipped: "bg-line-soft text-ink-muted ring-1 ring-inset ring-line-strong",
};

/** The whole paper as one map, why marks were lost, and every question with its solution. Click a square, or a reason, to jump in. */
export function ReviewExplorer({ items, groups }: { items: ReviewItem[]; groups: MissGroup[] }) {
  const [filter, setFilter] = useState<"all" | Outcome>("all");
  const [miss, setMiss] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const counts = { all: items.length, wrong: items.filter((i) => i.outcome === "wrong").length, skipped: items.filter((i) => i.outcome === "skipped").length, correct: items.filter((i) => i.outcome === "correct").length };
  const activeGroup = groups.find((g) => g.kind === miss) ?? null;
  const shown = items.filter((i) => (activeGroup ? activeGroup.numbers.includes(i.number) : filter === "all" || i.outcome === filter));
  const sections = [...new Set(items.map((i) => i.section))];

  const jump = (n: number) => {
    setFilter("all"); setMiss(null); setOpen(n);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`q-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" })));
  };

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="paper-map" className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="paper-map" className="font-display text-[17px] font-bold text-ink">Your paper at a glance</h2><p className="mt-0.5 text-[12.5px] text-ink-muted">Tap any square to open that question with its solution.</p></div>
          <div className="flex flex-wrap gap-3 text-[11.5px] font-medium text-ink-muted">{([["correct", "Right"], ["wrong", "Wrong"], ["skipped", "Blank"]] as const).map(([o, l]) => <span key={o} className="inline-flex items-center gap-1.5"><i className={clsx("size-3 rounded-[4px]", TILE[o])} />{l} · {counts[o]}</span>)}</div></div>
        <div className="mt-4 flex flex-col gap-4">
          {sections.map((sec) => (
            <div key={sec}><p className="type-label mb-2 text-ink-faint">{sec}</p>
              <div className="flex flex-wrap gap-1.5">{items.filter((i) => i.section === sec).map((i) => <button key={i.number} type="button" onClick={() => jump(i.number)} aria-label={`Question ${i.number}: ${TONE[i.outcome].word}`} className={clsx("tnum flex size-9 items-center justify-center rounded-lg text-[12.5px] font-bold transition hover:-translate-y-0.5 hover:shadow-card", TILE[i.outcome])}>{i.number}</button>)}</div></div>
          ))}
        </div>
      </section>

      {groups.length > 0 && (
        <section aria-labelledby="why-lost" className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <h2 id="why-lost" className="font-display text-[17px] font-bold text-ink">Why marks were lost</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">Tap a reason to see only those questions. These are guides, worked out from your timing and changed answers.</p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.kind}>
                <button type="button" onClick={() => { setMiss(miss === g.kind ? null : g.kind); setFilter("all"); }} aria-pressed={miss === g.kind} className={clsx("flex h-full w-full items-start gap-3 rounded-xl border p-3.5 text-left transition", miss === g.kind ? "border-oxblood bg-oxblood-tint" : "border-line bg-surface hover:border-line-strong")}>
                  <span className={clsx("tnum flex size-9 flex-none items-center justify-center rounded-lg font-display text-[15px] font-bold", g.tone === "wrong" ? "bg-oxblood text-white" : "bg-gold text-white")}>{g.numbers.length}</span>
                  <span className="min-w-0"><span className="block text-[13px] font-semibold text-ink">{g.title}</span><span className="mt-0.5 block text-[12px] leading-[1.5] text-ink-muted">{g.hint}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="every-q">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="every-q" className="font-display text-[17px] font-bold text-ink">{activeGroup ? activeGroup.title : "Every question, with the solution"}</h2>
          {activeGroup
            ? <button type="button" onClick={() => setMiss(null)} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-ink"><X className="size-3.5" aria-hidden />Clear filter</button>
            : <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter questions">{(["all", "wrong", "skipped", "correct"] as const).map((f) => <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={clsx("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition", filter === f ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2 hover:border-oxblood")}>{f === "all" ? "All" : f === "skipped" ? "Blank" : f === "wrong" ? "Wrong" : "Right"} · {counts[f]}</button>)}</div>}
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((i) => {
            const t = TONE[i.outcome];
            const isOpen = open === i.number;
            return (
              <li key={i.number} id={`q-${i.number}`} className={clsx("scroll-mt-24 overflow-hidden rounded-xl border bg-card shadow-xs", i.outcome === "correct" ? "border-l-4 border-line border-l-teal" : i.outcome === "wrong" ? "border-l-4 border-line border-l-oxblood" : "border-l-4 border-line border-l-line-strong")}>
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
                        return <li key={oi} className={clsx("flex gap-2.5 rounded-lg border px-3 py-2", right ? "border-teal-line bg-teal-tint" : mine ? "border-oxblood-line bg-oxblood-tint" : "border-line-soft")}><span className="font-semibold">{LET[oi]}.</span><span className="min-w-0 flex-1 whitespace-pre-wrap">{o}</span>{right && <span className="flex-none text-[11px] font-bold text-teal">{mine ? "Your answer · correct" : "Correct answer"}</span>}{mine && !right && <span className="flex-none text-[11px] font-bold text-oxblood">Your answer</span>}</li>;
                      })}
                    </ul>
                    {i.explanation && <div className="mt-3 rounded-lg bg-surface p-3"><p className="type-label text-ink-faint">How to solve it</p><p className="mt-1 whitespace-pre-wrap">{i.explanation}</p></div>}
                    <p className="mt-2 text-[11.5px] text-ink-faint">You spent {mmss(i.timeSec)} on this.{i.cohortPct !== null ? ` ${i.cohortPct}% of students who answered got it right.` : ""}</p>
                  </div>
                )}
              </li>
            );
          })}
          {shown.length === 0 && <li className="rounded-xl border border-dashed border-line-strong p-6 text-center text-[13px] text-ink-muted">Nothing here.</li>}
        </ul>
      </section>
    </div>
  );
}

/** One bar per question, tall for the time it took, coloured by how it went. The dashed line is an even pace. Sections are marked underneath. */
export function TimeBars({ items, paceSec }: { items: { number: number; timeSec: number; outcome: Outcome; section?: string }[]; paceSec: number }) {
  const max = Math.max(paceSec * 2.5, ...items.map((i) => i.timeSec), 1);
  const w = 960, h = 300, padB = 44, padT = 14, padL = 40;
  const bw = (w - padL - 6) / items.length;
  const y = (v: number) => h - padB - (Math.min(v, max) / max) * (h - padB - padT);
  const x = (k: number) => padL + k * bw;
  const fill: Record<Outcome, string> = { correct: "var(--color-teal)", wrong: "var(--color-oxblood)", skipped: "var(--color-line-strong)" };
  const step = max > 240 ? 120 : max > 120 ? 60 : 30;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  const groups: { name: string; from: number; to: number }[] = [];
  items.forEach((i, k) => { const g = groups[groups.length - 1]; if (i.section && g && g.name === i.section) g.to = k; else if (i.section) groups.push({ name: i.section, from: k, to: k }); });
  const short = (n: string) => (n.length > 22 ? n.split(/[ ,&]+/)[0] : n);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Time spent on each question, coloured by whether it was right, wrong or left blank">
      {ticks.map((t) => <g key={t}><line x1={padL} x2={w - 6} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" /><text x={padL - 8} y={y(t) + 3.5} textAnchor="end" fontSize="11" fill="var(--color-ink-faint)">{t >= 60 ? `${t / 60}m` : `${t}s`}</text></g>)}
      <line x1={padL} x2={w - 6} y1={y(paceSec)} y2={y(paceSec)} stroke="var(--color-gold)" strokeDasharray="6 5" strokeWidth="2" />
      <text x={w - 8} y={y(paceSec) - 7} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--color-gold-deep)">even pace · {Math.round(paceSec)}s a question</text>
      {items.map((i, k) => <rect key={i.number} x={x(k) + 1.5} y={y(i.timeSec)} width={Math.max(3, bw - 3)} height={Math.max(2, h - padB - y(i.timeSec))} rx="3" fill={fill[i.outcome]} opacity={i.outcome === "skipped" ? 0.9 : 0.9}><title>{`Question ${i.number}: ${mmss(i.timeSec)} · ${i.outcome === "correct" ? "right" : i.outcome === "wrong" ? "wrong" : "blank"}`}</title></rect>)}
      {items.map((i, k) => (i.number % 5 === 0 || i.number === 1) ? <text key={`l${i.number}`} x={x(k) + bw / 2} y={h - padB + 15} textAnchor="middle" fontSize="11" fill="var(--color-ink-faint)">{i.number}</text> : null)}
      {groups.map((g, gi) => (
        <g key={g.name}>
          <line x1={x(g.from) + 2} x2={x(g.to + 1) - 2} y1={h - 20} y2={h - 20} stroke="var(--color-line-strong)" strokeWidth="2" strokeLinecap="round" />
          <text x={(x(g.from) + x(g.to + 1)) / 2} y={h - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-ink-muted)">{short(g.name)}</text>
          {gi > 0 && <line x1={x(g.from)} x2={x(g.from)} y1={padT} y2={h - padB} stroke="var(--color-line-strong)" strokeDasharray="2 4" />}
        </g>
      ))}
    </svg>
  );
}
