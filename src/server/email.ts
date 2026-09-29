import nodemailer from "nodemailer";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { TransactionalEmail } from "@/emails/transactional";
import { TEMPLATES, buildProps, type TemplateKey } from "@/server/email-templates";

export type EmailProvider = "gmail" | "resend" | null;

/** Gmail (an app password) wins over Resend when both are set, so the owner's own inbox is the sender. */
export function emailProvider(env: Record<string, string | undefined> = process.env): EmailProvider {
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) return "gmail";
  if (env.RESEND_API_KEY) return "resend";
  return null;
}

/** True when the site can actually deliver mail, which is what turns on email verification at signup. */
export const emailConfigured = () => emailProvider() !== null;

/** Demo and test addresses can never receive real mail. */
const isUndeliverable = (to: string) => /\.test$/i.test(to.trim());

export interface SendArgs {
  template: TemplateKey;
  to: string;
  vars?: Record<string, string | number | undefined>;
  details?: { k: string; v: string }[];
  /** Path or absolute URL for the CTA button. */
  url?: string;
  /** Where replies go. Defaults to the sending mailbox, so replies land in the owner's inbox. */
  replyTo?: string;
}

interface Rendered { subject: string; html: string; text: string }

async function deliverGmail(to: string, r: Rendered, replyTo?: string) {
  const user = process.env.GMAIL_USER as string;
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass: process.env.GMAIL_APP_PASSWORD as string } });
  const info = await transport.sendMail({ from: { name: "The Convert Club", address: user }, to, replyTo: replyTo ?? user, subject: r.subject, html: r.html, text: r.text });
  return info.messageId as string;
}

async function deliverResend(to: string, r: Rendered, replyTo?: string) {
  const from = process.env.EMAIL_FROM || "The Convert Club <onboarding@resend.dev>";
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to, subject: r.subject, html: r.html, text: r.text, ...(replyTo ? { replyTo } : {}) });
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
    await log("SKIPPED", { error: "no email provider configured (set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY)" });
    return { status: "SKIPPED" };
  }
  try {
    const html = await render(createElement(TransactionalEmail, props));
    const text = await render(createElement(TransactionalEmail, props), { plainText: true });
    const rendered = { subject, html, text };
    const id = provider === "gmail" ? await deliverGmail(a.to, rendered, a.replyTo) : await deliverResend(a.to, rendered, a.replyTo);
    await log("SENT", { providerId: id });
    return { status: "SENT", id };
  } catch (e) {
    await log("FAILED", { error: e instanceof Error ? e.message : String(e) });
    return { status: "FAILED" };
  }
}

/** The owner's inbox for alerts (new application, new message). Real environments only; demo traffic never emails the owner. */
export const adminInbox = () => process.env.ADMIN_EMAIL?.trim() || null;
