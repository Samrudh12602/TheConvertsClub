import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings-db", () => ({ getSettings: async () => ({}) }));
import { referralBatches, type ReferredOrder } from "./referral-bonus";

const day = (n: number) => new Date(Date.UTC(2026, 9, n + 1));
const o = (student: string, paise: number, d: number): ReferredOrder => ({ studentKey: student, amountPaise: paise, createdAt: day(d) });
const ten = (paise: number) => Array.from({ length: 10 }, (_, i) => o(`s${i}`, paise, i));

describe("referralBatches", () => {
  it("pays nothing until ten students have bought", () => {
    const r = referralBatches(ten(219_900).slice(0, 9), 10, 5);
    expect(r.students).toBe(9);
    expect(r.batches).toEqual([]);
  });
  it("pays 5% of the fees ten students paid", () => {
    const r = referralBatches(ten(219_900), 10, 5);
    expect(r.batches).toHaveLength(1);
    expect(r.batches[0]).toMatchObject({ batch: 1, students: 10, basePaise: 2_199_000, amountPaise: 109_950 });
  });
  it("counts a student once, but counts all of their referred fees", () => {
    const orders = [...ten(100_000).slice(0, 9), o("s9", 100_000, 9), o("s0", 50_000, 11)]; // s0 buys twice
    const r = referralBatches(orders, 10, 5);
    expect(r.students).toBe(10);
    expect(r.batches[0].basePaise).toBe(1_050_000);
  });
  it("makes a new group each time ten more students arrive, and skips groups already paid", () => {
    const twenty = [...ten(200_000), ...Array.from({ length: 10 }, (_, i) => o(`t${i}`, 100_000, 20 + i))];
    expect(referralBatches(twenty, 10, 5).batches.map((b) => b.batch)).toEqual([1, 2]);
    const next = referralBatches(twenty, 10, 5, new Set([1]));
    expect(next.batches).toHaveLength(1);
    expect(next.batches[0]).toMatchObject({ batch: 2, basePaise: 1_000_000, amountPaise: 50_000 });
  });
  it("follows the settings: a different group size and rate, and 0% switches it off", () => {
    expect(referralBatches(ten(100_000), 5, 10).batches.map((b) => b.amountPaise)).toEqual([50_000, 50_000]);
    expect(referralBatches(ten(100_000), 10, 0).batches).toEqual([]);
  });
});
