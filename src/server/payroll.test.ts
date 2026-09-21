import { describe, expect, it } from "vitest";
import { accrualFor, bonusesDue, nextThreshold, overallScore, periodKey, serviceForReview, serviceForSession, type BonusRuleLite, type RateTable } from "./payroll";

const rates: RateTable = { "SENIOR:PI": 40000, "SENIOR:SOP": 30000, "JUNIOR:PI": 25000 };

describe("accrual snapshots", () => {
  it("snapshots the tier's current rate", () => {
    expect(accrualFor("SENIOR", "PI", rates)).toEqual({ amountPaise: 40000, rateSnapshotPaise: 40000 });
    expect(accrualFor("JUNIOR", "PI", rates)?.amountPaise).toBe(25000);
  });
  it("later rate changes don't touch a snapshot already taken", () => {
    const snap = accrualFor("SENIOR", "PI", rates)!;
    rates["SENIOR:PI"] = 99999;
    expect(snap.amountPaise).toBe(40000);
    rates["SENIOR:PI"] = 40000;
  });
  it("refuses to accrue where a tier has no rate", () => {
    expect(accrualFor("JUNIOR", "SOP", rates)).toBeNull();
  });
});

describe("service mapping", () => {
  it("maps sessions and reviews to pay services", () => {
    expect(serviceForSession("MOCK_PI")).toBe("PI");
    expect(serviceForSession("STRATEGY_CALL")).toBeNull();
    expect(serviceForReview("SOP_DETAILED")).toBe("SOP");
    expect(serviceForReview("WAT")).toBe("WAT");
  });
});

const rules: BonusRuleLite[] = [
  { id: "s15", tier: "SENIOR", threshold: 15, amountPaise: 100000, active: true },
  { id: "s30", tier: "SENIOR", threshold: 30, amountPaise: 250000, active: true },
  { id: "s50", tier: "SENIOR", threshold: 50, amountPaise: 500000, active: true },
  { id: "j20", tier: "JUNIOR", threshold: 20, amountPaise: 50000, active: true },
];

describe("bonuses", () => {
  it("awards every threshold reached, once (cumulative)", () => {
    expect(bonusesDue("SENIOR", 32, rules, new Set()).map((r) => r.id)).toEqual(["s15", "s30"]);
    expect(bonusesDue("SENIOR", 32, rules, new Set(["s15"])).map((r) => r.id)).toEqual(["s30"]);
  });
  it("awards nothing below the first threshold", () => expect(bonusesDue("SENIOR", 14, rules, new Set())).toEqual([]));
  it("only uses the mentor's own tier rules", () => expect(bonusesDue("JUNIOR", 60, rules, new Set()).map((r) => r.id)).toEqual(["j20"]));
  it("ignores inactive rules", () => {
    expect(bonusesDue("SENIOR", 60, rules.map((r) => ({ ...r, active: false })), new Set())).toEqual([]);
  });
  it("finds the next milestone", () => {
    expect(nextThreshold("SENIOR", 48, rules)?.id).toBe("s50");
    expect(nextThreshold("SENIOR", 50, rules)).toBeNull();
  });
});

describe("periods and scores", () => {
  it("uses one key for a season and one per IST month", () => {
    expect(periodKey("SEASON", new Date())).toBe("season");
    expect(periodKey("MONTH", new Date("2027-01-31T20:00:00Z"))).toBe("2027-02"); // already 1 Feb in IST
  });
  it("averages a rubric to one decimal", () => {
    expect(overallScore({ a: 8, b: 7, c: 7, d: 6, e: 5, f: 6 })).toBe(6.5);
    expect(overallScore({})).toBe(0);
  });
});
