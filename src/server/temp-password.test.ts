import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));
import { generateTempPassword, tempPasswordExpired } from "./temp-password";

describe("generateTempPassword", () => {
  it("is three groups of four, easy to read and type", () => {
    for (let i = 0; i < 50; i++) expect(generateTempPassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/);
  });
  it("is different every time", () => {
    expect(new Set(Array.from({ length: 200 }, generateTempPassword)).size).toBe(200);
  });
});

describe("tempPasswordExpired", () => {
  const now = new Date("2026-10-10T00:00:00Z");
  it("is expired only while still temporary and past its date", () => {
    expect(tempPasswordExpired({ mustChangePassword: true, tempPasswordExpiresAt: new Date("2026-10-09T00:00:00Z") }, now)).toBe(true);
    expect(tempPasswordExpired({ mustChangePassword: true, tempPasswordExpiresAt: new Date("2026-10-11T00:00:00Z") }, now)).toBe(false);
  });
  it("never applies to a permanent password", () => {
    expect(tempPasswordExpired({ mustChangePassword: false, tempPasswordExpiresAt: new Date("2020-01-01T00:00:00Z") }, now)).toBe(false);
  });
});
