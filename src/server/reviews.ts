import type { ReviewKind } from "@/generated/prisma/client";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-db";
import { HOUR } from "@/server/scheduling";
import { lockUser, reserveCredit, reviewCreditKind, InsufficientCreditsError } from "@/server/credits";
import { serviceForReview } from "@/server/payroll";
import { notify } from "@/server/notify";

import { MAX_BYTES, ReviewError, sniff } from "@/server/upload-validation";

export { ReviewError };

/** Least-loaded eligible mentor: must have a pay rate for the service (so SOPs go to Seniors), never the Admin's own mentor mode. */
async function pickReviewer(kind: ReviewKind) {
  const service = serviceForReview(kind);
  const rates = await db.payRate.findMany({ where: { service } });
  const tiers = rates.map((r) => r.tier);
  const mentors = await db.mentorProfile.findMany({ where: { status: "ACTIVE", isAdminMentor: false, tier: { in: tiers } }, select: { id: true } });
  if (!mentors.length) return null;
  const load = await db.review.groupBy({ by: ["assignedMentorId"], where: { assignedMentorId: { in: mentors.map((m) => m.id) }, status: "ASSIGNED" }, _count: true });
  const l = new Map(load.map((x) => [x.assignedMentorId, x._count]));
  return mentors.sort((a, b) => (l.get(a.id) ?? 0) - (l.get(b.id) ?? 0) || a.id.localeCompare(b.id))[0].id;
}

export async function createReview(studentId: string, kind: ReviewKind, input: { file?: { name: string; bytes: Uint8Array }; text?: string; title?: string }) {
  const settings = await getSettings();
  let fileKey: string | undefined;
  let fileName: string | undefined;
  if (input.file) {
    if (input.file.bytes.byteLength > MAX_BYTES) throw new ReviewError("Files can be up to 5 MB.");
    if (input.file.bytes.byteLength === 0) throw new ReviewError("That file is empty.");
    const { ext, mime } = sniff(input.file.name, input.file.bytes);
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ReviewError("File uploads aren't configured yet. Paste your text instead.");
    fileKey = `reviews/${studentId}/${randomUUID()}${ext}`;
    fileName = input.file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
    await put(fileKey, Buffer.from(input.file.bytes), { access: "private", contentType: mime, addRandomSuffix: false });
  } else if (!input.text || input.text.trim().length < 50) {
    throw new ReviewError("Paste at least a few sentences, or attach a file.");
  }
  const mentorId = await pickReviewer(kind);
  try {
    const review = await db.$transaction(async (tx) => {
      await lockUser(tx, studentId);
      const r = await tx.review.create({
        data: { studentId, kind, title: input.title, fileKey, fileName, textBody: input.text?.trim().slice(0, 20_000), assignedMentorId: mentorId, status: mentorId ? "ASSIGNED" : "SUBMITTED", dueAt: new Date(Date.now() + settings.feedbackDueHours * HOUR) },
      });
      await reserveCredit(tx, { userId: studentId, kind: reviewCreditKind(kind), reviewId: r.id });
      return r;
    });
    if (mentorId) {
      const m = await db.mentorProfile.findUnique({ where: { id: mentorId } });
      if (m) await notify(m.userId, { title: `New ${kind === "WAT" ? "WAT" : "SOP"} to review`, href: "/mentor/reviews" });
    }
    return review;
  } catch (e) {
    if (e instanceof InsufficientCreditsError) throw new ReviewError("You have no credit left for this. You can buy one on the Payments page.");
    throw e;
  }
}
