import { describe, expect, it } from "vitest";
import { composeHtml, composeText, framedEmailHtml, parseRecipients, quoteForReply, replySubject, senderFor, SENDERS, threadHeaders } from "./mailbox";

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
  it("allows remote images only when asked", () => {
    expect(framedEmailHtml("x", true)).toContain("img-src data: cid: https: http:");
  });
});
