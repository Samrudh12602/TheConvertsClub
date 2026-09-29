import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: { emailTemplate: { findUnique: async () => null }, emailLog: { create: async () => undefined } } }));

import { emailProvider } from "./email";

describe("emailProvider", () => {
  it("is null with nothing configured", () => expect(emailProvider({})).toBeNull());
  it("uses Resend when only its key is set", () => expect(emailProvider({ RESEND_API_KEY: "re_x" })).toBe("resend"));
  it("uses Gmail when both the address and app password are set", () => expect(emailProvider({ GMAIL_USER: "a@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" })).toBe("gmail"));
  it("does not use Gmail with an address but no app password", () => expect(emailProvider({ GMAIL_USER: "a@gmail.com" })).toBeNull());
  it("prefers Gmail when both providers are set", () => expect(emailProvider({ GMAIL_USER: "a@gmail.com", GMAIL_APP_PASSWORD: "x", RESEND_API_KEY: "re_x" })).toBe("gmail"));
});
