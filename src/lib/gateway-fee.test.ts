import { describe, expect, it } from "vitest";
import { gatewayCost, GATEWAY_EFFECTIVE_PERCENT } from "./gateway-fee";

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
