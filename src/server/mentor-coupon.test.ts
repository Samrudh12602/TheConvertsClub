import { describe, expect, it } from "vitest";
import { generateMentorCouponCode, lettersFromName } from "./mentor-coupon";

describe("lettersFromName", () => {
  it("takes 3 from the first name and 2 from the last, always 5 letters", () => {
    expect(lettersFromName("Rohit Kulkarni")).toBe("ROHKU");
    expect(lettersFromName("Ananya Nair")).toBe("ANANA");
  });
  it("strips a (demo) suffix before building the code", () => {
    expect(lettersFromName("Rohit Kulkarni (demo)")).toBe("ROHKU");
  });
  it("pads a short name with X rather than crashing", () => {
    expect(lettersFromName("Al B")).toBe("ALXBX");
  });
  it("falls back to the same name's own letters when there's no last name", () => {
    expect(lettersFromName("Cher")).toBe("CHERX");
    expect(lettersFromName("A")).toBe("AXXXX");
  });
  it("is deterministic — the same name always gives the same letters", () => {
    expect(lettersFromName("Priya Desai")).toBe(lettersFromName("Priya Desai"));
  });
});

describe("generateMentorCouponCode", () => {
  const txWith = (existingCodes: Set<string>) => ({
    coupon: { findUnique: async ({ where }: { where: { code: string } }) => (existingCodes.has(where.code) ? { id: "x" } : null) },
  });

  it("is 8 characters: 5 letters from the name, 3 digits", async () => {
    const code = await generateMentorCouponCode(txWith(new Set()) as never, "Rohit Kulkarni");
    expect(code).toHaveLength(8);
    expect(code.slice(0, 5)).toBe("ROHKU");
    expect(code.slice(5)).toMatch(/^\d{3}$/);
  });

  it("retries on a collision instead of returning a taken code", async () => {
    let calls = 0;
    const tx = { coupon: { findUnique: async () => (calls++ === 0 ? { id: "taken" } : null) } };
    const code = await generateMentorCouponCode(tx as never, "Ananya Nair");
    expect(code).toHaveLength(8);
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it("throws rather than silently returning a duplicate after exhausting attempts", async () => {
    const tx = { coupon: { findUnique: async () => ({ id: "always-taken" }) } };
    await expect(generateMentorCouponCode(tx as never, "Ananya Nair")).rejects.toThrow();
  });
});
