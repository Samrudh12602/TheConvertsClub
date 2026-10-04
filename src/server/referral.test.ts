import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import type { CatalogProduct } from "@/lib/pricing";
import { referralPrice, type Referral } from "./referral";

const product = (over: Partial<CatalogProduct> = {}) => ({ slug: "call-convert-plus", name: "Call Convert Plus", pricePaise: 399900, mrpPaise: 499900, mentorPricePaise: 299900, enrolledOnly: false, ...over }) as CatalogProduct;
const ref = (over: Partial<Referral["coupon"]> = {}): Referral => ({ code: "ROHKU272", mentorFirst: "Rohit", coupon: { type: "PERCENT", value: 10, expiresAt: null, maxUses: null, usedCount: 0, active: true, mentorId: "m1", ...over } });

describe("referralPrice", () => {
  it("shows the exact mentor price when the product has one", () => {
    expect(referralPrice(product(), ref())).toBe(299900);
  });
  it("falls back to the coupon's own percent when the product has no mentor price", () => {
    expect(referralPrice(product({ mentorPricePaise: null, pricePaise: 100000 }), ref())).toBe(90000);
  });
  it("shows nothing without a referral", () => {
    expect(referralPrice(product(), null)).toBeNull();
  });
  it("shows nothing when the code is switched off or used up", () => {
    expect(referralPrice(product(), ref({ active: false }))).toBeNull();
    expect(referralPrice(product(), ref({ maxUses: 5, usedCount: 5 }))).toBeNull();
  });
});
