import { BUSINESS } from "@/lib/business";

/**
 * The addresses the owner can send from in the Mailbox. They all belong to one Hostinger mailbox (admin@): the other two are
 * aliases, so mail sent to any of them lands in the same inbox, and the site sends through that mailbox's SMTP login.
 */
export const SENDERS = [
  { key: "support", address: `support@${BUSINESS.domain}`, name: "The Converts Club Support", title: "Support Team", role: null },
  { key: "admin", address: `admin@${BUSINESS.domain}`, name: "The Converts Club", title: "The Converts Club Team", role: null },
  { key: "samrudh", address: `samrudh@${BUSINESS.domain}`, name: "Samrudh · The Converts Club", title: "Samrudh Dhaimodkar", role: "Founder" },
] as const;

export type SenderKey = (typeof SENDERS)[number]["key"];
export const SENDER_KEYS = SENDERS.map((s) => s.key) as [SenderKey, ...SenderKey[]];

export type Sender = (typeof SENDERS)[number];
export const senderFor = (key: string) => SENDERS.find((s) => s.key === key) ?? null;

const SITE = `https://${BUSINESS.domain}`;

/** The signature as plain text: the name, the organisation, then how to reach us. */
export function signatureText(s: Sender): string {
  return [s.title, s.role ? `${s.role}, ${BUSINESS.brand}` : BUSINESS.brand, `Tel.: ${BUSINESS.phone}`, `Email: ${s.address}`, BUSINESS.domain].join("\n");
}

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

const BUTTON = /^\[button:\s*(.+?)\s*\|\s*(https?:\/\/[^\s\]]+)\s*\]$/i;
const MD_LINK = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
const MD_LINK_ONE = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/;

/**
 * The little formatting the message box understands, each on its own line or block:
 *   # Big heading     ## Smaller heading     - a bullet     > a highlighted box     **bold**     [text](https://link)
 *   [button: Label | https://link]   a button
 * This turns it into plain text for the text part of the mail (and the sent log).
 */
export function plainFromMarkup(body: string): string {
  return body.replace(/\r\n/g, "\n").trim().split("\n").map((l) => {
    const btn = l.trim().match(BUTTON);
    if (btn) return `${btn[1]}: ${btn[2]}`;
    return l.replace(/^#{1,2}\s+/, "").replace(/^>\s?/, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 ($2)");
  }).join("\n");
}

/** Plain text body with the signature appended (the text part of the mail, and what is logged). */
export function composeText(body: string, signature: string | null): string {
  const b = plainFromMarkup(body);
  return signature ? `${b}\n\n--\n${signature}` : b;
}

/** The logo embedded at the bottom of every email we write by hand (attached inline, so it shows even where remote pictures are blocked). */
export const LOGO_CID = "tcc-logo@theconvertsclub.in";
export const LOGO_URL = `https://${BUSINESS.domain}/brand/mark.png`;

const LOGO_IMG = (src: string, w: number, h: number) => `<img src="${src}" width="${w}" height="${h}" alt="${BUSINESS.brand}" style="display:block;border:0;outline:none">`;
const LINK = "color:#1a56c4;text-decoration:underline";
const OXBLOOD = "#7A1F2B";
const INK = "#16130F";
const BODY = "#3B352E";

/** Inline formatting inside one line: **bold**, [text](https://link) and bare links. Everything typed is escaped first. */
function inline(raw: string): string {
  return raw.split(MD_LINK).map((part) => {
    const m = part.match(MD_LINK_ONE);
    if (m) return `<a href="${escapeHtml(m[2])}" style="${LINK}">${escapeHtml(m[1])}</a>`;
    return linkify(escapeHtml(part).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  }).join("");
}

const buttonHtml = (label: string, url: string) =>
  `<a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;background:${OXBLOOD};color:#ffffff;font-size:15px;font-weight:700;line-height:1;text-decoration:none;padding:15px 28px;border-radius:999px;margin:0 10px 10px 0">${escapeHtml(label)}</a>`;

/** One blank-line-separated block of the message as email-safe HTML. */
function blockHtml(block: string): string {
  const lines = block.split("\n");
  if (lines.every((l) => BUTTON.test(l.trim()))) {
    return `<p style="margin:6px 0 20px;line-height:1">${lines.map((l) => { const m = l.trim().match(BUTTON)!; return buttonHtml(m[1], m[2]); }).join("")}</p>`;
  }
  const head = lines[0].match(/^(#{1,2})\s+(.+)$/);
  if (head) {
    const big = head[1].length === 1;
    const h = `<p style="margin:0 0 ${big ? 14 : 10}px;font-size:${big ? 30 : 20}px;line-height:1.2;font-weight:700;color:${INK};letter-spacing:-0.3px">${inline(head[2])}</p>`;
    return lines.length > 1 ? `${h}${blockHtml(lines.slice(1).join("\n"))}` : h;
  }
  if (lines.every((l) => /^[-•]\s+/.test(l))) {
    return `<ul style="margin:0 0 18px;padding-left:22px">${lines.map((l) => `<li style="margin:0 0 6px">${inline(l.replace(/^[-•]\s+/, ""))}</li>`).join("")}</ul>`;
  }
  if (lines.every((l) => l.startsWith(">"))) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tbody><tr><td style="background:#F3F1EE;border-radius:14px;padding:18px 22px;font-size:15px;line-height:1.6;color:${INK}">${lines.map((l) => inline(l.replace(/^>\s?/, ""))).join("<br>")}</td></tr></tbody></table>`;
  }
  return `<p style="margin:0 0 18px">${lines.map(inline).join("<br>")}</p>`;
}

/**
 * The HTML of an email written by hand, laid out like a modern product email: the logo and the name large at the top, a clear type
 * hierarchy (headings, readable body text), buttons, soft highlighted boxes, then a signature block in the style of an institute's
 * email signature (bold name, the organisation in the brand colour, Tel. and Email, the logo beneath, the website). The logo is also
 * at the bottom, in the signature. Only what the formatting above allows is ever produced from the typed text.
 */
export function composeHtml(body: string, sender: Sender | null, logoSrc: string = `cid:${LOGO_CID}`): string {
  const blocks = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/).map(blockHtml).join("");
  const line = "margin:0 0 3px";
  const details = sender
    ? `<p style="${line};font-weight:700;color:${INK}">${escapeHtml(sender.title)}</p>`
      + (sender.role ? `<p style="${line};color:${INK}">${escapeHtml(sender.role)}</p>` : "")
      + `<p style="${line};font-weight:700;color:${OXBLOOD}">${BUSINESS.brand}</p>`
      + `<p style="${line};color:${INK}"><b>Tel.:</b> <a href="${BUSINESS.phoneHref}" style="${LINK}">${BUSINESS.phone}</a></p>`
      + `<p style="${line};color:${INK}"><b>Email:</b> <a href="mailto:${sender.address}" style="${LINK}">${sender.address}</a></p>`
    : "";
  const signature = `<div style="margin-top:28px;border-top:1px solid #E6DFD5;padding-top:18px;font-size:14px;line-height:1.5">${details}<div style="margin:12px 0 8px">${LOGO_IMG(logoSrc, 40, 36)}</div><p style="${line}"><a href="${SITE}" style="${LINK}">${BUSINESS.domain}</a></p></div>`;
  const header = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px"><tbody><tr><td style="vertical-align:middle;line-height:0">${LOGO_IMG(logoSrc, 58, 52)}</td><td style="vertical-align:middle;padding-left:14px;font-size:26px;font-weight:800;letter-spacing:-0.4px;color:${INK};line-height:1.1">${BUSINESS.brand}</td></tr></tbody></table>`;
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${BODY};max-width:600px;margin:0 auto;padding:8px 4px">${header}${blocks}${signature}</div>`;
}

/** Writes each person's own first name where the message says {{first_name}} ("there" when we do not know it). */
export const fillMergeFields = (text: string, firstName: string | null | undefined) => text.replace(/\{\{\s*first_name\s*\}\}/gi, firstName?.trim() || "there");

/** "Priya Nair (demo)" -> "Priya". */
export const firstNameOf = (name: string | null | undefined) => (name ?? "").replace(/\s*\(demo.*?\)/i, "").trim().split(/\s+/)[0] ?? "";

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
