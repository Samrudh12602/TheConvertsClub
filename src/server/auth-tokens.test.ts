import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { identifier: string; token: string; expires: Date };
const rows: Row[] = [];

vi.mock("@/lib/db", () => {
  const match = (r: Row, w: { identifier: string; token?: string; expires?: { gt: Date } }) =>
    r.identifier === w.identifier && (w.token === undefined || r.token === w.token) && (w.expires === undefined || r.expires > w.expires.gt);
  return {
    db: {
      verificationToken: {
        create: async ({ data }: { data: Row }) => { rows.push(data); return data; },
        deleteMany: async ({ where }: { where: never }) => {
          const keep = rows.filter((r) => !match(r, where));
          const count = rows.length - keep.length;
          rows.splice(0, rows.length, ...keep);
          return { count };
        },
      },
    },
  };
});

import { consumeVerifyEmailToken, createVerifyEmailLink, createVerifyEmailToken } from "./auth-tokens";

beforeEach(() => { rows.length = 0; });

describe("verify-email tokens", () => {
  it("consumes a valid token exactly once", async () => {
    const t = await createVerifyEmailToken("A@B.co");
    expect(await consumeVerifyEmailToken("a@b.co", t)).toBe(true);
    expect(await consumeVerifyEmailToken("a@b.co", t)).toBe(false);
  });
  it("never stores the raw token", async () => {
    const t = await createVerifyEmailToken("a@b.co");
    expect(rows.some((r) => r.token === t)).toBe(false);
  });
  it("is scoped to its email", async () => {
    const t = await createVerifyEmailToken("a@b.co");
    expect(await consumeVerifyEmailToken("someone-else@b.co", t)).toBe(false);
  });
  it("rejects an expired token", async () => {
    const t = await createVerifyEmailToken("a@b.co", -1);
    expect(await consumeVerifyEmailToken("a@b.co", t)).toBe(false);
  });
  it("a newer token invalidates the older one", async () => {
    const old = await createVerifyEmailToken("a@b.co");
    const fresh = await createVerifyEmailToken("a@b.co");
    expect(await consumeVerifyEmailToken("a@b.co", old)).toBe(false);
    expect(await consumeVerifyEmailToken("a@b.co", fresh)).toBe(true);
  });
  it("rejects an empty token", async () => {
    await createVerifyEmailToken("a@b.co");
    expect(await consumeVerifyEmailToken("a@b.co", "")).toBe(false);
  });
  it("builds a link carrying token and email", async () => {
    const link = await createVerifyEmailLink("New@B.co");
    const u = new URL(link);
    expect(u.pathname).toBe("/verify-email");
    expect(u.searchParams.get("email")).toBe("new@b.co");
    expect(await consumeVerifyEmailToken("new@b.co", u.searchParams.get("token") as string)).toBe(true);
  });
});
