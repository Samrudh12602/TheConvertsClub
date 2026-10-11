import { describe, expect, it } from "vitest";
import { ATTACH_MAX_FILES, LOGO_CID, attachmentProblem, composeHtml, composeText, framedEmailHtml, parseRecipients, quoteForReply, replySubject, senderFor, SENDERS, signatureText, threadHeaders } from "./mailbox";

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
    expect(h.match(/<p style="margin:0 0 18px">/g)).toHaveLength(2);
  });
});

describe("signature and logo", () => {
  const sup = senderFor("support")!;
  const sam = senderFor("samrudh")!;
  const count = (h: string) => h.match(new RegExp(`cid:${LOGO_CID}`, "g"))?.length ?? 0;
  it("has the logo and the name large at the top, before the message", () => {
    for (const sender of SENDERS) {
      const h = composeHtml("Hello there", sender);
      expect(h.indexOf(`cid:${LOGO_CID}`)).toBeLessThan(h.indexOf("Hello there"));
      expect(h.indexOf("font-size:26px")).toBeLessThan(h.indexOf("Hello there"));
    }
  });
  it("also has the logo at the bottom, after the signature details", () => {
    for (const sender of SENDERS) {
      const h = composeHtml("Hello there", sender);
      expect(count(h)).toBe(2);
      const last = h.lastIndexOf(`cid:${LOGO_CID}`);
      expect(last).toBeGreaterThan(h.indexOf(sender.title));
      expect(h.indexOf("theconvertsclub.in</a></p></div></div>")).toBeGreaterThan(last);
    }
  });
  it("signs support as the team, in the brand colour, with the support email and no phone number", () => {
    const h = composeHtml("Hi", sup);
    expect(h).toContain("Support Team");
    expect(h).toContain("color:#7A1F2B\">The Converts Club</p>");
    expect(h).toContain('href="mailto:support@theconvertsclub.in"');
    expect(h).not.toMatch(/Tel\.|tel:|7798889355|77988 89355/);
  });
  it("never puts the founder's phone number in support or admin mail, html or text", () => {
    for (const key of ["support", "admin"]) {
      const sender = senderFor(key)!;
      expect(composeHtml("Hi", sender)).not.toMatch(/Tel\.|tel:|77988/);
      expect(signatureText(sender)).not.toMatch(/Tel\.|77988/);
    }
  });
  it("signs samrudh by name as the founder, and only his mail carries the phone number", () => {
    const h = composeHtml("Hi", sam);
    expect(h).toContain("Samrudh Dhaimodkar");
    expect(h).toContain("Founder");
    expect(h).toContain('href="tel:+917798889355"');
    expect(h).toContain('href="mailto:samrudh@theconvertsclub.in"');
  });
  it("still has the header, logo and website when the signature is switched off", () => {
    const h = composeHtml("Hi", null);
    expect(count(h)).toBe(2);
    expect(h).toContain("https://theconvertsclub.in");
    expect(h).not.toContain("Tel.:");
  });
  it("falls back to a linked picture when it cannot be embedded", () => {
    expect(composeHtml("Hi", sup, "https://theconvertsclub.in/brand/mark.png")).toContain('src="https://theconvertsclub.in/brand/mark.png"');
  });
  it("has a plain-text signature too", () => {
    expect(signatureText(sam)).toBe("Samrudh Dhaimodkar\nFounder, The Converts Club\nTel.: +91 77988 89355\nEmail: samrudh@theconvertsclub.in\ntheconvertsclub.in");
    expect(signatureText(sup)).toBe("Support Team\nThe Converts Club\nEmail: support@theconvertsclub.in\ntheconvertsclub.in");
  });
});

describe("message formatting", () => {
  const h = (b: string) => composeHtml(b, null);
  it("makes a heading, bullets, a highlighted box and bold text", () => {
    expect(h("# Big news")).toContain("font-size:30px");
    expect(h("## Smaller")).toContain("font-size:20px");
    expect(h("- one\n- two")).toContain("<ul");
    expect(h("> note")).toContain("background:#F3F1EE");
    expect(h("this is **bold**")).toContain("<b>bold</b>");
  });
  it("makes a button from [button: Label | https://link], and only for web links", () => {
    const x = h("[button: Start your mock | https://theconvertsclub.in/mocks]");
    expect(x).toContain('href="https://theconvertsclub.in/mocks"');
    expect(x).toContain("border-radius:999px");
    expect(x).toContain(">Start your mock</a>");
    expect(h("[button: Bad | javascript:alert(1)]")).not.toContain("href=\"javascript");
    expect(h("[button: Bad | javascript:alert(1)]")).not.toContain("border-radius:999px");
  });
  it("makes [text](https://link) a link, and bare links links", () => {
    expect(h("see [the mocks](https://theconvertsclub.in/mocks) or https://theconvertsclub.in/faq")).toMatch(/>the mocks<\/a>.*href="https:\/\/theconvertsclub.in\/faq"/);
  });
  it("never lets typed HTML through, even inside headings, buttons and links", () => {
    const x = h("# <img src=x onerror=alert(1)>\n\n[button: <b>x</b> | https://a.com/\"onmouseover=\"alert(1)]\n\n[<script>](https://a.com)");
    expect(x).not.toMatch(/<img src=x/);
    expect(x).not.toContain("<script>");
    expect(x).not.toMatch(/onmouseover="alert/);
  });
  it("gives a readable plain-text version", () => {
    expect(composeText("# Hello\n\n**Note** the [guide](https://x.com/g)\n\n[button: Go | https://x.com/go]\n\n> quoted", null)).toBe("Hello\n\nNote the guide (https://x.com/g)\n\nGo: https://x.com/go\n\nquoted");
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
