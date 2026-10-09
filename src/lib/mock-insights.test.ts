import { describe, expect, it } from "vitest";
import { analyse, type QInfo, type RInfo } from "./mock-analysis";
import { takeaways, verdict } from "./mock-insights";

const q = (n: number, section: string, correct = 0): QInfo => ({ id: `q${n}`, number: n, sectionName: section, topic: null, correct, marks: 1, negative: 0.25 });
const r = (n: number, choice: number | null, timeSec = 60, extra: Partial<RInfo> = {}): RInfo => ({ questionId: `q${n}`, choice, marked: false, visited: true, timeSec, changes: 0, ...extra });

describe("verdict", () => {
  it("is honest at both ends", () => {
    expect(verdict(50, 60).word).toBe("Excellent");
    expect(verdict(0, 60).word).toBe("A fresh start");
  });
});

describe("takeaways", () => {
  it("leads with the cost of wrong answers and names the dominant reason", () => {
    const qs = [q(1, "A"), q(2, "A"), q(3, "B"), q(4, "B")];
    const a = analyse(qs, [r(1, 1, 5), r(2, 1, 4), r(3, 0, 60), r(4, null, 0, { visited: false })], 240);
    const t = takeaways(a, 60);
    expect(t[0].tone).toBe("bad");
    expect(t[0].title).toContain("0.5");
    expect(t[0].body).toMatch(/rushed/);
    expect(t.some((x) => /never opened|ran out of time/i.test(x.title + x.body))).toBe(true);
  });
  it("says so when there is nothing to fix", () => {
    const a = analyse([q(1, "A"), q(2, "A")], [r(1, 0), r(2, 0)], 120);
    expect(takeaways(a, 60)[0].title).toBe("Nothing to fix");
  });
  it("never returns more than four", () => {
    const qs = Array.from({ length: 12 }, (_, i) => q(i + 1, i < 6 ? "A" : "B"));
    const a = analyse(qs, qs.map((x, i) => r(x.number, i < 6 ? 0 : 1, 30)), 720);
    expect(takeaways(a, 60).length).toBeLessThanOrEqual(4);
  });
});
