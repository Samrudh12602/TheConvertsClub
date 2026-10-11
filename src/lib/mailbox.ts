import { BUSINESS } from "@/lib/business";

/**
 * The addresses the owner can send from in the Mailbox. They all belong to one Hostinger mailbox (admin@): the other two are
 * aliases, so mail sent to any of them lands in the same inbox, and the site sends through that mailbox's SMTP login.
 */
export const SENDERS = [
  { key: "support", style: "brand", address: `support@${BUSINESS.domain}`, name: "The Converts Club Support", signature: `The Converts Club Support\n${BUSINESS.supportEmail} · ${BUSINESS.phone}` },
  { key: "admin", style: "brand", address: `admin@${BUSINESS.domain}`, name: "The Converts Club", signature: `The Converts Club team\n${BUSINESS.supportEmail} · ${BUSINESS.phone}` },
  { key: "samrudh", style: "personal", address: `samrudh@${BUSINESS.domain}`, name: "Samrudh · The Converts Club", signature: `Samrudh Dhaimodkar\nThe Converts Club\n${BUSINESS.phone}` },
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

/** The picture embedded in every email we write by hand (attached inline, so it shows even where remote pictures are blocked). */
export const LOGO_CID = "tcc-logo@theconvertsclub.in";
export const LOGO_URL = `https://${BUSINESS.domain}/brand/mark.png`;

export type MailStyle = "brand" | "personal";

const LOGO_IMG = (src: string) => `<img src="${src}" width="28" height="25" alt="${BUSINESS.brand}" style="display:block;border:0">`;

/**
 * The HTML body. Support and admin mail carry the logo and name in a header on top, like our automatic emails. Mail from Samrudh is
 * personal: plain paragraphs, then the signature with the logo below it. Only paragraphs, line breaks and links are ever produced from the typed text.
 */
export function composeHtml(body: string, signature: string | null, style: MailStyle = "brand", logoSrc: string = `cid:${LOGO_CID}`): string {
  const paragraphs = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${linkify(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`).join("");
  const sigText = signature ? `<div style="color:#6F655A;font-size:13px;line-height:1.55">${escapeHtml(signature).replace(/\n/g, "<br>")}</div>` : "";
  const wrap = (inner: string) => `<div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#16130F;max-width:600px">${inner}</div>`;
  if (style === "personal") {
    const sig = `<div style="margin-top:18px;border-top:1px solid #E6DFD5;padding-top:12px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td style="vertical-align:top;padding-right:10px;width:28px">${LOGO_IMG(logoSrc)}</td><td style="vertical-align:top">${sigText}</td></tr></tbody></table></div>`;
    return wrap(`${paragraphs}${sig}`);
  }
  const header = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-bottom:1px solid #E6DFD5;margin-bottom:18px"><tbody><tr><td style="width:28px;padding:0 0 12px;line-height:0">${LOGO_IMG(logoSrc)}</td><td style="padding:0 0 12px 8px;font-weight:700;font-size:14px;color:#16130F">${BUSINESS.brand}</td></tr></tbody></table>`;
  const sig = sigText ? `<div style="margin-top:18px;border-top:1px solid #E6DFD5;padding-top:12px">${sigText}</div>` : "";
  return wrap(`${header}${paragraphs}${sig}`);
}

/** Limits for files attached to an email written here. */
export const ATTACH_MAX_FILES = 5;
export const ATTACH_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ATTACH_MAX_TOTAL_BYTES = 15 * 1024 * 1024;
/** A message to a whole group is sent once per person, so its attachments are kept small. */
export const ATTACH_MAX_BULK_TOTAL_BYTES = 3 * 1024 * 1024;
const BLOCKED_FILE = /\.(exe|bat|cmd|com|scr|pif|msi|dll|jar|js|jse|vbs|vbe|wsf|ps1|sh|apk|lnk|reg)$/i;

/** Returns what is wrong with a set of files to attach, or null if they are fine. */
export function attachmentProblem(files: { name: string; size: number }[], bulk: boolean): string | null {
  if (files.length > ATTACH_MAX_FILES) return `Attach up to ${ATTACH_MAX_FILES} files.`;
  for (const f of files) {
    if (BLOCKED_FILE.test(f.name)) return `${f.name}: this kind of file can't be sent by email.`;
    if (f.size > ATTACH_MAX_FILE_BYTES) return `${f.name} is over ${ATTACH_MAX_FILE_BYTES / 1024 / 1024} MB.`;
  }
  const total = files.reduce((n, f) => n + f.size, 0);
  const cap = bulk ? ATTACH_MAX_BULK_TOTAL_BYTES : ATTACH_MAX_TOTAL_BYTES;
  if (total > cap) return `Attachments total ${(total / 1024 / 1024).toFixed(1)} MB; the limit is ${cap / 1024 / 1024} MB${bulk ? " when sending to a whole group" : ""}.`;
  return null;
}

export const fileSizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

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
  const guard = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank">`;
  // A page that refreshes itself could send the frame elsewhere.
  const safe = html.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh[^>]*>/gi, "");
  // Marketing emails are whole documents with their own <body> colours, so they are used as the document itself (the policy goes in first).
  if (/<html[\s>]/i.test(safe)) {
    if (/<head[\s>]/i.test(safe)) return safe.replace(/<head(\s[^>]*)?>/i, (m) => `${m}${guard}`);
    return safe.replace(/<html(\s[^>]*)?>/i, (m) => `${m}<head>${guard}</head>`);
  }
  return `<!doctype html><html><head>${guard}<style>body{font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.55;color:#16130F;margin:12px;word-wrap:break-word}img{max-width:100%;height:auto}pre{white-space:pre-wrap}</style></head><body>${safe}</body></html>`;
}

/** Plain text shown as HTML in the same frame, when a message has no HTML part. */
export const textAsHtml = (text: string) => `<pre style="font:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`;

/** "Name <a@b.com>" or "a@b.com". */
export const formatAddress = (a: { name?: string | null; address?: string | null } | null | undefined) => (a?.address ? (a.name ? `${a.name} <${a.address}>` : a.address) : (a?.name ?? ""));
