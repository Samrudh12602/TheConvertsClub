"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { audit } from "@/server/audit";
import { BUSINESS } from "@/lib/business";
import { MAX_RECIPIENTS, SENDER_KEYS, attachmentProblem, parseRecipients } from "@/lib/mailbox";
import { MailboxError, sendDirect, setMailRead, trashMail } from "@/server/mailbox";

type Result = { ok: true; message: string } | { ok: false; error: string };

const fail = (e: unknown): Result => {
  if (e instanceof MailboxError) return { ok: false, error: e.message };
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Please check the form." };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};

const folderSchema = z.enum(["inbox", "sent", "spam", "trash"]);

const sendSchema = z.object({
  from: z.enum(SENDER_KEYS, { message: "Choose which address to send from." }),
  audience: z.enum(["SPECIFIC", "ALL_STUDENTS", "ALL_MENTORS"]),
  to: z.string().max(5000).optional(),
  subject: z.string().trim().min(1, "Add a subject.").max(200, "That subject is too long."),
  body: z.string().trim().min(1, "Write a message.").max(20000, "That message is too long."),
  signature: z.boolean(),
  thread: z.object({ messageId: z.string().max(500).nullable(), references: z.array(z.string().max(500)).max(30) }).nullable().optional(),
});

const BULK_FOOTER = `You are getting this because you have an account with ${BUSINESS.brand}. If you would rather not hear from us like this, just reply and say so.`;

/** The form posts the message as JSON in `payload` and any attachments as `files`. */
export async function sendMailAction(form: FormData): Promise<Result> {
  try {
    const admin = await requireAdmin();
    if (!(await rateLimit(`mailbox:send:${admin.id}`, 30, 3600)).ok) return { ok: false, error: "That is a lot of sending in an hour. Wait a little and try again." };
    let json: unknown;
    try { json = JSON.parse(String(form.get("payload") ?? "")); } catch { return { ok: false, error: "That message could not be read. Please try again." }; }
    const p = sendSchema.parse(json);
    const uploaded = form.getAll("files").filter((f): f is File => typeof f !== "string" && f.size > 0);
    const problem = attachmentProblem(uploaded.map((f) => ({ name: f.name, size: f.size })), p.audience !== "SPECIFIC");
    if (problem) return { ok: false, error: problem };
    const files = await Promise.all(uploaded.map(async (f) => ({ filename: f.name.replace(/[\r\n"]+/g, "_").slice(0, 150) || "attachment", content: Buffer.from(await f.arrayBuffer()), contentType: f.type || "application/octet-stream" })));

    let recipients: string[];
    if (p.audience === "SPECIFIC") {
      const parsed = parseRecipients(p.to ?? "");
      if (parsed.invalid.length) return { ok: false, error: `These are not valid email addresses: ${parsed.invalid.slice(0, 5).join(", ")}` };
      if (!parsed.valid.length) return { ok: false, error: "Add at least one recipient." };
      recipients = parsed.valid;
    } else {
      const role = p.audience === "ALL_STUDENTS" ? "STUDENT" : "MENTOR";
      const users = await db.user.findMany({ where: { role, status: "ACTIVE", isDemo: false }, select: { email: true } });
      recipients = users.map((u) => u.email).filter((e) => !/\.test$/i.test(e));
      if (!recipients.length) return { ok: false, error: `There are no active ${role === "STUDENT" ? "students" : "mentors"} to send to yet.` };
    }
    if (recipients.length > MAX_RECIPIENTS) return { ok: false, error: `One send can reach up to ${MAX_RECIPIENTS} people (this one has ${recipients.length}). Split it into smaller sends.` };

    const r = await sendDirect({ fromKey: p.from, recipients, subject: p.subject, body: p.body, signature: p.signature, thread: p.thread ?? null, sentById: admin.id, files, footer: p.audience === "SPECIFIC" ? undefined : BULK_FOOTER });
    await audit({ actorId: admin.id, action: "mail.send", entity: "SentMail", entityId: r.batchId, after: { from: p.from, audience: p.audience, recipients: recipients.length, sent: r.sent, subject: p.subject, attachments: files.length } });
    revalidatePath("/admin/mailbox");
    if (r.sent === 0) return { ok: false, error: `Nothing was sent. ${r.failed[0]?.error ?? ""}`.trim() };
    const tail = r.failed.length ? ` ${r.failed.length} could not be sent: ${r.failed.slice(0, 3).map((f) => f.to).join(", ")}${r.failed.length > 3 ? "…" : ""}. See the sent log for why.` : "";
    return { ok: true, message: `Sent to ${r.sent} ${r.sent === 1 ? "person" : "people"}.${tail}` };
  } catch (e) {
    return fail(e);
  }
}

export async function trashMailAction(folder: string, uid: number): Promise<Result> {
  try {
    await requireAdmin();
    await trashMail(folderSchema.parse(folder), z.number().int().positive().parse(uid));
    revalidatePath("/admin/mailbox");
    return { ok: true, message: folder === "trash" ? "Deleted for good." : "Moved to Trash." };
  } catch (e) {
    return fail(e);
  }
}

export async function setReadAction(folder: string, uid: number, read: boolean): Promise<Result> {
  try {
    await requireAdmin();
    await setMailRead(folderSchema.parse(folder), z.number().int().positive().parse(uid), read);
    revalidatePath("/admin/mailbox");
    return { ok: true, message: read ? "Marked as read." : "Marked as unread." };
  } catch (e) {
    return fail(e);
  }
}
