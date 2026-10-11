import { describe, expect, it } from "vitest";
import { bucketByDay, compactInr, greeting, histogram, istDayKey, lastDays, pctDelta, sum, weekHeat, wholePercents } from "./metrics";

describe("days", () => {
  it("counts days the Indian way: 9pm UTC is already tomorrow in IST", () => {
    expect(istDayKey(new Date("2026-10-11T20:00:00Z"))).toBe("2026-10-12");
    expect(istDayKey(new Date("2026-10-11T10:00:00Z"))).toBe("2026-10-11");
  });
  it("lists the last n days, oldest first, ending today", () => {
    const d = lastDays(3, new Date("2026-10-11T10:00:00Z"));
    expect(d.map((x) => x.key)).toEqual(["2026-10-09", "2026-10-10", "2026-10-11"]);
    expect(d[2].label).toBe("11 Oct");
  });
  it("puts each row on its own day and ignores rows outside the window", () => {
    const d = lastDays(3, new Date("2026-10-11T10:00:00Z"));
    const out = bucketByDay([
      { at: new Date("2026-10-11T09:00:00Z"), v: 5 }, { at: new Date("2026-10-11T11:00:00Z"), v: 7 },
      { at: new Date("2026-10-09T01:00:00Z"), v: 1 }, { at: new Date("2026-09-01T00:00:00Z"), v: 99 },
    ], d);
    expect(out).toEqual([1, 0, 12]);
  });
});

describe("pctDelta", () => {
  it("is the percent change", () => { expect(pctDelta(150, 100)).toBe(50); expect(pctDelta(50, 100)).toBe(-50); });
  it("is null when there is nothing to compare with", () => { expect(pctDelta(0, 0)).toBeNull(); expect(pctDelta(10, 0)).toBeNull(); });
});

describe("compactInr", () => {
  it("shortens in the Indian way", () => {
    expect(compactInr(98000)).toBe("₹980");
    expect(compactInr(4_50_000)).toBe("₹4,500");
    expect(compactInr(12_50_000)).toBe("₹12.5K");
    expect(compactInr(1_20_00_000)).toBe("₹1.2L");
    expect(compactInr(2_50_00_00_000)).toBe("₹2.5Cr");
    expect(compactInr(0)).toBe("₹0");
  });
});

describe("histogram", () => {
  it("counts into equal bands, with the top value in the last band", () => {
    expect(histogram([0, 5, 9.9, 10, 10], 5, 10)).toEqual([1, 0, 1, 0, 3]);
  });
  it("ignores values that are not numbers", () => expect(histogram([NaN, 1], 2, 10)).toEqual([1, 0]));
});

describe("weekHeat", () => {
  it("files an IST Monday 09:30 under Monday, band 3", () => {
    const g = weekHeat([new Date("2026-10-12T04:00:00Z")]); // 12 Oct 2026 is a Monday; 04:00Z = 09:30 IST
    expect(g[0][3]).toBe(1);
    expect(sum(g.flat())).toBe(1);
  });
});

describe("wholePercents", () => {
  it("always adds up to 100", () => {
    for (const v of [[1, 1, 1], [33, 33, 34], [5, 3, 2, 1], [1]]) expect(sum(wholePercents(v))).toBe(100);
  });
  it("is all zeros for nothing", () => expect(wholePercents([0, 0])).toEqual([0, 0]));
});

describe("greeting", () => {
  it("follows the hour in India", () => {
    expect(greeting(new Date("2026-10-11T03:00:00Z"))).toBe("Good morning");
    expect(greeting(new Date("2026-10-11T08:00:00Z"))).toBe("Good afternoon");
    expect(greeting(new Date("2026-10-11T14:00:00Z"))).toBe("Good evening");
  });
});
