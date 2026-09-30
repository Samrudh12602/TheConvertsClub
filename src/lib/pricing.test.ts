import { describe, expect, it } from "vitest";
import { priceView, type CatalogProduct } from "./pricing";

const base: CatalogProduct = {
  slug: "x", name: "X", kind: "BUNDLE", pricePaise: 219900, mrpPaise: 299900, earlyBirdEndsAt: new Date("2099-01-01"),
  enrolledOnly: false, credits: [], summary: "", includes: [],
};

describe("priceView", () => {
  it("shows MRP, not the discounted price, even while an early-bird window would have been active", () => {
    const v = priceView(base);
    expect(v.payablePaise).toBe(299900);
    expect(v.strikePaise).toBeNull();
    expect(v.discountPaise).toBe(0);
    expect(v.earlyBirdActive).toBe(false);
  });
  it("shows MRP even once the (now-irrelevant) early-bird date is in the past", () => {
    const v = priceView({ ...base, earlyBirdEndsAt: new Date("2000-01-01") });
    expect(v.payablePaise).toBe(299900);
  });
  it("falls back to pricePaise only when there is no MRP at all", () => {
    const v = priceView({ ...base, mrpPaise: null });
    expect(v.payablePaise).toBe(219900);
  });
  it("an enrolled-only product (e.g. Additional PI) also shows its MRP, not the old automatic discount", () => {
    const v = priceView({ ...base, enrolledOnly: true, pricePaise: 44900, mrpPaise: 59900, earlyBirdEndsAt: null });
    expect(v.payablePaise).toBe(59900);
  });
});
