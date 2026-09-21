import { describe, expect, it } from "vitest";
import { signForTest, verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";
import { checkCoupon, type CouponLite } from "../lib/pricing";

const secret = "test_secret_123";

describe("checkout signature", () => {
  const good = signForTest(secret, "order_A|pay_B");
  it("accepts a valid signature", () => expect(verifyCheckoutSignature("order_A", "pay_B", good, secret)).toBe(true));
  it("rejects a tampered order or payment id", () => {
    expect(verifyCheckoutSignature("order_X", "pay_B", good, secret)).toBe(false);
    expect(verifyCheckoutSignature("order_A", "pay_X", good, secret)).toBe(false);
  });
  it("rejects a wrong secret, empty values and wrong length", () => {
    expect(verifyCheckoutSignature("order_A", "pay_B", good, "other")).toBe(false);
    expect(verifyCheckoutSignature("order_A", "pay_B", "", secret)).toBe(false);
    expect(verifyCheckoutSignature("order_A", "pay_B", "abc", secret)).toBe(false);
  });
});

describe("webhook signature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_B" } } } });
  const sig = signForTest(secret, body);
  it("accepts the exact raw body", () => expect(verifyWebhookSignature(body, sig, secret)).toBe(true));
  it("rejects a modified body (even whitespace)", () => expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false));
  it("rejects a missing header or secret", () => {
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, sig, "")).toBe(false);
  });
});

const base: CouponLite = { type: "PERCENT", value: 10, expiresAt: null, maxUses: null, usedCount: 0, active: true };
describe("coupons", () => {
  it("applies a percent discount, rounded down to whole paise", () => {
    expect(checkCoupon(base, 219900)).toEqual({ ok: true, discountPaise: 21990 });
  });
  it("applies a flat discount", () => expect(checkCoupon({ ...base, type: "FLAT", value: 50000 }, 219900)).toEqual({ ok: true, discountPaise: 50000 }));
  it("never takes the order below ₹1", () => {
    expect(checkCoupon({ ...base, type: "FLAT", value: 999999 }, 9900)).toEqual({ ok: true, discountPaise: 9800 });
  });
  it("rejects expired, exhausted, inactive and unknown codes", () => {
    expect(checkCoupon({ ...base, expiresAt: new Date("2020-01-01") }, 100000).ok).toBe(false);
    expect(checkCoupon({ ...base, maxUses: 5, usedCount: 5 }, 100000).ok).toBe(false);
    expect(checkCoupon({ ...base, active: false }, 100000).ok).toBe(false);
    expect(checkCoupon(null, 100000).ok).toBe(false);
  });
});
