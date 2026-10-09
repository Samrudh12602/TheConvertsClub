import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { mentorFilter } from "./booking";
import { isAdminOnly, slotKindFilter } from "./scheduling";
import { referralPrice, type Referral } from "./referral";
import type { CatalogProduct } from "@/lib/pricing";

describe("which mentors can serve which session type", () => {
  it("restricts strategy calls and PIs with Samrudh to the owner's mentor profile", () => {
    expect(mentorFilter("STRATEGY_CALL", false)).toMatchObject({ isAdminMentor: true });
    expect(mentorFilter("PI_DIRECT", false)).toMatchObject({ isAdminMentor: true });
  });
  it("leaves ordinary sessions open to every active mentor", () => {
    for (const t of ["MOCK_PI", "GUIDANCE", "GD_BATCH"] as const) expect(mentorFilter(t, false)).not.toHaveProperty("isAdminMentor");
  });
  it("narrows to one mentor when rebooking, except for the owner's own types", () => {
    expect(mentorFilter("MOCK_PI", false, "m1")).toMatchObject({ id: "m1" });
    expect(mentorFilter("MOCK_PI", false)).not.toHaveProperty("id");
    expect(mentorFilter("STRATEGY_CALL", false, "m1")).not.toHaveProperty("id");
    expect(mentorFilter("TRIAL_PI", false, "m1")).toMatchObject({ isAdminMentor: true });
  });
  it("keeps demo and real apart", () => {
    expect(mentorFilter("MOCK_PI", false)).toMatchObject({ user: { isDemo: false } });
    expect(mentorFilter("MOCK_PI", true)).toMatchObject({ user: { isDemo: true } });
  });
  it("names exactly the owner-only types", () => {
    expect(["MOCK_PI", "STRATEGY_CALL", "GUIDANCE", "GD_BATCH", "PI_DIRECT"].filter(isAdminOnly)).toEqual(["STRATEGY_CALL", "PI_DIRECT"]);
  });
});

describe("mentor referral codes and sessions with Samrudh", () => {
  const ref: Referral = { code: "ROHKU272", mentorFirst: "Rohit", coupon: { type: "PERCENT", value: 10, expiresAt: null, maxUses: null, usedCount: 0, active: true, mentorId: "m1" } };
  const p = (over: Partial<CatalogProduct>) => ({ slug: "x", name: "X", kind: "SINGLE", pricePaise: 59900, mrpPaise: null, mentorPricePaise: null, enrolledOnly: false, withAdmin: false, credits: [], summary: "", includes: [], ...over }) as CatalogProduct;
  it("discounts a flagship program to its exact mentor price", () => expect(referralPrice(p({ pricePaise: 399900, mentorPricePaise: 299900 }), ref)).toBe(299900));
  it("never discounts an ordinary product", () => expect(referralPrice(p({}), ref)).toBeNull());
  it("never discounts a session with Samrudh", () => expect(referralPrice(p({ withAdmin: true }), ref)).toBeNull());
});

describe("free time versus the special paid hours", async () => {
  const { isDirectType } = await import("./scheduling");
  it("sends only the two paid services to the set-aside hours", () => {
    expect(["MOCK_PI", "STRATEGY_CALL", "GUIDANCE", "GD_BATCH", "PI_DIRECT", "STRATEGY_DIRECT"].filter(isDirectType)).toEqual(["PI_DIRECT", "STRATEGY_DIRECT"]);
  });
  it("keeps all three owner-only types owner-only, including the new strategy call", () => {
    expect(["STRATEGY_CALL", "PI_DIRECT", "STRATEGY_DIRECT"].every(isAdminOnly)).toBe(true);
    expect(mentorFilter("STRATEGY_DIRECT", false)).toMatchObject({ isAdminMentor: true });
  });
});

describe("which kind of owner hour serves a session", () => {
  it("lets a Panel PI use any of the owner's hours, free or special", () => {
    expect(slotKindFilter("PANEL_PI")).toEqual({});
  });
  it("keeps the paid PI and strategy calls on special hours, and everything else on free time", () => {
    expect(slotKindFilter("PI_DIRECT")).toEqual({ direct: true });
    expect(slotKindFilter("STRATEGY_DIRECT")).toEqual({ direct: true });
    expect(slotKindFilter("MOCK_PI")).toEqual({ direct: false });
    expect(slotKindFilter("STRATEGY_CALL")).toEqual({ direct: false });
  });
});
