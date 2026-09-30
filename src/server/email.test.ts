import { beforeEach, describe, expect, it, vi } from "vitest";

const emailLog: { data: Record<string, unknown> }[] = [];
vi.mock("@/lib/db", () => ({
  db: {
    emailTemplate: { findUnique: async () => null },
    emailLog: { create: async (a: { data: Record<string, unknown> }) => { emailLog.push(a); } },
  },
}));

interface SentMail { attachments?: { filename: string; content: Buffer; contentType: string }[] }
const sendMail = vi.fn<(mail: SentMail) => Promise<{ messageId: string }>>(async () => ({ messageId: "msg-1" }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));

import { emailProvider, sendEmail } from "./email";

describe("emailProvider", () => {
  it("is null with nothing configured", () => expect(emailProvider({})).toBeNull());
  it("uses Resend when only its key is set", () => expect(emailProvider({ RESEND_API_KEY: "re_x" })).toBe("resend"));
  it("uses Gmail when both the address and app password are set", () => expect(emailProvider({ GMAIL_USER: "a@gmail.com", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" })).toBe("gmail"));
  it("does not use Gmail with an address but no app password", () => expect(emailProvider({ GMAIL_USER: "a@gmail.com" })).toBeNull());
  it("prefers Gmail when both providers are set", () => expect(emailProvider({ GMAIL_USER: "a@gmail.com", GMAIL_APP_PASSWORD: "x", RESEND_API_KEY: "re_x" })).toBe("gmail"));
});

describe("sendEmail attachments (Gmail)", () => {
  beforeEach(() => {
    sendMail.mockClear();
    emailLog.length = 0;
    process.env.GMAIL_USER = "owner@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "app-password";
    delete process.env.RESEND_API_KEY;
  });

  it("threads a PDF attachment through to the mail transport", async () => {
    const pdf = Buffer.from("%PDF-fake");
    const r = await sendEmail({ template: "welcome", to: "student@example.com", attachments: [{ filename: "receipt-x.pdf", content: pdf, contentType: "application/pdf" }] });
    expect(r.status).toBe("SENT");
    expect(sendMail).toHaveBeenCalledTimes(1);
    const call = sendMail.mock.calls[0][0];
    expect(call.attachments).toEqual([{ filename: "receipt-x.pdf", content: pdf, contentType: "application/pdf" }]);
  });

  it("sends with no attachments field when none are given", async () => {
    await sendEmail({ template: "welcome", to: "student@example.com" });
    expect(sendMail.mock.calls[0][0].attachments).toBeUndefined();
  });
});
