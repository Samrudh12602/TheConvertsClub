import { describe, expect, it } from "vitest";
import { gatewayCost, gatewayFeeNotice, GATEWAY_EFFECTIVE_PERCENT, GATEWAY_FEE_STARTS_AT } from "./gateway-fee";

describe("gatewayCost", () => {
  it("is Rs 2,360 on Rs 1,00,000 (2% + 18% GST on the fee)", () => {
    const c = gatewayCost(100_000_00);
    expect(c.feePaise).toBe(2_000_00);
    expect(c.gstPaise).toBe(360_00);
    expect(c.totalPaise).toBe(2_360_00);
  });
  it("works on a single order", () => expect(gatewayCost(259_900).totalPaise).toBe(6_134)); // 5,198 + 936
  it("is nothing on nothing, and never negative", () => {
    expect(gatewayCost(0).totalPaise).toBe(0);
    expect(gatewayCost(-500).totalPaise).toBe(0);
  });
  it("is 2.36% overall", () => expect(GATEWAY_EFFECTIVE_PERCENT).toBeCloseTo(2.36, 5));
});

describe("Razorpay fee holiday", () => {
  it("is 63 days from 11 Oct 2026, ending 13 Dec 2026", () => {
    const n = gatewayFeeNotice(new Date("2026-10-11T10:00:00.000Z"));
    expect(n.freeNow).toBe(true);
    expect(n.daysLeft).toBe(63);
    expect(n.lastFreeDayLabel).toBe("13 Dec 2026");
    expect(n.startsLabel).toBe("14 Dec 2026");
  });
  it("counts days the Indian way: late evening UTC is already tomorrow in IST", () => {
    expect(gatewayFeeNotice(new Date("2026-10-11T20:00:00.000Z")).daysLeft).toBe(62);
  });
  it("is still free on the whole last day, down to the last minute in IST", () => {
    const n = gatewayFeeNotice(new Date("2026-12-13T18:29:00.000Z"));
    expect(n.freeNow).toBe(true);
    expect(n.daysLeft).toBe(0);
  });
  it("starts counting at midnight IST at the start of 14 Dec 2026", () => {
    expect(GATEWAY_FEE_STARTS_AT.toISOString()).toBe("2026-12-13T18:30:00.000Z");
    const n = gatewayFeeNotice(new Date("2026-12-13T18:30:00.000Z"));
    expect(n.freeNow).toBe(false);
    expect(n.daysLeft).toBe(-1);
  });
});
