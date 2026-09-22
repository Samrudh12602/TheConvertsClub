import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import type { MentorTier } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { assertConfigWritable, type Actor } from "@/server/admin";
import { createLoginLink } from "@/server/magic-link";
import { sendEmail } from "@/server/email";
import { MAX_PHOTO_BYTES, sniffImage, UploadError } from "@/server/upload-validation";

export class MentorAdminError extends Error {}

export interface PhotoFile {
  name: string;
  bytes: Uint8Array;
}

/** Validates and stores a photo in the private Blob store. Never public-by-URL: served through
 * /api/mentor-photo/[mentorId] (mentors, no auth) or /api/files/applications/[id] (applications, admin-only). */
async function uploadPhoto(pathPrefix: string, file: PhotoFile): Promise<string> {
  if (file.bytes.byteLength > MAX_PHOTO_BYTES) throw new MentorAdminError("Photos can be up to 5 MB.");
  if (file.bytes.byteLength === 0) throw new MentorAdminError("That file is empty.");
  let ext: string, mime: string;
  try {
    ({ ext, mime } = sniffImage(file.name, file.bytes));
  } catch (e) {
    throw e instanceof UploadError ? new MentorAdminError(e.message) : e;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new MentorAdminError("File uploads aren't configured yet.");
  const key = `${pathPrefix}/${randomUUID()}${ext}`;
  await put(key, Buffer.from(file.bytes), { access: "private", contentType: mime, addRandomSuffix: false });
  return key;
}

export interface AddMentorInput {
  name: string;
  email: string;
  tier: MentorTier;
  college?: string;
  batchYear?: number;
  bio?: string;
  meetingUrl?: string;
  linkedinUrl?: string;
  /** Used only if no photo file is given. */
  photoUrl?: string;
  photo?: PhotoFile;
}

/**
 * Admin adds a mentor directly — creates the account and profile immediately, no invite email or
 * token to wait on. The mentor logs in the normal way (Google or email link) whenever they're ready;
 * this just means the account and their public profile already exist.
 */
export async function addMentorDirect(actor: Actor, input: AddMentorInput) {
  assertConfigWritable(actor, "adding a mentor");
  const email = input.email.trim().toLowerCase();
  if (!email) throw new MentorAdminError("Enter an email address.");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new MentorAdminError("A user with that email already exists. Use “Invite by email” instead, or edit their profile if they're already a mentor.");

  const photoKey = input.photo ? await uploadPhoto("mentors", input.photo) : undefined;

  const { user, mentor } = await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, name: input.name.trim(), role: "MENTOR" } });
    const mentor = await tx.mentorProfile.create({
      data: {
        userId: user.id,
        tier: input.tier,
        college: input.college?.trim() || null,
        batchYear: input.batchYear ?? null,
        bio: input.bio?.trim() || null,
        meetingUrl: input.meetingUrl?.trim() || null,
        linkedinUrl: input.linkedinUrl?.trim() || null,
        photoKey,
        photoUrl: photoKey ? null : input.photoUrl?.trim() || null,
        status: "ACTIVE",
      },
    });
    return { user, mentor };
  });

  try {
    const link = await createLoginLink(email, "/mentor");
    await sendEmail({ template: "mentor_added", to: email, url: link });
  } catch (e) {
    console.error("mentor_added email failed", e);
  }
  await audit({ actorId: actor.id, action: "mentor.added_direct", entity: "MentorProfile", entityId: mentor.id, after: { email, tier: input.tier } });
  return { userId: user.id, mentorId: mentor.id };
}

/**
 * Turns an application into a mentor account, carrying over the photo they submitted (same private
 * Blob object, no re-upload) and their LinkedIn. Sends the same "your account is ready" email as a
 * direct add, so they can log in immediately without a separate invite token.
 */
export async function promoteApplication(actor: Actor, applicationId: string, tier: MentorTier) {
  assertConfigWritable(actor, "promoting an application");
  const app = await db.mentorApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new MentorAdminError("Application not found.");
  if (app.promotedMentorId) throw new MentorAdminError("This application was already promoted.");
  const email = app.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new MentorAdminError("A user with that email already exists.");

  const { user, mentor } = await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, name: app.name, phone: app.phone, role: "MENTOR" } });
    const mentor = await tx.mentorProfile.create({
      data: {
        userId: user.id,
        tier,
        college: app.institute,
        linkedinUrl: app.linkedinUrl,
        photoKey: app.photoKey,
        status: "ACTIVE",
      },
    });
    await tx.mentorApplication.update({ where: { id: applicationId }, data: { stage: "ACCEPTED", promotedMentorId: mentor.id } });
    return { user, mentor };
  });

  try {
    const link = await createLoginLink(email, "/mentor");
    await sendEmail({ template: "mentor_added", to: email, url: link });
  } catch (e) {
    console.error("mentor_added email failed", e);
  }
  await audit({ actorId: actor.id, action: "application.promoted", entity: "MentorApplication", entityId: applicationId, after: { mentorId: mentor.id, tier } });
  return { userId: user.id, mentorId: mentor.id };
}

export interface SubmitApplicationInput {
  name: string;
  email: string;
  phone: string;
  institute: string;
  callsConverted: string;
  hoursPerWeek: number;
  linkedinUrl: string;
  photo: PhotoFile;
}

/** Public application submission (no auth). The photo is stored privately — only Admin can view it
 * until (and unless) the applicant is promoted to a public mentor. */
export async function submitApplication(input: SubmitApplicationInput) {
  const photoKey = await uploadPhoto("applications", input.photo);
  const app = await db.mentorApplication.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      institute: input.institute.trim(),
      callsConverted: input.callsConverted.trim(),
      hoursPerWeek: input.hoursPerWeek,
      linkedinUrl: input.linkedinUrl.trim(),
      photoKey,
      photoFileName: input.photo.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120),
    },
  });
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  const { notify } = await import("@/server/notify");
  for (const a of admins) await notify(a.id, { title: `New mentor application: ${app.name}`, href: "/admin/applications" });
  return app;
}
