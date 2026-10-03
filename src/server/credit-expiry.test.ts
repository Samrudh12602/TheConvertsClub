import { vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { describe, expect, it } from "vitest";
import { expiringAmount } from "./credit-expiry";

describe("expiringAmount", () => {
  it("expires only the old stock when something was granted recently", () => {
    expect(expiringAmount(8, 3)).toBe(5); // 5 old + 3 new, nothing used
  });
  it("assumes oldest credits are spent first", () => {
    expect(expiringAmount(4, 3)).toBe(1); // had 8, used 4 of the oldest
  });
  it("expires nothing if all that's left was granted recently", () => {
    expect(expiringAmount(3, 3)).toBe(0);
    expect(expiringAmount(2, 3)).toBe(0);
  });
  it("expires everything spendable when nothing was granted recently", () => {
    expect(expiringAmount(5, 0)).toBe(5);
  });
  it("never goes negative on a negative recent total", () => {
    expect(expiringAmount(5, -2)).toBe(5);
    expect(expiringAmount(0, 0)).toBe(0);
  });
});
