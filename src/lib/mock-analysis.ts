import { areaFor } from "@/lib/mock-topics";

/**
 * Scoring and the post-mock analysis. Pure functions, no database, so every rule here is unit-tested.
 * The classification of mistakes is a heuristic from time spent and answer changes: it says what a miss most likely was,
 * and the report words it as "likely", never as fact.
 */

export interface QInfo { id: string; number: number; sectionName: string; topic: string | null; correct: number; marks: number; negative: number }
export interface RInfo { questionId: string; choice: number | null; marked: boolean; visited: boolean; timeSec: number; changes: number }

export type Outcome = "correct" | "wrong" | "skipped";

export type MissKind =
  | "rushed"        // wrong, answered far faster than average: likely careless
  | "sink"          // wrong after a long time: likely a concept or method gap
  | "second-guess"  // wrong after changing the answer more than once
  | "approach"      // wrong at a normal pace: likely a wrong approach or concept
  | "never-reached" // never opened: ran out of time
  | "long-skip"     // opened, spent a long time, left it: time lost for nothing
  | "chose-skip";   // opened briefly and left it on purpose

export const MISS_LABEL: Record<MissKind, { title: string; hint: string }> = {
  rushed: { title: "Rushed and wrong", hint: "Answered much faster than your average and got it wrong. Likely a careless read: slow down on the stem and the options." },
  sink: { title: "Long time, still wrong", hint: "You spent well over a minute and still missed. Likely a concept or method gap: this is where to revise." },
  "second-guess": { title: "Changed your mind", hint: "You changed your answer more than once and ended up wrong. Trust the first instinct unless you find a concrete reason." },
  approach: { title: "Wrong approach", hint: "A normal amount of time, wrong answer. Read the solution: the method is probably what to fix." },
  "never-reached": { title: "Never reached", hint: "You didn't open these. Time ran out: attempt order and speed on the earlier sections matter more than these." },
  "long-skip": { title: "Time lost, no answer", hint: "You spent a long time and left it blank. Set a hard ceiling per question and move on." },
  "chose-skip": { title: "Skipped on purpose", hint: "A sensible skip under negative marking. Check the solution to see if it was within reach." },
};

export interface QResult extends QInfo { outcome: Outcome; choice: number | null; marked: boolean; timeSec: number; changes: number; visited: boolean; marksEarned: number; miss: MissKind | null }

export function outcomeOf(q: QInfo, r: RInfo | undefined): Outcome {
  if (!r || r.choice === null || r.choice === undefined) return "skipped";
  return r.choice === q.correct ? "correct" : "wrong";
}

/** The time one question gets if the paper is paced evenly. */
export const paceSec = (durationSec: number, questions: number) => (questions > 0 ? durationSec / questions : 60);

export function classifyMiss(outcome: Outcome, r: RInfo | undefined, pace: number): MissKind | null {
  if (outcome === "correct") return null;
  const time = r?.timeSec ?? 0;
  const visited = Boolean(r?.visited) && (r?.timeSec ?? 0) > 0 || Boolean(r?.marked);
  if (outcome === "wrong") {
    if ((r?.changes ?? 0) >= 2) return "second-guess";
    if (time < 0.4 * pace) return "rushed";
    if (time > 2 * pace) return "sink";
    return "approach";
  }
  if (!visited && time === 0) return "never-reached";
  if (time >= 1.5 * pace) return "long-skip";
  return "chose-skip";
}

export interface Bucket { total: number; correct: number; wrong: number; skipped: number; score: number; timeSec: number; maxScore: number }
const empty = (): Bucket => ({ total: 0, correct: 0, wrong: 0, skipped: 0, score: 0, timeSec: 0, maxScore: 0 });

export interface Analysis {
  score: number; maxScore: number; correct: number; wrong: number; skipped: number; attempted: number; accuracy: number; attemptRate: number;
  negativeLost: number; timeUsedSec: number;
  bySection: { name: string; b: Bucket }[]; byTopic: { name: string; b: Bucket }[]; byArea: { name: string; b: Bucket }[];
  results: QResult[];
  misses: Record<MissKind, number[]>;
  /** Marks you would have kept by leaving the lowest-confidence wrong answers (fast or flip-flopped ones) blank. */
  avoidableNegative: number;
}

export function analyse(qs: QInfo[], rs: RInfo[], durationSec: number): Analysis {
  const byQ = new Map(rs.map((r) => [r.questionId, r]));
  const pace = paceSec(durationSec, qs.length);
  const results: QResult[] = qs.map((q) => {
    const r = byQ.get(q.id);
    const outcome = outcomeOf(q, r);
    return { ...q, outcome, choice: r?.choice ?? null, marked: r?.marked ?? false, timeSec: r?.timeSec ?? 0, changes: r?.changes ?? 0, visited: r?.visited ?? false,
      marksEarned: outcome === "correct" ? q.marks : outcome === "wrong" ? -q.negative : 0, miss: classifyMiss(outcome, r, pace) };
  });
  const add = (map: Map<string, Bucket>, key: string, x: QResult) => {
    const b = map.get(key) ?? empty();
    b.total++; b.maxScore += x.marks; b.timeSec += x.timeSec; b.score += x.marksEarned;
    if (x.outcome === "correct") b.correct++; else if (x.outcome === "wrong") b.wrong++; else b.skipped++;
    map.set(key, b);
  };
  const sec = new Map<string, Bucket>(), top = new Map<string, Bucket>(), area = new Map<string, Bucket>();
  const order: string[] = [];
  for (const x of results) { if (!sec.has(x.sectionName)) order.push(x.sectionName); add(sec, x.sectionName, x); add(top, x.topic ?? x.sectionName, x); add(area, areaFor(x.topic, x.sectionName), x); }
  const misses = { rushed: [], sink: [], "second-guess": [], approach: [], "never-reached": [], "long-skip": [], "chose-skip": [] } as Record<MissKind, number[]>;
  for (const x of results) if (x.miss) misses[x.miss].push(x.number);
  const correct = results.filter((x) => x.outcome === "correct").length;
  const wrong = results.filter((x) => x.outcome === "wrong").length;
  const attempted = correct + wrong;
  const score = Math.round(results.reduce((n, x) => n + x.marksEarned, 0) * 100) / 100;
  const negativeLost = Math.round(results.filter((x) => x.outcome === "wrong").reduce((n, x) => n + x.negative, 0) * 100) / 100;
  const avoidable = results.filter((x) => x.outcome === "wrong" && (x.miss === "rushed" || x.miss === "second-guess")).reduce((n, x) => n + x.negative, 0);
  return {
    score, maxScore: results.reduce((n, x) => n + x.marks, 0), correct, wrong, skipped: results.length - attempted, attempted,
    accuracy: attempted ? Math.round((correct / attempted) * 1000) / 10 : 0, attemptRate: results.length ? Math.round((attempted / results.length) * 1000) / 10 : 0,
    negativeLost, timeUsedSec: Math.min(durationSec, results.reduce((n, x) => n + x.timeSec, 0)),
    bySection: order.map((name) => ({ name, b: sec.get(name)! })),
    byTopic: [...top].map(([name, b]) => ({ name, b })).sort((a, b) => a.b.score / Math.max(1, a.b.maxScore) - b.b.score / Math.max(1, b.b.maxScore)),
    byArea: [...area].map(([name, b]) => ({ name, b })).sort((a, b) => a.b.score / Math.max(1, a.b.maxScore) - b.b.score / Math.max(1, b.b.maxScore)),
    results, misses, avoidableNegative: Math.round(avoidable * 100) / 100,
  };
}

/** Whether the cohort is big enough to show a percentile without it being misleading. */
export const MIN_COHORT_FOR_PERCENTILE = 30;
export const MIN_COHORT_FOR_QUESTION_STATS = 8;

/** Percentile = share of the other submitted attempts you scored at least as high as. Null while the cohort is too small. */
export function percentile(score: number, others: number[]): number | null {
  if (others.length + 1 < MIN_COHORT_FOR_PERCENTILE) return null;
  const below = others.filter((s) => s < score).length + others.filter((s) => s === score).length / 2;
  return Math.round((below / others.length) * 1000) / 10;
}

/** "mm:ss" for a number of seconds. */
export const mmss = (sec: number) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.max(0, Math.round(sec)) % 60).padStart(2, "0")}`;
