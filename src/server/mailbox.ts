import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { ImapFlow, type FetchMessageObject, type MailboxObject, type SearchObject } from "imapflow";
import { simpleParser, type AddressObject, type ParsedMail } from "mailparser";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { db } from "@/lib/db";
import { composeHtml, composeText, formatAddress, senderFor, threadHeaders } from "@/lib/mailbox";

/** The website's mailbox, read over IMAP and written over SMTP with the same login the site already sends with. */
export class MailboxError extends Error {}

export const mailboxConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const PER_PAGE = 25;
/** Messages bigger than this are listed but not opened here (they are mostly attachments). */
const MAX_OPEN_BYTES = 10 * 1024 * 1024;

export type FolderKey = "inbox" | "sent" | "spam" | "trash";

function client() {
  if (!mailboxConfigured()) throw new MailboxError("The mailbox is not connected on this server (SMTP_USER and SMTP_PASS are not set).");
  return new ImapFlow({
    host: process.env.IMAP_HOST || "imap.hostinger.com",
    port: Number(process.env.IMAP_PORT) || 993,
    secure: true,
    auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string },
    logger: false,
    socketTimeout: 25_000,
  });
}

/** Runs `fn` with a connected client and always logs out, turning connection failures into one readable error. */
async function withClient<T>(fn: (c: ImapFlow) => Promise<T>): Promise<T> {
  const c = client();
  try {
    await c.connect();
  } catch (e) {
    throw new MailboxError(`Could not reach the mailbox (${e instanceof Error ? e.message : "connection failed"}).`);
  }
  try {
    return await fn(c);
  } finally {
    await c.logout().catch(() => undefined);
  }
}

/** Folder paths differ between providers: find them by their role, with the usual names as a fallback. */
async function folderPaths(c: ImapFlow): Promise<Record<FolderKey, string>> {
  const list = await c.list();
  const byUse = (use: string, names: RegExp, fallback: string) => list.find((m) => m.specialUse === use)?.path ?? list.find((m) => names.test(m.path))?.path ?? fallback;
  return {
    inbox: "INBOX",
    sent: byUse("\\Sent", /sent/i, "INBOX.Sent"),
    spam: byUse("\\Junk", /spam|junk/i, "INBOX.spam"),
    trash: byUse("\\Trash", /trash|deleted/i, "INBOX.Trash"),
  };
}

const addrs = (a: { name?: string; address?: string }[] | undefined) => (a ?? []).map((x) => ({ name: x.name || "", address: x.address || "" }));

export interface MailRow {
  uid: number;
  seen: boolean;
  from: { name: string; address: string };
  to: string[];
  subject: string;
  date: string | null;
  size: number;
}

function toRow(m: FetchMessageObject): MailRow {
  const e = m.envelope;
  return {
    uid: m.uid,
    seen: m.flags?.has("\\Seen") ?? false,
    from: addrs(e?.from)[0] ?? { name: "", address: "" },
    to: addrs(e?.to).map((t) => t.address).filter(Boolean),
    subject: e?.subject || "(no subject)",
    date: (e?.date ?? m.internalDate) ? new Date((e?.date ?? m.internalDate) as Date | string).toISOString() : null,
    size: m.size ?? 0,
  };
}

export interface ListArgs { folder: FolderKey; page: number; q?: string; alias?: string }
export interface MailList { rows: MailRow[]; total: number; unseen: number; page: number; pages: number }

export async function listMail({ folder, page, q, alias }: ListArgs): Promise<MailList> {
  return withClient(async (c) => {
    const path = (await folderPaths(c))[folder];
    const lock = await c.getMailboxLock(path);
    try {
      const box = c.mailbox as MailboxObject;
      const status = await c.status(path, { unseen: true });
      const unseen = status ? status.unseen ?? 0 : 0;
      const fields = { uid: true, envelope: true, flags: true, internalDate: true, size: true } as const;
      const rows: FetchMessageObject[] = [];
      let total = box.exists;
      const query: SearchObject = {};
      if (alias) query.to = alias;
      if (q?.trim()) query.or = [{ subject: q.trim() }, { from: q.trim() }];
      if (Object.keys(query).length) {
        const found = ((await c.search(query, { uid: true })) || []).sort((a, b) => b - a);
        total = found.length;
        const slice = found.slice((page - 1) * PER_PAGE, page * PER_PAGE);
        if (slice.length) for await (const m of c.fetch(slice.join(","), fields, { uid: true })) rows.push(m);
      } else if (total > 0) {
        const end = total - (page - 1) * PER_PAGE;
        const start = Math.max(1, end - PER_PAGE + 1);
        if (end >= 1) for await (const m of c.fetch(`${start}:${end}`, fields)) rows.push(m);
      }
      rows.sort((a, b) => b.uid - a.uid);
      return { rows: rows.map(toRow), total, unseen, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
    } finally {
      lock.release();
    }
  });
}

export interface MailAttachment { index: number; filename: string; contentType: string; size: number }
export interface OpenedMail {
  uid: number;
  folder: FolderKey;
  subject: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  cc: { name: string; address: string }[];
  date: string | null;
  messageId: string | null;
  references: string[];
  text: string;
  html: string | null;
  attachments: MailAttachment[];
  tooLarge: boolean;
}

const flat = (a: AddressObject | AddressObject[] | undefined) => addrs((Array.isArray(a) ? a.flatMap((x) => x.value) : a?.value) as { name?: string; address?: string }[] | undefined);

/** Swaps inline `cid:` images for data URIs so they show, because the frame blocks every remote request. */
function inlineImages(html: string, mail: ParsedMail): string {
  let out = html;
  for (const a of mail.attachments) {
    if (!a.cid || !a.contentType.startsWith("image/") || a.size > 400 * 1024) continue;
    out = out.split(`cid:${a.cid}`).join(`data:${a.contentType};base64,${a.content.toString("base64")}`);
  }
  return out;
}

async function fetchSource(c: ImapFlow, uid: number): Promise<{ source: Buffer | null; size: number }> {
  const meta = await c.fetchOne(String(uid), { uid: true, size: true }, { uid: true });
  if (!meta) throw new MailboxError("That message no longer exists.");
  if ((meta.size ?? 0) > MAX_OPEN_BYTES) return { source: null, size: meta.size ?? 0 };
  const full = await c.fetchOne(String(uid), { uid: true, source: true }, { uid: true });
  return { source: full && full.source ? full.source : null, size: meta.size ?? 0 };
}

/** Opens one message and marks it read. */
export async function openMail(folder: FolderKey, uid: number): Promise<OpenedMail> {
  return withClient(async (c) => {
    const path = (await folderPaths(c))[folder];
    const lock = await c.getMailboxLock(path);
    try {
      const { source } = await fetchSource(c, uid);
      if (!source) {
        const env = (await c.fetchOne(String(uid), { uid: true, envelope: true }, { uid: true })) as FetchMessageObject;
        return { uid, folder, subject: env.envelope?.subject || "(no subject)", from: addrs(env.envelope?.from)[0] ?? { name: "", address: "" }, to: addrs(env.envelope?.to), cc: [], date: env.envelope?.date ? new Date(env.envelope.date).toISOString() : null, messageId: env.envelope?.messageId ?? null, references: [], text: "", html: null, attachments: [], tooLarge: true };
      }
      const mail = await simpleParser(source);
      await c.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true }).catch(() => undefined);
      return {
        uid, folder,
        subject: mail.subject || "(no subject)",
        from: flat(mail.from)[0] ?? { name: "", address: "" },
        to: flat(mail.to), cc: flat(mail.cc),
        date: mail.date ? mail.date.toISOString() : null,
        messageId: mail.messageId ?? null,
        references: Array.isArray(mail.references) ? mail.references : mail.references ? [mail.references] : [],
        text: mail.text ?? "",
        html: typeof mail.html === "string" ? inlineImages(mail.html, mail) : null,
        attachments: mail.attachments.filter((a) => !(a.related && a.cid)).map((a, index) => ({ index, filename: a.filename || `attachment-${index + 1}`, contentType: a.contentType, size: a.size })),
        tooLarge: false,
      };
    } finally {
      lock.release();
    }
  });
}

export async function attachmentOf(folder: FolderKey, uid: number, index: number): Promise<{ filename: string; contentType: string; content: Buffer } | null> {
  return withClient(async (c) => {
    const path = (await folderPaths(c))[folder];
    const lock = await c.getMailboxLock(path);
    try {
      const { source } = await fetchSource(c, uid);
      if (!source) return null;
      const mail = await simpleParser(source);
      const a = mail.attachments.filter((x) => !(x.related && x.cid))[index];
      return a ? { filename: a.filename || `attachment-${index + 1}`, contentType: a.contentType, content: a.content } : null;
    } finally {
      lock.release();
    }
  });
}

/** Moves a message to Trash (or, from Trash, deletes it for good). */
export async function trashMail(folder: FolderKey, uid: number): Promise<void> {
  await withClient(async (c) => {
    const paths = await folderPaths(c);
    const lock = await c.getMailboxLock(paths[folder]);
    try {
      if (folder === "trash") await c.messageDelete(String(uid), { uid: true });
      else await c.messageMove(String(uid), paths.trash, { uid: true });
    } finally {
      lock.release();
    }
  });
}

export async function setMailRead(folder: FolderKey, uid: number, read: boolean): Promise<void> {
  await withClient(async (c) => {
    const lock = await c.getMailboxLock((await folderPaths(c))[folder]);
    try {
      if (read) await c.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
      else await c.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
  });
}

export async function unreadCount(): Promise<number | null> {
  if (!mailboxConfigured()) return null;
  try {
    return await withClient(async (c) => { const st = await c.status("INBOX", { unseen: true }); return st ? st.unseen ?? 0 : 0; });
  } catch {
    return null;
  }
}

// ───────────── Sending ─────────────

/** Copies saved to the mailbox's own Sent folder, so they show up in webmail too. Only for small sends, to keep the folder readable. */
const COPY_TO_SENT_UP_TO = 10;

export interface SendArgs {
  fromKey: string;
  recipients: string[];
  subject: string;
  body: string;
  signature: boolean;
  thread?: { messageId: string | null; references: string[] } | null;
  sentById: string | null;
  /** Added to the end of every message of a bulk send. */
  footer?: string;
}

export interface SendResult { batchId: string; sent: number; failed: { to: string; error: string }[] }

export async function sendDirect(a: SendArgs): Promise<SendResult> {
  const sender = senderFor(a.fromKey);
  if (!sender) throw new MailboxError("Choose one of the three sending addresses.");
  if (!mailboxConfigured()) throw new MailboxError("The mailbox is not connected on this server (SMTP_USER and SMTP_PASS are not set).");
  const port = Number(process.env.SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.hostinger.com", port, secure: port === 465, pool: true, maxConnections: 2, auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string } });
  const signature = a.signature ? sender.signature : null;
  const body = a.footer ? `${a.body.trim()}\n\n${a.footer}` : a.body;
  const text = composeText(body, signature);
  const html = composeHtml(body, signature);
  const batchId = randomUUID();
  const failed: { to: string; error: string }[] = [];
  const copies: Buffer[] = [];
  let sent = 0;
  try {
    for (const to of a.recipients) {
      const mail = { from: { name: sender.name, address: sender.address }, to, replyTo: sender.address, subject: a.subject, text, html, ...threadHeaders(a.thread?.messageId, a.thread?.references) };
      try {
        const info = await transport.sendMail(mail);
        sent++;
        await db.sentMail.create({ data: { batchId, fromAddress: sender.address, toAddress: to, subject: a.subject, body: text, status: "SENT", messageId: info.messageId ?? null, sentById: a.sentById } });
        if (a.recipients.length <= COPY_TO_SENT_UP_TO) copies.push(await new MailComposer({ ...mail, messageId: info.messageId }).compile().build());
      } catch (e) {
        const error = e instanceof Error ? e.message : "Send failed";
        failed.push({ to, error });
        await db.sentMail.create({ data: { batchId, fromAddress: sender.address, toAddress: to, subject: a.subject, body: text, status: "FAILED", error, sentById: a.sentById } });
      }
    }
  } finally {
    transport.close();
  }
  // Saving the Sent copy takes a few seconds, so it runs after the confirmation is on its way to the page.
  if (copies.length) {
    after(() =>
      withClient(async (c) => {
        const sentPath = (await folderPaths(c)).sent;
        for (const raw of copies) await c.append(sentPath, raw, ["\\Seen"]);
      }).catch((e) => console.error("could not save copy to Sent", e)),
    );
  }
  return { batchId, sent, failed };
}

// ───────────── Logs ─────────────

export const sentLog = (take = 200) => db.sentMail.findMany({ orderBy: { createdAt: "desc" }, take });
export const automaticLog = (take = 200) => db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take });

export { formatAddress };
