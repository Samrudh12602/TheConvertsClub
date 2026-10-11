import { describe, expect, it } from "vitest";
import { ATTACH_MAX_FILES, LOGO_CID, attachmentProblem, composeHtml, composeText, framedEmailHtml, parseRecipients, quoteForReply, replySubject, senderFor, SENDERS, threadHeaders } from "./mailbox";

describe("senders", () => {
  it("offers exactly support, admin and samrudh on the domain", () => {
    expect(SENDERS.map((s) => s.address)).toEqual(["support@theconvertsclub.in", "admin@theconvertsclub.in", "samrudh@theconvertsclub.in"]);
  });
  it("rejects an address that is not one of ours", () => {
    expect(senderFor("support")?.address).toBe("support@theconvertsclub.in");
    expect(senderFor("someone@gmail.com")).toBeNull();
  });
});

describe("parseRecipients", () => {
  it("splits on commas, semicolons, spaces and new lines, lowercases and removes duplicates", () => {
    expect(parseRecipients("A@x.com, b@y.com;\nc@z.in  a@x.com").valid).toEqual(["a@x.com", "b@y.com", "c@z.in"]);
  });
  it("accepts the Name <address> form", () => {
    expect(parseRecipients("Ankit Sinha <ankit@x.com>").valid).toEqual(["ankit@x.com"]);
  });
  it("reports entries that look like addresses but are not valid", () => {
    const r = parseRecipients("good@x.com, bad@, nope@x");
    expect(r.valid).toEqual(["good@x.com"]);
    expect(r.invalid).toEqual(["bad@", "nope@x"]);
  });
  it("is empty for blank input", () => expect(parseRecipients("  \n ")).toEqual({ valid: [], invalid: [] }));
});

describe("composing", () => {
  it("adds the signature below a dashed line in the text part", () => {
    expect(composeText("Hello", "Samrudh")).toBe("Hello\n\n--\nSamrudh");
    expect(composeText("Hello", null)).toBe("Hello");
  });
  it("escapes HTML in the body so a typed < never becomes markup", () => {
    const h = composeHtml("1 < 2 & <script>alert(1)</script>", null);
    expect(h).not.toContain("<script>");
    expect(h).toContain("&lt;script&gt;");
  });
  it("makes links clickable and keeps paragraph and line breaks", () => {
    const h = composeHtml("See https://theconvertsclub.in/mocks.\nThanks\n\nSecond paragraph", null);
    expect(h).toContain('<a href="https://theconvertsclub.in/mocks"');
    expect(h).toContain("<br>");
    expect(h.match(/<p /g)).toHaveLength(2);
  });
});

describe("logo", () => {
  const imgAt = (h: string) => h.indexOf(`cid:${LOGO_CID}`);
  it("sits at the top, above the message, for support and admin mail", () => {
    const h = composeHtml("Hello there", "Support team", "brand");
    expect(imgAt(h)).toBeGreaterThan(-1);
    expect(imgAt(h)).toBeLessThan(h.indexOf("Hello there"));
  });
  it("sits below the message, with the signature, for Samrudh's personal mail", () => {
    const h = composeHtml("Hello there", "Samrudh Dhaimodkar", "personal");
    expect(imgAt(h)).toBeGreaterThan(h.indexOf("Hello there"));
    expect(imgAt(h)).toBeLessThan(h.indexOf("Samrudh Dhaimodkar"));
  });
  it("is there even when the signature is switched off", () => {
    expect(composeHtml("Hi", null, "brand")).toContain(`cid:${LOGO_CID}`);
    expect(composeHtml("Hi", null, "personal")).toContain(`cid:${LOGO_CID}`);
  });
  it("falls back to a linked picture when it cannot be embedded", () => {
    expect(composeHtml("Hi", null, "brand", "https://theconvertsclub.in/brand/mark.png")).toContain('src="https://theconvertsclub.in/brand/mark.png"');
  });
  it("uses the personal style only for samrudh", () => {
    expect(SENDERS.map((x) => `${x.key}:${x.style}`)).toEqual(["support:brand", "admin:brand", "samrudh:personal"]);
  });
});

describe("attachmentProblem", () => {
  const mb = 1024 * 1024;
  it("accepts a few ordinary files", () => expect(attachmentProblem([{ name: "offer.pdf", size: 2 * mb }, { name: "a.png", size: 100 }], false)).toBeNull());
  it("refuses more than the allowed number of files", () => {
    expect(attachmentProblem(Array.from({ length: ATTACH_MAX_FILES + 1 }, (_, i) => ({ name: `f${i}.pdf`, size: 10 })), false)).toMatch(/up to/i);
  });
  it("refuses a single file over 10 MB, and a total over 15 MB", () => {
    expect(attachmentProblem([{ name: "big.pdf", size: 11 * mb }], false)).toMatch(/over 10 MB/);
    expect(attachmentProblem([{ name: "a.pdf", size: 9 * mb }, { name: "b.pdf", size: 9 * mb }], false)).toMatch(/15 MB/);
  });
  it("keeps attachments small when the message goes to a whole group", () => {
    expect(attachmentProblem([{ name: "a.pdf", size: 4 * mb }], true)).toMatch(/whole group/);
    expect(attachmentProblem([{ name: "a.pdf", size: 2 * mb }], true)).toBeNull();
  });
  it("blocks programs and scripts", () => {
    expect(attachmentProblem([{ name: "setup.exe", size: 10 }], false)).toMatch(/can't be sent/);
    expect(attachmentProblem([{ name: "run.JS", size: 10 }], false)).toMatch(/can't be sent/);
  });
});

describe("replies", () => {
  it("adds Re: once", () => {
    expect(replySubject("Hello")).toBe("Re: Hello");
    expect(replySubject("Re: Hello")).toBe("Re: Hello");
  });
  it("quotes the original line by line", () => {
    const q = quoteForReply("A <a@x.com>", new Date("2026-10-11T04:00:00Z"), "line1\nline2");
    expect(q).toContain("A <a@x.com> wrote:");
    expect(q).toContain("> line1\n> line2");
  });
  it("threads under the original and keeps earlier references", () => {
    expect(threadHeaders("<m3@x>", "<m1@x> <m2@x>")).toEqual({ inReplyTo: "<m3@x>", references: ["<m1@x>", "<m2@x>", "<m3@x>"] });
    expect(threadHeaders(null, null)).toEqual({});
  });
});

describe("framedEmailHtml", () => {
  it("blocks every remote request by default and never allows scripts", () => {
    const f = framedEmailHtml('<img src="https://tracker.example/p.gif">', false);
    expect(f).toContain("default-src 'none'");
    expect(f).toContain("img-src data: cid:;");
    expect(f).not.toContain("script-src");
  });
  it("uses a whole-document email as the document itself, with the policy first in its head", () => {
    const f = framedEmailHtml('<!DOCTYPE html><html lang="en"><head><title>x</title></head><body style="background:#000">Hi</body></html>', false);
    expect(f.match(/<body/g)).toHaveLength(1);
    expect(f.indexOf("Content-Security-Policy")).toBeLessThan(f.indexOf("<title>"));
    expect(f).toContain('<body style="background:#000">');
  });
  it("removes a meta refresh so the frame cannot be sent elsewhere", () => {
    expect(framedEmailHtml('<html><head><meta http-equiv="refresh" content="0;url=https://evil.example"></head><body>x</body></html>', true)).not.toMatch(/http-equiv="refresh"/i);
  });
  it("allows remote images only when asked", () => {
    expect(framedEmailHtml("x", true)).toContain("img-src data: cid: https: http:");
  });
});
