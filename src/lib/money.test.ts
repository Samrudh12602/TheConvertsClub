import { describe, expect, it } from "vitest";
import { formatPaise, rupeesToPaise } from "./money";

describe("formatPaise", () => {
  it("groups in the Indian system", () => {
    expect(formatPaise(219900)).toBe("₹2,199");
    expect(formatPaise(41230000)).toBe("₹4,12,300");
    expect(formatPaise(9900)).toBe("₹99");
  });
  it("shows paise only when present", () => {
    expect(formatPaise(59950)).toBe("₹599.50");
  });
  it("uses a real minus sign", () => {
    expect(formatPaise(-80000)).toBe("−₹800");
  });
  it("rejects fractional paise", () => {
    expect(() => formatPaise(10.5)).toThrow(RangeError);
  });
  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(2199)).toBe(219900);
    expect(rupeesToPaise(19.99)).toBe(1999);
  });
});
