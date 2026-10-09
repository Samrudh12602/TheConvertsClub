import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings-db", () => ({ getSettings: async () => ({}) }));
import { panelSummary } from "./panel";
import { PANEL_PANELIST_PAISE } from "./payroll";
import { panelUpgradeStatus, PANEL_UPGRADE_MAX } from "./panel-upgrade";

describe("panel progress", () => {
  it("is ready only when both panelists have accepted", () => {
    expect(panelSummary([]).ready).toBe(false);
    expect(panelSummary([{ status: "INVITED" }, { status: "INVITED" }])).toMatchObject({ accepted: 0, invited: 2, ready: false });
    expect(panelSummary([{ status: "ACCEPTED" }, { status: "INVITED" }])).toMatchObject({ accepted: 1, invited: 1, ready: false });
    expect(panelSummary([{ status: "ACCEPTED" }, { status: "ACCEPTED" }]).ready).toBe(true);
  });
  it("ignores declined seats when counting who is on the panel", () => {
    expect(panelSummary([{ status: "ACCEPTED" }, { status: "DECLINED" }, { status: "INVITED" }])).toMatchObject({ accepted: 1, invited: 1, declined: 1, picked: 2, ready: false });
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
  it("is only for Call Convert and Call Convert Plus holders", async () => {
    const s = await panelUpgradeStatus(client({ plus: 0, used: 0, pi: 3 }), "u");
    expect(s.eligible).toBe(false);
    expect(s.reason).toMatch(/Call Convert and Call Convert Plus/);
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
  it("is eligible on either plan with an unused PI and upgrades left", async () => {
    expect((await panelUpgradeStatus(client({ plus: 1, used: 0, pi: 4 }), "u")).eligible).toBe(true);
  });
});
