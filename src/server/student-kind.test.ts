import { describe, expect, it, vi } from "vitest";
import { isGuidanceSlug } from "@/lib/guidance";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings-db", () => ({ getSettings: async () => ({ gdpiComingSoon: true }) }));

import { isSellable } from "./site-mode";
import { hasGuidance, studentStage } from "./student-kind";

interface Data { enrollments: string[]; credits: string[]; sessions: string[]; attempts?: number; reviews?: number }

type Slug = { startsWith?: string; not?: { startsWith?: string }; notIn?: string[] };
type Kind = { in?: string[]; notIn?: string[] };

/** A tiny stand-in for the database that understands just the filters the student stage logic uses. */
function fake(d: Data) {
  const slugOk = (slug: string, f: Slug) => (f.startsWith === undefined || slug.startsWith(f.startsWith)) && (!f.not?.startsWith || !slug.startsWith(f.not.startsWith)) && (!f.notIn || !f.notIn.includes(slug));
  const kindOk = (k: string, f: Kind) => (!f.in || f.in.includes(k)) && (!f.notIn || !f.notIn.includes(k));
  return {
    enrollment: { count: async ({ where }: { where: { product: { slug: Slug } } }) => d.enrollments.filter((s) => slugOk(s, where.product.slug)).length },
    creditLedger: { count: async ({ where }: { where: { kind: Kind } }) => d.credits.filter((k) => kindOk(k, where.kind)).length },
    session: { count: async ({ where }: { where: { type: Kind } }) => d.sessions.filter((t) => kindOk(t, where.type)).length },
    review: { count: async () => d.reviews ?? 0 },
    mockAttempt: { count: async () => d.attempts ?? 0 },
  } as never;
}

describe("guidance products", () => {
  it("are the trial guidance call and the strategy call, and nothing else", () => {
    expect(isGuidanceSlug("guidance-call")).toBe(true);
    expect(isGuidanceSlug("strategy-call")).toBe(true);
    for (const s of ["pi-one-to-one", "quick-guidance", "panel-pi", "snap-mocks-5", "mock-pi"]) expect(isGuidanceSlug(s)).toBe(false);
  });
  it("can be bought while interview prep is coming soon, but interview prep still cannot", async () => {
    expect(await isSellable("strategy-call")).toBe(true);
    expect(await isSellable("guidance-call")).toBe(true);
    expect(await isSellable("snap-mocks-5")).toBe(true);
    expect(await isSellable("panel-pi")).toBe(false);
    expect(await isSellable("pi-one-to-one")).toBe(false);
  });
});

describe("student stage with guidance calls", () => {
  it("a guidance buyer is still a new student, not an interview-prep student", async () => {
    const c = fake({ enrollments: ["strategy-call"], credits: ["STRATEGY_DIRECT"], sessions: [] });
    expect(await studentStage(c, "u")).toBe("new");
    expect(await hasGuidance(c, "u")).toBe(true);
  });
  it("a guidance buyer who also bought SNAP mocks is a mocks student", async () => {
    expect(await studentStage(fake({ enrollments: ["strategy-call", "snap-mocks-5"], credits: ["STRATEGY_DIRECT", "SNAP_MOCK"], sessions: [] }), "u")).toBe("mocks");
  });
  it("someone with a real interview-prep plan or session is still an interview-prep student", async () => {
    expect(await studentStage(fake({ enrollments: ["call-convert"], credits: ["PI"], sessions: [] }), "u")).toBe("gdpi");
    expect(await studentStage(fake({ enrollments: [], credits: [], sessions: ["MOCK_PI"] }), "u")).toBe("gdpi");
  });
  it("nobody who bought nothing has guidance", async () => {
    const c = fake({ enrollments: [], credits: [], sessions: [] });
    expect(await studentStage(c, "u")).toBe("new");
    expect(await hasGuidance(c, "u")).toBe(false);
  });
});
