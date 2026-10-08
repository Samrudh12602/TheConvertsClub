import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings-db", () => ({ getSettings: async () => ({}) }));
import { panelFrom } from "./panel";
import { PANEL_PANELIST_PAISE } from "./payroll";
import { panelUpgradeStatus, PANEL_UPGRADE_MAX } from "./panel-upgrade";

const slot = (id: string, mentorId: string, tier: "SENIOR" | "JUNIOR", isAdminMentor = false) => ({ id, startsAt: new Date(0), mentorId, mentor: { id: mentorId, tier, isAdminMentor } });

describe("panel staffing", () => {
  it("needs the owner plus two other mentors free at the same hour", () => {
    expect(panelFrom([slot("a", "admin", "SENIOR", true), slot("j", "m1", "JUNIOR")], new Map())).toBeNull();
    expect(panelFrom([slot("j", "m1", "JUNIOR"), slot("k", "m2", "JUNIOR")], new Map())).toBeNull();
    const ok = panelFrom([slot("a", "admin", "SENIOR", true), slot("j", "m1", "JUNIOR"), slot("k", "m2", "SENIOR")], new Map());
    expect(ok?.lead.mentorId).toBe("admin");
    expect(ok?.panel.map((p) => p.mentorId).sort()).toEqual(["m1", "m2"]);
  });
  it("never seats the same mentor twice", () => {
    const r = panelFrom([slot("a", "admin", "SENIOR", true), slot("j1", "m1", "JUNIOR"), slot("j2", "m1", "JUNIOR"), slot("k", "m2", "JUNIOR")], new Map());
    expect(new Set(r!.panel.map((p) => p.mentorId)).size).toBe(2);
  });
  it("prefers the less busy mentors", () => {
    const r = panelFrom([slot("a", "admin", "SENIOR", true), slot("j1", "busy", "JUNIOR"), slot("j2", "free1", "JUNIOR"), slot("j3", "free2", "JUNIOR")], new Map([["busy", 5]]));
    expect(r!.panel.map((p) => p.mentorId).sort()).toEqual(["free1", "free2"]);
  });
  it("splits Rs 999 as 399 for the owner and 300 for each of the two other panelists", () => {
    expect(PANEL_PANELIST_PAISE * 2 + 39_900).toBe(99_900);
  });
});

describe("Panel PI upgrade eligibility", () => {
  const client = (o: { plus: number; used: number; pi: number }) => ({
    enrollment: { count: async () => o.plus },
    order: { count: async () => o.used },
    creditLedger: { groupBy: async () => (o.pi ? [{ kind: "PI", _sum: { delta: o.pi, reservedDelta: 0 } }] : []) },
  }) as never;
  it("is only for Call Convert Plus holders", async () => {
    const s = await panelUpgradeStatus(client({ plus: 0, used: 0, pi: 3 }), "u");
    expect(s.eligible).toBe(false);
    expect(s.reason).toMatch(/Call Convert Plus/);
  });
  it("allows up to two, then stops", async () => {
    expect((await panelUpgradeStatus(client({ plus: 1, used: 1, pi: 3 }), "u")).left).toBe(PANEL_UPGRADE_MAX - 1);
    const s = await panelUpgradeStatus(client({ plus: 1, used: 2, pi: 3 }), "u");
    expect(s.eligible).toBe(false);
    expect(s.reason).toMatch(/limit/);
  });
  it("needs an unused PI to swap", async () => {
    const s = await panelUpgradeStatus(client({ plus: 1, used: 0, pi: 0 }), "u");
    expect(s.eligible).toBe(false);
    expect(s.reason).toMatch(/unused mock PI/);
  });
  it("is eligible with a Plus plan, an unused PI and upgrades left", async () => {
    expect((await panelUpgradeStatus(client({ plus: 1, used: 0, pi: 4 }), "u")).eligible).toBe(true);
  });
});
