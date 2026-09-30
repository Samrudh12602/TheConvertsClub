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
        findFirst: async ({ where }: { where: never }) => rows.find((r) => match(r, where)) ?? null,
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

import { createReceiptLink, createReceiptToken, verifyReceiptToken } from "./receipt-access";

beforeEach(() => { rows.length = 0; });

describe("receipt access tokens", () => {
  it("accepts a freshly issued token", async () => {
    const t = await createReceiptToken("order1");
    expect(await verifyReceiptToken("order1", t)).toBe(true);
  });
  it("is re-usable, unlike a single-use token", async () => {
    const t = await createReceiptToken("order1");
    expect(await verifyReceiptToken("order1", t)).toBe(true);
    expect(await verifyReceiptToken("order1", t)).toBe(true);
  });
  it("never stores the raw token", async () => {
    const t = await createReceiptToken("order1");
    expect(rows.some((r) => r.token === t)).toBe(false);
  });
  it("is scoped to its order", async () => {
    const t = await createReceiptToken("order1");
    expect(await verifyReceiptToken("order2", t)).toBe(false);
  });
  it("rejects an expired token", async () => {
    const t = await createReceiptToken("order1", -1);
    expect(await verifyReceiptToken("order1", t)).toBe(false);
  });
  it("rejects an empty token", async () => {
    await createReceiptToken("order1");
    expect(await verifyReceiptToken("order1", "")).toBe(false);
  });
  it("a newer token invalidates the older one", async () => {
    const old = await createReceiptToken("order1");
    const fresh = await createReceiptToken("order1");
    expect(await verifyReceiptToken("order1", old)).toBe(false);
    expect(await verifyReceiptToken("order1", fresh)).toBe(true);
  });
  it("builds a link carrying the order id and token", async () => {
    const link = await createReceiptLink("order1");
    const u = new URL(link);
    expect(u.pathname).toBe("/api/receipts/order1");
    expect(await verifyReceiptToken("order1", u.searchParams.get("token") as string)).toBe(true);
  });
});
