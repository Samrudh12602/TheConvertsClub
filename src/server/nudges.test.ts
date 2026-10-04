import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { unspentCredits } from "./nudges";

describe("unspentCredits", () => {
  it("lists only kinds with something left", () => {
    expect(unspentCredits([{ kind: "PI", delta: 4 }, { kind: "GD", delta: 0 }, { kind: "WAT", delta: -1 }])).toEqual([{ kind: "PI", quantity: 4 }]);
  });
  it("adds up multiple rows of the same kind", () => {
    expect(unspentCredits([{ kind: "PI", delta: 4 }, { kind: "PI", delta: -3 }])).toEqual([{ kind: "PI", quantity: 1 }]);
  });
  it("is empty when everything is spent", () => {
    expect(unspentCredits([{ kind: "PI", delta: 2 }, { kind: "PI", delta: -2 }])).toEqual([]);
  });
});
