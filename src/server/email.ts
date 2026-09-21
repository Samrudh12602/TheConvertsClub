import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { TransactionalEmail } from "@/emails/transactional";
import { TEMPLATES, buildProps, type TemplateKey } from "@/server/email-templates";

const FROM = () => process.env.EMAIL_FROM || "The Convert Club <onboarding@resend.dev>";

export interface SendArgs {
  template: TemplateKey;
  to: string;
  vars?: Record<string, string | number | undefined>;
  details?: { k: string; v: string }[];
  /** Path or absolute URL for the CTA button. */
  url?: string;
}

/**
 * Sends one transactional email via Resend and records it in EmailLog. Never throws: a failed email must not
 * fail a payment or a booking. With no RESEND_API_KEY the email is logged as SKIPPED.
 * Until a sending domain is verified in Resend, only the Resend account owner's address can receive mail.
 */
export async function sendEmail(a: SendArgs): Promise<{ status: "SENT" | "FAILED" | "SKIPPED"; id?: string }> {
  const override = await db.emailTemplate.findUnique({ where: { key: a.template } }).catch(() => null);
  const def = { ...TEMPLATES[a.template], ...(override ? { subject: override.subject, head: override.heading, body: override.body } : {}) };
  const url = a.url ? (a.url.startsWith("http") ? a.url : `${appUrl()}${a.url}`) : undefined;
  const { subject, props } = buildProps(def, a.vars ?? {}, { details: a.details, url });

  const log = (status: "SENT" | "FAILED" | "SKIPPED", extra: { providerId?: string; error?: string } = {}) =>
    db.emailLog.create({ data: { template: a.template, recipient: a.to, subject, status, ...extra } }).catch((e) => console.error("emaillog", e));

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await log("SKIPPED", { error: "RESEND_API_KEY not set" });
    return { status: "SKIPPED" };
  }
  try {
    const html = await render(createElement(TransactionalEmail, props));
    const text = await render(createElement(TransactionalEmail, props), { plainText: true });
    const { data, error } = await new Resend(key).emails.send({ from: FROM(), to: a.to, subject, html, text });
    if (error) {
      await log("FAILED", { error: error.message });
      return { status: "FAILED" };
    }
    await log("SENT", { providerId: data?.id });
    return { status: "SENT", id: data?.id };
  } catch (e) {
    await log("FAILED", { error: e instanceof Error ? e.message : String(e) });
    return { status: "FAILED" };
  }
}
