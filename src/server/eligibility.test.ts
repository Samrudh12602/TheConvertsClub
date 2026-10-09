import { describe, expect, it } from "vitest";
import { ADDITIONAL_PI_PLANS, canBuyAdditionalPi, isSinglePiStudent } from "./eligibility";

const fake = (slugs: string[], panelCredits = 0) => ({
  enrollment: {
    count: async (a: { where: { product: { slug: { in: string[] } } } }) => slugs.filter((s) => a.where.product.slug.in.includes(s)).length,
    findMany: async () => slugs.map((slug) => ({ product: { slug } })),
  },
  creditLedger: { count: async () => panelCredits },
}) as never;

describe("Additional PI eligibility", () => {
  it("is open to Mock PI, Call Convert and Call Convert Plus students", async () => {
    for (const slug of ADDITIONAL_PI_PLANS) expect(await canBuyAdditionalPi(fake([slug]), "u")).toBe(true);
  });
  it("is closed to everyone else: WAT, SOP, GD, guidance, trials, direct sessions", async () => {
    for (const slug of ["wat", "sop-basic", "sop-detailed", "mock-gd", "quick-guidance", "trial-mock-pi", "trial-guidance", "pi-with-samrudh", "strategy-with-samrudh", "panel-pi"]) {
      expect(await canBuyAdditionalPi(fake([slug]), "u"), slug).toBe(false);
    }
    expect(await canBuyAdditionalPi(fake([]), "u")).toBe(false);
  });
});

describe("who the Panel PI is promoted to", () => {
  it("promotes to students whose only purchase is the single Mock PI", async () => {
    expect(await isSinglePiStudent(fake(["mock-pi"]), "u")).toBe(true);
  });
  it("does not promote to plan students, mixed buyers, non-buyers, or anyone who already has a Panel PI", async () => {
    expect(await isSinglePiStudent(fake(["call-convert"]), "u")).toBe(false);
    expect(await isSinglePiStudent(fake(["mock-pi", "wat"]), "u")).toBe(false);
    expect(await isSinglePiStudent(fake([]), "u")).toBe(false);
    expect(await isSinglePiStudent(fake(["mock-pi"], 1), "u")).toBe(false);
  });
});
