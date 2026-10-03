import { beforeEach, describe, expect, it, vi } from "vitest";

const store: Record<string, { meetingUrl: string | null }> = {};
vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findUnique: async ({ where }: { where: { id: string } }) => store[where.id] ?? null,
      updateMany: async ({ where, data }: { where: { id: string; meetingUrl: null }; data: { meetingUrl: string } }) => {
        if (store[where.id] && store[where.id].meetingUrl === null) store[where.id].meetingUrl = data.meetingUrl;
        return { count: 1 };
      },
    },
  },
}));

import { ensureMeetingUrl, fallbackRoomUrl } from "./meeting";

beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

describe("ensureMeetingUrl", () => {
  it("keeps a mentor's own link untouched", async () => {
    store.s1 = { meetingUrl: "https://meet.google.com/abc" };
    expect(await ensureMeetingUrl("s1")).toBe("https://meet.google.com/abc");
  });
  it("creates a private room when there is no link, and saves it", async () => {
    store.s2 = { meetingUrl: null };
    expect(await ensureMeetingUrl("s2")).toBe(fallbackRoomUrl("s2"));
    expect(store.s2.meetingUrl).toBe(fallbackRoomUrl("s2"));
  });
  it("returns null for a session that doesn't exist", async () => {
    expect(await ensureMeetingUrl("nope")).toBeNull();
  });
  it("gives every session its own room", () => {
    expect(fallbackRoomUrl("a")).not.toBe(fallbackRoomUrl("b"));
  });
});
