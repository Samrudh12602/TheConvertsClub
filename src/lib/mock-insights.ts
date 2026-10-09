import type { Analysis, MissKind } from "@/lib/mock-analysis";

export type InsightTone = "bad" | "warn" | "good";
export interface Insight { tone: InsightTone; title: string; body: string }

const pctOf = (b: { score: number; maxScore: number }) => (b.maxScore ? Math.max(0, Math.round((b.score / b.maxScore) * 100)) : 0);
const marks = (n: number) => n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** A one-word read on the score, kept honest: practice marks, not a forecast. */
export function verdict(score: number, max: number): { word: string; line: string } {
  const p = max > 0 ? score / max : 0;
  if (p >= 0.75) return { word: "Excellent", line: "A very strong paper. Protect it: the marks left are small and fixable." };
  if (p >= 0.55) return { word: "Solid", line: "A good base. A few fixes below will move this up quickly." };
  if (p >= 0.35) return { word: "Getting there", line: "There are clear marks to win back. The list below shows where." };
  if (p > 0) return { word: "Room to grow", line: "Don't read too much into one paper. Start with the first item below." };
  return { word: "A fresh start", line: "Use this paper to learn the format, then work through the solutions." };
}

/** Three or four plain-English things to take away, most valuable first. */
export function takeaways(a: Analysis, paceSec: number): Insight[] {
  if (a.wrong === 0 && a.skipped === 0) return [{ tone: "good", title: "Nothing to fix", body: "Every question was right. That is a full-marks paper." }];
  const out: Insight[] = [];
  const m = a.misses;
  const n = (k: MissKind) => m[k].length;

  if (a.wrong > 0) {
    const kinds = (["rushed", "sink", "second-guess", "approach"] as const).map((k) => [k, n(k)] as const).sort((x, y) => y[1] - x[1]);
    const [top, count] = kinds[0];
    const why: Record<string, string> = {
      rushed: `${plural(count, "answer")} were rushed: much faster than your average, and wrong. Slow down on the stem and read every option.`,
      sink: `${plural(count, "question")} took you well over a minute and were still wrong. That points to a concept or method gap, so revise those solutions first.`,
      "second-guess": `${plural(count, "answer")} were changed more than once and ended up wrong. Keep your first answer unless you find a concrete reason to change it.`,
      approach: `${plural(count, "answer")} were wrong at a normal pace. Read the solutions: the method is probably what to fix.`,
    };
    out.push({ tone: "bad", title: `Wrong answers cost you ${marks(a.negativeLost)} marks`, body: why[top] + (a.avoidableNegative > 0 ? ` Leaving the rushed and flip-flopped ones blank would have saved ${marks(a.avoidableNegative)}.` : "") });
  }

  const lost = n("never-reached") + n("long-skip");
  if (lost > 0) {
    const nr = m["never-reached"];
    const body = nr.length > 0
      ? `Questions ${nr.length > 4 ? `${nr[0]} to ${nr[nr.length - 1]}` : nr.join(", ")} were never opened. Next time give each question a ceiling of about ${Math.round(paceSec * 1.5)} seconds and move on.`
      : `${plural(n("long-skip"), "question")} took a long time and were left blank. Set a hard ceiling per question and keep moving.`;
    out.push({ tone: "warn", title: nr.length > 0 ? `You ran out of time on ${plural(nr.length, "question")}` : `Time lost on ${plural(n("long-skip"), "question")} with no answer`, body });
  }

  const secs = a.bySection.filter((s) => s.b.total > 0).map((s) => ({ name: s.name, p: pctOf(s.b), b: s.b }));
  if (secs.length > 1) {
    const weak = [...secs].sort((x, y) => x.p - y.p)[0];
    const strong = [...secs].sort((x, y) => y.p - x.p)[0];
    if (weak.p < 60 && weak.name !== strong.name) {
      const perQ = weak.b.total ? Math.round(weak.b.timeSec / weak.b.total) : 0;
      out.push({ tone: "warn", title: `${weak.name} is your weakest section (${weak.p}%)`, body: `${weak.b.correct} of ${weak.b.total} right, ${perQ}s per question against an even pace of ${Math.round(paceSec)}s.${weak.b.wrong > weak.b.correct ? " More wrong than right: slow down and pick your questions." : ""}` });
    }
    if (strong.p >= 60 && strong.name !== weak.name) out.push({ tone: "good", title: `${strong.name} is your strength (${strong.p}%)`, body: `${strong.b.correct} of ${strong.b.total} right. Keep this section fast and safe so you can spend the saved minutes elsewhere.` });
  } else if (a.accuracy >= 75 && a.attempted > 0) {
    out.push({ tone: "good", title: `${a.accuracy}% accuracy`, body: "When you answered, you were usually right." });
  }

  const area = a.byArea.find((t) => t.b.correct < t.b.total);
  if (area && out.length < 4) out.push({ tone: "warn", title: `Revise first: ${area.name}`, body: `${area.b.correct} of ${area.b.total} right here, the lowest of any skill area. The worked solutions below start with the questions you missed.` });

  return out.slice(0, 4);
}
