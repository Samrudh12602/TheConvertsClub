import { BUSINESS } from "@/lib/business";

/**
 * The addresses the owner can send from in the Mailbox. They all belong to one Hostinger mailbox (admin@): the other two are
 * aliases, so mail sent to any of them lands in the same inbox, and the site sends through that mailbox's SMTP login.
 */
export const SENDERS = [
  { key: "support", address: `support@${BUSINESS.domain}`, name: "The Converts Club Support", signature: `The Converts Club Support\n${BUSINESS.supportEmail} · ${BUSINESS.phone}` },
  { key: "admin", address: `admin@${BUSINESS.domain}`, name: "The Converts Club", signature: `The Converts Club team\n${BUSINESS.supportEmail} · ${BUSINESS.phone}` },
  { key: "samrudh", address: `samrudh@${BUSINESS.domain}`, name: "Samrudh · The Converts Club", signature: `Samrudh Dhaimodkar\nThe Converts Club\n${BUSINESS.phone}` },
] as const;

export type SenderKey = (typeof SENDERS)[number]["key"];
export const SENDER_KEYS = SENDERS.map((s) => s.key) as [SenderKey, ...SenderKey[]];

export const senderFor = (key: string) => SENDERS.find((s) => s.key === key) ?? null;

/** The most addresses one send may reach. A hosting mailbox is not a bulk-mail service, and a burst over its hourly limit would bounce. */
export const MAX_RECIPIENTS = 100;

const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

/** Splits a pasted list ("a@x.com, b@y.com\nc@z.com", or "Name <a@x.com>") into unique valid addresses and the entries that were not addresses. */
export function parseRecipients(raw: string): { valid: string[]; invalid: string[] } {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const piece of raw.split(/[,;\n\r\t ]+/)) {
    const token = piece.replace(/^.*</, "").replace(/>.*$/, "").trim();
    if (!token) continue;
    if (EMAIL.test(token)) {
      const e = token.toLowerCase();
      if (!seen.has(e)) { seen.add(e); valid.push(e); }
    } else if (!/^[\p{L}\p{N}'.-]+$/u.test(token) || token.includes("@")) invalid.push(token);
  }
  return { valid, invalid };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function linkify(escaped: string): string {
  return escaped.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])/g, (u) => `<a href="${u}" style="color:#7A1F2B">${u}</a>`);
}

/** Plain text body with the signature appended (the text part of the mail, and what is logged). */
export function composeText(body: string, signature: string | null): string {
  const b = body.replace(/\r\n/g, "\n").trim();
  return signature ? `${b}\n\n--\n${signature}` : b;
}

/** A simple, personal-looking HTML body: paragraphs and line breaks, links made clickable, nothing else. */
export function composeHtml(body: string, signature: string | null): string {
  const paragraphs = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${linkify(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`).join("");
  const sig = signature ? `<p style="margin:18px 0 0;color:#6F655A;font-size:13px;border-top:1px solid #E6DFD5;padding-top:12px">${escapeHtml(signature).replace(/\n/g, "<br>")}</p>` : "";
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#16130F">${paragraphs}${sig}</div>`;
}

export const replySubject = (s: string) => (/^re:/i.test(s.trim()) ? s.trim() : `Re: ${s.trim()}`);

/** The original message, quoted under a reply ("On <date>, <who> wrote:" then each line prefixed with "> "). */
export function quoteForReply(from: string, date: Date | null, text: string): string {
  const when = date ? date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "";
  const quoted = text.replace(/\r\n/g, "\n").trim().split("\n").slice(0, 60).map((l) => `> ${l}`).join("\n");
  return `\n\nOn ${when}, ${from} wrote:\n${quoted}`;
}

/** Threading headers for a reply, so it sits under the original in the other person's mail program. */
export function threadHeaders(messageId: string | null | undefined, references: string[] | string | null | undefined): { inReplyTo?: string; references?: string[] } {
  if (!messageId) return {};
  const prev = Array.isArray(references) ? references : references ? references.split(/\s+/).filter(Boolean) : [];
  return { inReplyTo: messageId, references: [...prev.filter((r) => r !== messageId), messageId].slice(-20) };
}

/**
 * Wraps a received email's HTML so it can be shown inside a sandboxed frame. A content-security-policy blocks scripts, forms
 * and (unless `allowImages`) every remote request, so opening a message cannot run code or tell the sender you read it.
 */
export function framedEmailHtml(html: string, allowImages: boolean): string {
  const csp = `default-src 'none'; img-src data: cid:${allowImages ? " https: http:" : ""}; style-src 'unsafe-inline'; font-src data:`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.55;color:#16130F;margin:12px;word-wrap:break-word}img{max-width:100%;height:auto}pre{white-space:pre-wrap}</style></head><body>${html}</body></html>`;
}

/** Plain text shown as HTML in the same frame, when a message has no HTML part. */
export const textAsHtml = (text: string) => `<pre style="font:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`;

/** "Name <a@b.com>" or "a@b.com". */
export const formatAddress = (a: { name?: string | null; address?: string | null } | null | undefined) => (a?.address ? (a.name ? `${a.name} <${a.address}>` : a.address) : (a?.name ?? ""));
