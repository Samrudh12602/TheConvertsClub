import { describe, expect, it } from "vitest";
import { checkCoupon, priceView, type CatalogProduct } from "./pricing";

const base: CatalogProduct = {
  slug: "x", name: "X", kind: "BUNDLE", pricePaise: 259900, mrpPaise: 299900, mentorPricePaise: 219900,
  enrolledOnly: false, withAdmin: false, credits: [], summary: "", includes: [],
};

describe("priceView", () => {
  it("shows pricePaise as the default payable price, MRP struck through above it", () => {
    const v = priceView(base);
    expect(v.payablePaise).toBe(259900);
    expect(v.strikePaise).toBe(299900);
  });
  it("shows no strike-through when there's no MRP at all", () => {
    expect(priceView({ ...base, mrpPaise: null }).strikePaise).toBeNull();
  });
  it("shows no strike-through when MRP isn't actually higher than the price", () => {
    expect(priceView({ ...base, mrpPaise: 259900 }).strikePaise).toBeNull();
  });
});

describe("checkCoupon", () => {
  const generic = { type: "PERCENT" as const, value: 10, expiresAt: null, maxUses: null, usedCount: 0, active: true };
  const mentor = { ...generic, mentorId: "mentor-1" };

  it("applies a plain percent coupon normally", () => {
    const r = checkCoupon(generic, 100000);
    expect(r).toEqual({ ok: true, discountPaise: 10000 });
  });
  it("rejects an inactive coupon", () => {
    expect(checkCoupon({ ...generic, active: false }, 100000).ok).toBe(false);
  });
  it("rejects an expired coupon", () => {
    expect(checkCoupon({ ...generic, expiresAt: new Date("2000-01-01") }, 100000).ok).toBe(false);
  });
  it("rejects a coupon that's hit its max uses", () => {
    expect(checkCoupon({ ...generic, maxUses: 5, usedCount: 5 }, 100000).ok).toBe(false);
  });
  it("a mentor coupon does NOT apply to a product with no mentor price (only the flagship programs have one)", () => {
    const r = checkCoupon(mentor, 100000, new Date(), null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Call Convert/);
  });
  it("a mentor coupon with a per-product mentor price charges exactly that price, ignoring its own percent", () => {
    const r = checkCoupon(mentor, 259900, new Date(), 219900);
    expect(r).toEqual({ ok: true, discountPaise: 40000 });
  });
  it("a non-mentor coupon ignores a product's mentor price entirely", () => {
    const r = checkCoupon(generic, 259900, new Date(), 219900);
    expect(r).toEqual({ ok: true, discountPaise: 25900 });
  });
  it("never discounts below the minimum charge", () => {
    const r = checkCoupon({ ...generic, type: "FLAT", value: 100000 }, 199);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.discountPaise).toBe(99);
  });
});

describe("early bird", () => {
  const eb = (seatsLeft: number) => ({ ...base, pricePaise: 69900, mrpPaise: null, mentorPricePaise: null, earlyBird: { pricePaise: 59900, limit: 10, seatsLeft } });
  it("charges the early-bird price (normal price struck through) while seats remain", () => {
    expect(priceView(eb(7))).toEqual({ payablePaise: 59900, strikePaise: 69900 });
  });
  it("charges the normal price once the seats are gone", () => {
    expect(priceView(eb(0))).toEqual({ payablePaise: 69900, strikePaise: null });
  });
  it("ignores an early-bird price that isn't actually lower", () => {
    expect(priceView({ ...eb(5), earlyBird: { pricePaise: 69900, limit: 10, seatsLeft: 5 } }).payablePaise).toBe(69900);
  });
});
