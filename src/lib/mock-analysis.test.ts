import { describe, expect, it } from "vitest";
import { analyse, classifyMiss, paceSec, percentile, outcomeOf, type QInfo, type RInfo } from "./mock-analysis";

const q = (n: number, correct: number, section = "A", topic: string | null = "T"): QInfo => ({ id: `q${n}`, number: n, sectionName: section, topic, correct, marks: 1, negative: 0.25 });
const r = (n: number, choice: number | null, timeSec = 60, extra: Partial<RInfo> = {}): RInfo => ({ questionId: `q${n}`, choice, marked: false, visited: true, timeSec, changes: 0, ...extra });

describe("marking", () => {
  it("gives +1 for right, -0.25 for wrong and 0 for blank", () => {
    const a = analyse([q(1, 0), q(2, 1), q(3, 2), q(4, 3)], [r(1, 0), r(2, 0), r(3, null)], 240);
    expect(a.correct).toBe(1);
    expect(a.wrong).toBe(1);
    expect(a.skipped).toBe(2);
    expect(a.score).toBe(0.75);
    expect(a.negativeLost).toBe(0.25);
  });
  it("treats a missing response as skipped", () => {
    expect(outcomeOf(q(1, 0), undefined)).toBe("skipped");
  });
  it("computes accuracy over attempted questions and attempt rate over all", () => {
    const a = analyse([q(1, 0), q(2, 0), q(3, 0), q(4, 0)], [r(1, 0), r(2, 0), r(3, 1)], 240);
    expect(a.accuracy).toBeCloseTo(66.7, 1);
    expect(a.attemptRate).toBe(75);
  });
});

describe("sections and topics", () => {
  it("adds up per section and per topic", () => {
    const qs = [q(1, 0, "English", "Vocab"), q(2, 0, "English", "Vocab"), q(3, 0, "Quant", "Algebra")];
    const a = analyse(qs, [r(1, 0), r(2, 1), r(3, 0)], 180);
    expect(a.bySection.map((s) => [s.name, s.b.score])).toEqual([["English", 0.75], ["Quant", 1]]);
    expect(a.byTopic[0].name).toBe("Vocab"); // weakest first
  });
  it("falls back to the section name when a question has no topic", () => {
    const a = analyse([q(1, 0, "Reasoning", null)], [r(1, 0)], 60);
    expect(a.byTopic[0].name).toBe("Reasoning");
  });
});

describe("skill areas and time", () => {
  it("rolls topics up into areas", () => {
    const qs = [q(1, 0, "English", "Antonyms"), q(2, 0, "English", "Idioms & phrases"), q(3, 0, "English", "Error spotting")];
    const a = analyse(qs, [r(1, 0), r(2, 1), r(3, 0)], 180);
    expect(a.byArea.map((x) => x.name).sort()).toEqual(["Grammar and usage", "Vocabulary"]);
    expect(a.byArea.find((x) => x.name === "Vocabulary")!.b.total).toBe(2);
  });
  it("never reports more time used than the paper allows", () => {
    expect(analyse([q(1, 0)], [r(1, 0, 5000)], 3600).timeUsedSec).toBe(3600);
  });
});

describe("what went wrong", () => {
  const pace = paceSec(3600, 60);
  it("paces a 60-question, 60-minute paper at a minute each", () => expect(pace).toBe(60));
  it("calls a fast wrong answer rushed", () => expect(classifyMiss("wrong", r(1, 1, 10), pace)).toBe("rushed"));
  it("calls a long wrong answer a concept gap", () => expect(classifyMiss("wrong", r(1, 1, 150), pace)).toBe("sink"));
  it("calls a flip-flopped wrong answer second-guessing, whatever the time", () => expect(classifyMiss("wrong", r(1, 1, 150, { changes: 2 }), pace)).toBe("second-guess"));
  it("calls a normal-paced wrong answer a wrong approach", () => expect(classifyMiss("wrong", r(1, 1, 60), pace)).toBe("approach"));
  it("separates never-reached from skipped", () => {
    expect(classifyMiss("skipped", undefined, pace)).toBe("never-reached");
    expect(classifyMiss("skipped", r(1, null, 0, { visited: false }), pace)).toBe("never-reached");
    expect(classifyMiss("skipped", r(1, null, 120), pace)).toBe("long-skip");
    expect(classifyMiss("skipped", r(1, null, 20), pace)).toBe("chose-skip");
  });
  it("has no miss for a correct answer", () => expect(classifyMiss("correct", r(1, 0), pace)).toBeNull());
  it("totals the negative marks that rushed or flip-flopped answers cost", () => {
    const a = analyse([q(1, 0), q(2, 0), q(3, 0)], [r(1, 1, 5), r(2, 1, 60, { changes: 3 }), r(3, 1, 200)], 180);
    expect(a.avoidableNegative).toBe(0.5);
    expect(a.misses.rushed).toEqual([1]);
    expect(a.misses["second-guess"]).toEqual([2]);
    expect(a.misses.sink).toEqual([3]);
  });
});

describe("percentile", () => {
  it("stays hidden while the cohort is small", () => expect(percentile(40, [10, 20, 30])).toBeNull());
  it("is the share scored below, counting ties as half", () => {
    const others = Array.from({ length: 40 }, (_, i) => i);
    expect(percentile(20, others)).toBe(51.3);
    expect(percentile(100, others)).toBe(100);
  });
});
