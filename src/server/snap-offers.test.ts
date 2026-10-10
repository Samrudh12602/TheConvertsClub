import { describe, expect, it } from "vitest";
import { offerSlugs, upgradeStatus, type SnapStanding } from "./snap-offers";

const st = (p: Partial<SnapStanding> = {}): SnapStanding => ({ test: false, five: false, ten: false, upgraded: false, ...p });

describe("which SNAP offers a student sees", () => {
  it("shows all three plans to someone who hasn't bought anything", () => {
    expect(offerSlugs(st())).toEqual(["snap-test-mock", "snap-mocks-5", "snap-mocks-10"]);
  });
  it("shows the two bigger plans to someone who only took the test mock", () => {
    expect(offerSlugs(st({ test: true }))).toEqual(["snap-mocks-5", "snap-mocks-10"]);
  });
  it("offers the +5 upgrade to a 5-pack buyer, whether or not they also took the test mock", () => {
    expect(offerSlugs(st({ five: true }))).toEqual(["snap-upgrade-10"]);
    expect(offerSlugs(st({ five: true, test: true }))).toEqual(["snap-upgrade-10"]);
  });
  it("offers nothing more once they have 10", () => {
    expect(offerSlugs(st({ ten: true }))).toEqual([]);
    expect(offerSlugs(st({ five: true, upgraded: true }))).toEqual([]);
  });
});

describe("the +5 upgrade", () => {
  it("is only for 5-pack buyers who haven't gone to 10", () => {
    expect(upgradeStatus(st({ five: true })).eligible).toBe(true);
    expect(upgradeStatus(st({ test: true })).eligible).toBe(false);
    expect(upgradeStatus(st()).eligible).toBe(false);
    expect(upgradeStatus(st({ five: true, upgraded: true })).eligible).toBe(false);
    expect(upgradeStatus(st({ ten: true })).eligible).toBe(false);
  });
});
