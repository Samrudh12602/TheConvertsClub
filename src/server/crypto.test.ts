import { beforeAll, describe, expect, it } from "vitest";
import { decryptJson, encryptJson, safeEqual } from "./crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("payout field encryption", () => {
  it("round-trips", () => {
    const enc = encryptJson({ upi: "rohit@okhdfc" });
    expect(enc).not.toContain("okhdfc");
    expect(decryptJson<{ upi: string }>(enc).upi).toBe("rohit@okhdfc");
  });
  it("uses a fresh IV each time", () => expect(encryptJson("a")).not.toBe(encryptJson("a")));
  it("rejects tampered ciphertext", () => {
    const parts = encryptJson("secret").split(":");
    parts[3] = Buffer.from("tampered!").toString("base64");
    expect(() => decryptJson(parts.join(":"))).toThrow();
  });
  it("compares in constant time", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
  });
});
