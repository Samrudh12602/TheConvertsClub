import { describe, expect, it } from "vitest";
import { isFeaturable, testimonialWho } from "./testimonial";

describe("testimonialWho", () => {
  it("uses first name and college only", () => expect(testimonialWho("Rohan Kulkarni", "IIM L")).toBe("Rohan, IIM L"));
  it("drops the demo tag and works without a college", () => expect(testimonialWho("Ananya Nair (demo)", null)).toBe("Ananya"));
  it("never returns nothing", () => expect(testimonialWho(null, "  ")).toBe("A student"));
});

describe("isFeaturable", () => {
  const ok = { rating: 5, comment: "The institute-final mock was exactly like the real panel.", featureConsent: true };
  it("accepts a happy, consenting, substantive comment", () => expect(isFeaturable(ok)).toBe(true));
  it("needs consent", () => expect(isFeaturable({ ...ok, featureConsent: false })).toBe(false));
  it("needs a happy rating", () => expect(isFeaturable({ ...ok, rating: 3 })).toBe(false));
  it("needs a real comment", () => {
    expect(isFeaturable({ ...ok, comment: "great" })).toBe(false);
    expect(isFeaturable({ ...ok, comment: null })).toBe(false);
  });
});
