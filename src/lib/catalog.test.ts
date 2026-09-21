import { describe, expect, it } from "vitest";
import { describeCredit, getBundles, getProduct, getProducts, getSingles, priceView } from "./catalog";

describe("catalog matches the spec", () => {
  it("has the nine seeded products at the specified prices", async () => {
    const products = await getProducts();
    const byslug = Object.fromEntries(products.map((p) => [p.slug, p.pricePaise / 100]));
    expect(byslug).toEqual({
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

  it("grants the specified credits for Call Convert", async () => {
    const p = await getProduct("call-convert");
    expect(p?.credits.map((c) => describeCredit(c))).toEqual([
      "4 mock PIs",
      "2 GD/GE batches",
      "1 WAT evaluation",
      "1 detailed SOP review",
      "1 strategy call",
    ]);
  });

  it("grants the specified credits for Call Convert Plus", async () => {
    const p = await getProduct("call-convert-plus");
    const total = (k: string) => p?.credits.find((c) => c.kind === k)?.quantity;
    expect([total("PI"), total("GD"), total("WAT"), total("SOP_DETAILED"), total("SOP_REVISION"), total("STRATEGY")]).toEqual([6, 3, 2, 1, 1, 2]);
  });

  it("only sells whole-rupee prices and never prices above MRP", async () => {
    for (const p of await getProducts()) {
      expect(Number.isInteger(p.pricePaise)).toBe(true);
      if (p.mrpPaise !== null) expect(p.pricePaise).toBeLessThan(p.mrpPaise);
    }
  });

  it("exposes two bundles and seven singles", async () => {
    expect((await getBundles()).map((p) => p.slug)).toEqual(["call-convert", "call-convert-plus"]);
    expect(await getSingles()).toHaveLength(7);
  });
});

describe("priceView", () => {
  it("shows the early-bird price before the deadline", async () => {
    const p = (await getProduct("call-convert"))!;
    const v = priceView(p, new Date("2026-12-01T00:00:00Z"));
    expect(v.payablePaise).toBe(219900);
    expect(v.strikePaise).toBe(299900);
    expect(v.discountPaise).toBe(80000);
    expect(v.earlyBirdActive).toBe(true);
  });

  it("reverts to MRP once early bird has ended", async () => {
    const p = (await getProduct("call-convert"))!;
    const v = priceView(p, new Date("2027-02-01T00:00:00Z"));
    expect(v.payablePaise).toBe(299900);
    expect(v.strikePaise).toBeNull();
    expect(v.earlyBirdActive).toBe(false);
  });

  it("leaves products without an MRP alone", async () => {
    const p = (await getProduct("mock-pi"))!;
    expect(priceView(p).strikePaise).toBeNull();
  });
});
