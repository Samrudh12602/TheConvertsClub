import nodemailer from "nodemailer";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { TransactionalEmail } from "@/emails/transactional";
import { TEMPLATES, buildProps, type TemplateKey } from "@/server/email-templates";

export type EmailProvider = "smtp" | "gmail" | "resend" | null;

/** The domain mailbox (SMTP) wins, then Gmail (an app password), then Resend. To send from the domain address, set the SMTP_* variables and EMAIL_FROM. */
export function emailProvider(env: Record<string, string | undefined> = process.env): EmailProvider {
  if (env.SMTP_USER && env.SMTP_PASS) return "smtp";
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) return "gmail";
  if (env.RESEND_API_KEY) return "resend";
  return null;
}

/** True when the site can actually deliver mail, which is what turns on email verification at signup. */
export const emailConfigured = () => emailProvider() !== null;

/** Demo and test addresses can never receive real mail. */
const isUndeliverable = (to: string) => /\.test$/i.test(to.trim());

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendArgs {
  template: TemplateKey;
  to: string;
  vars?: Record<string, string | number | undefined>;
  details?: { k: string; v: string }[];
  /** Path or absolute URL for the CTA button. */
  url?: string;
  /** Where replies go. Defaults to the sending mailbox (Gmail) or EMAIL_REPLY_TO / the From address (Resend). */
  replyTo?: string;
  attachments?: EmailAttachment[];
}

interface Rendered { subject: string; html: string; text: string }

/** The business mailbox over SMTP (Hostinger by default). EMAIL_FROM may be any address the mailbox is allowed to send as, e.g. an alias. */
async function deliverSmtp(to: string, r: Rendered, replyTo?: string, attachments?: EmailAttachment[]) {
  const user = process.env.SMTP_USER as string;
  const port = Number(process.env.SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.hostinger.com", port, secure: port === 465, auth: { user, pass: process.env.SMTP_PASS as string } });
  const reply = replyTo ?? process.env.EMAIL_REPLY_TO;
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || { name: "The Converts Club", address: user }, to, ...(reply ? { replyTo: reply } : {}), subject: r.subject, html: r.html, text: r.text,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });
  return info.messageId as string;
}

async function deliverGmail(to: string, r: Rendered, replyTo?: string, attachments?: EmailAttachment[]) {
  const user = process.env.GMAIL_USER as string;
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass: process.env.GMAIL_APP_PASSWORD as string } });
  const info = await transport.sendMail({
    from: { name: "The Converts Club", address: user }, to, replyTo: replyTo ?? user, subject: r.subject, html: r.html, text: r.text,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });
  return info.messageId as string;
}

async function deliverResend(to: string, r: Rendered, replyTo?: string, attachments?: EmailAttachment[]) {
  const from = process.env.EMAIL_FROM || "The Converts Club <onboarding@resend.dev>";
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from, to, subject: r.subject, html: r.html, text: r.text, ...(replyTo ?? process.env.EMAIL_REPLY_TO ? { replyTo: replyTo ?? process.env.EMAIL_REPLY_TO } : {}),
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
  if (error) throw new Error(error.message);
  return data?.id;
}

/**
 * Sends one transactional email (Gmail SMTP, else Resend) and records it in EmailLog. Never throws: a failed email
 * must not fail a payment, a booking or a signup. With no provider configured the email is logged as SKIPPED.
 */
export async function sendEmail(a: SendArgs): Promise<{ status: "SENT" | "FAILED" | "SKIPPED"; id?: string }> {
  const override = await db.emailTemplate.findUnique({ where: { key: a.template } }).catch(() => null);
  const def = { ...TEMPLATES[a.template], ...(override ? { subject: override.subject, head: override.heading, body: override.body } : {}) };
  const url = a.url ? (a.url.startsWith("http") ? a.url : `${appUrl()}${a.url}`) : undefined;
  const { subject, props } = buildProps(def, a.vars ?? {}, { details: a.details, url });

  const log = (status: "SENT" | "FAILED" | "SKIPPED", extra: { providerId?: string; error?: string } = {}) =>
    db.emailLog.create({ data: { template: a.template, recipient: a.to, subject, status, ...extra } }).catch((e) => console.error("emaillog", e));

  if (isUndeliverable(a.to)) {
    await log("SKIPPED", { error: "demo/test address" });
    return { status: "SKIPPED" };
  }
  const provider = emailProvider();
  if (!provider) {
    await log("SKIPPED", { error: "no email provider configured (set SMTP_USER + SMTP_PASS, GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY)" });
    return { status: "SKIPPED" };
  }
  try {
    const html = await render(createElement(TransactionalEmail, props));
    const text = await render(createElement(TransactionalEmail, props), { plainText: true });
    const rendered = { subject, html, text };
    const deliver = provider === "smtp" ? deliverSmtp : provider === "gmail" ? deliverGmail : deliverResend;
    const id = await deliver(a.to, rendered, a.replyTo, a.attachments);
    await log("SENT", { providerId: id });
    return { status: "SENT", id };
  } catch (e) {
    await log("FAILED", { error: e instanceof Error ? e.message : String(e) });
    return { status: "FAILED" };
  }
}

/** The owner's inbox for alerts (new application, new message). ALERT_EMAIL wins so alerts can go to the domain mailbox while ADMIN_EMAIL stays the admin's sign-in address. */
export const adminInbox = () => process.env.ALERT_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim() || null;
