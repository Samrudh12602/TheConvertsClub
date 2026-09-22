import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appUrl } from "./env";

const KEYS = ["NEXT_PUBLIC_APP_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("appUrl", () => {
  it("prefers an explicit NEXT_PUBLIC_APP_URL, with no trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://convertsclub.in/";
    expect(appUrl()).toBe("https://convertsclub.in");
  });
  it("falls back to Vercel's production URL when no explicit URL is set", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "the-converts-club.vercel.app";
    expect(appUrl()).toBe("https://the-converts-club.vercel.app");
  });
  it("falls back to the current deployment URL if there's no production URL", () => {
    process.env.VERCEL_URL = "the-converts-club-abc123.vercel.app";
    expect(appUrl()).toBe("https://the-converts-club-abc123.vercel.app");
  });
  it("falls back to localhost with nothing set (local dev)", () => {
    expect(appUrl()).toBe("http://localhost:3000");
  });
  it("never hardcodes a domain that might not actually be live", () => {
    // Regression: NEXT_PUBLIC_APP_URL was once left set to a domain that hadn't been purchased,
    // silently sending every email link to a hostname that didn't resolve.
    expect(appUrl()).not.toContain("convertsclub.in");
  });
});
