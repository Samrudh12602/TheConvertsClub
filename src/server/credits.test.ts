import { describe, expect, it } from "vitest";
import { foldLedger, reviewCreditKind, sessionCreditKind } from "./credits";

describe("ledger folding", () => {
  it("grant then reserve then consume leaves available reduced by one, nothing reserved", () => {
    const b = foldLedger([
      { kind: "PI", delta: 4, reservedDelta: 0 }, // grant
      { kind: "PI", delta: -1, reservedDelta: 1 }, // reserve
      { kind: "PI", delta: 0, reservedDelta: -1 }, // consume
    ]);
    expect(b.PI).toEqual({ available: 3, reserved: 0 });
  });
  it("release returns the credit", () => {
    const b = foldLedger([
      { kind: "GD", delta: 2, reservedDelta: 0 },
      { kind: "GD", delta: -1, reservedDelta: 1 },
      { kind: "GD", delta: 1, reservedDelta: -1 },
    ]);
    expect(b.GD).toEqual({ available: 2, reserved: 0 });
  });
  it("keeps kinds separate", () => {
    const b = foldLedger([
      { kind: "PI", delta: 1, reservedDelta: 0 },
      { kind: "WAT", delta: 2, reservedDelta: 0 },
    ]);
    expect(b.PI?.available).toBe(1);
    expect(b.WAT?.available).toBe(2);
  });
});

describe("credit kind mapping", () => {
  it("maps sessions and reviews to their credit", () => {
    expect(sessionCreditKind("MOCK_PI")).toBe("PI");
    expect(sessionCreditKind("GD_BATCH")).toBe("GD");
    expect(sessionCreditKind("STRATEGY_CALL")).toBe("STRATEGY");
    expect(reviewCreditKind("SOP_DETAILED")).toBe("SOP_DETAILED");
  });
});
