import { describe, expect, it } from "vitest";
import { PRODUCTS, SINGLES_ORDER } from "../../prisma/seed-data";
import { describeCredit, priceView } from "./pricing";

const bySlug = (s: string) => PRODUCTS.find((p) => p.slug === s)!;

describe("seed catalog matches the spec", () => {
  it("has the nine products at the specified prices", () => {
    expect(Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.pricePaise / 100]))).toEqual({
      "call-convert-plus": 2999,
      "call-convert": 2199,
      "mock-pi": 599,
      "additional-pi": 449,
      "mock-gd": 199,
      wat: 199,
      "sop-detailed": 399,
      "sop-basic": 99,
      "quick-guidance": 299,
    });
  });

  it("grants the specified credits for Call Convert", () => {
    expect(bySlug("call-convert").credits.map((c) => describeCredit(c))).toEqual([
      "4 mock PIs",
      "2 GD/GE batches",
      "1 WAT evaluation",
      "1 detailed SOP review",
      "1 strategy call",
    ]);
  });

  it("grants the specified credits for Call Convert Plus", () => {
    const q = (k: string) => bySlug("call-convert-plus").credits.find((c) => c.kind === k)?.quantity;
    expect([q("PI"), q("GD"), q("WAT"), q("SOP_DETAILED"), q("SOP_REVISION"), q("STRATEGY")]).toEqual([6, 3, 2, 1, 1, 2]);
  });

  it("only sells whole-rupee prices and never prices above MRP", () => {
    for (const p of PRODUCTS) {
      expect(Number.isInteger(p.pricePaise)).toBe(true);
      if (p.mrpPaise !== null) expect(p.pricePaise).toBeLessThan(p.mrpPaise);
    }
  });

  it("orders seven singles for the grid, all present", () => {
    expect(SINGLES_ORDER).toHaveLength(7);
    for (const s of SINGLES_ORDER) expect(bySlug(s).kind).toBe("SINGLE");
  });
});

describe("priceView", () => {
  it("shows the early-bird price before the deadline", () => {
    const v = priceView(bySlug("call-convert"), new Date("2026-12-01T00:00:00Z"));
    expect(v).toMatchObject({ payablePaise: 219900, strikePaise: 299900, discountPaise: 80000, earlyBirdActive: true });
  });
  it("reverts to MRP once early bird has ended", () => {
    const v = priceView(bySlug("call-convert"), new Date("2027-02-01T00:00:00Z"));
    expect(v).toMatchObject({ payablePaise: 299900, strikePaise: null, earlyBirdActive: false });
  });
  it("leaves products without an MRP alone", () => {
    expect(priceView(bySlug("mock-pi")).strikePaise).toBeNull();
  });
});
