import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { MAX_BYTES, MAX_PHOTO_BYTES, UploadError, sniffImage, sniffProfileFile } from "@/server/upload-validation";
import { basicsSchema, documentSchema, mentorAboutSchema, studentBackgroundSchema } from "@/lib/profile";

export class ProfileError extends Error {}
const MAX_DOCS = 20;

export interface UploadedFile { name: string; bytes: Uint8Array }

async function store(key: string, file: UploadedFile, mime: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ProfileError("File uploads aren't configured yet.");
  await put(key, Buffer.from(file.bytes), { access: "private", contentType: mime, addRandomSuffix: false });
}
const dropBlob = (key: string | null | undefined) => (key ? del(key).catch(() => undefined) : Promise.resolve());

export async function saveBasics(userId: string, input: z.input<typeof basicsSchema>) {
  const p = basicsSchema.parse(input);
  await db.user.update({ where: { id: userId }, data: { name: p.name, phone: p.phone } });
}

export async function setAvatar(userId: string, file: UploadedFile) {
  if (file.bytes.byteLength === 0) throw new ProfileError("That file is empty.");
  if (file.bytes.byteLength > MAX_PHOTO_BYTES) throw new ProfileError("Photos can be up to 5 MB.");
  let ext: string, mime: string;
  try { ({ ext, mime } = sniffImage(file.name, file.bytes)); } catch (e) { throw e instanceof UploadError ? new ProfileError(e.message) : e; }
  const key = `avatars/${userId}/${randomUUID()}${ext}`;
  await store(key, file, mime);
  const old = await db.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  await db.user.update({ where: { id: userId }, data: { avatarKey: key } });
  await dropBlob(old?.avatarKey);
}

export async function removeAvatar(userId: string) {
  const old = await db.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  await db.user.update({ where: { id: userId }, data: { avatarKey: null } });
  await dropBlob(old?.avatarKey);
}

export async function saveStudentBackground(userId: string, input: z.input<typeof studentBackgroundSchema>) {
  const p = studentBackgroundSchema.parse(input);
  const data = {
    dob: p.dob, state: p.state, city: p.city ?? null, examsAppearing: p.examsAppearing,
    tenthBoard: p.tenthBoard ?? null, tenthPercent: p.tenthPercent ?? null, tenthYear: p.tenthYear ?? null,
    twelfthBoard: p.twelfthBoard ?? null, twelfthStream: p.twelfthStream ?? null, twelfthPercent: p.twelfthPercent ?? null, twelfthYear: p.twelfthYear ?? null,
    college: p.college ?? null, degree: p.degree ?? null, gradYear: p.gradYear ?? null, gradScore: p.gradScore ?? null,
    workExMonths: p.workExMonths ?? null, company: p.company ?? null, jobRole: p.jobRole ?? null, industry: p.industry ?? null, about: p.about ?? null,
  };
  await db.studentProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

export async function saveMentorAbout(userId: string, input: z.input<typeof mentorAboutSchema>) {
  const p = mentorAboutSchema.parse(input);
  const m = await db.mentorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!m) throw new ProfileError("No mentor profile found.");
  await db.mentorProfile.update({ where: { id: m.id }, data: { convertedInstitutes: p.convertedInstitutes, examScores: p.examScores ?? null, company: p.company ?? null, jobRole: p.jobRole ?? null } });
}

/** Adds a call letter, admit letter or result. The file is optional for a result (a score alone is fine) and private either way. */
export async function addDocument(userId: string, input: z.input<typeof documentSchema>, file?: UploadedFile) {
  const p = documentSchema.parse(input);
  if ((await db.profileDocument.count({ where: { userId } })) >= MAX_DOCS) throw new ProfileError(`You can keep up to ${MAX_DOCS} documents. Remove one to add another.`);
  let fileData: { fileKey: string; fileName: string; contentType: string; sizeBytes: number } | null = null;
  if (file && file.bytes.byteLength > 0) {
    if (file.bytes.byteLength > MAX_BYTES) throw new ProfileError("Files can be up to 5 MB.");
    let ext: string, mime: string;
    try { ({ ext, mime } = sniffProfileFile(file.name, file.bytes)); } catch (e) { throw e instanceof UploadError ? new ProfileError(e.message) : e; }
    const key = `profile-docs/${userId}/${randomUUID()}${ext}`;
    await store(key, file, mime);
    fileData = { fileKey: key, fileName: file.name.slice(0, 120), contentType: mime, sizeBytes: file.bytes.byteLength };
  }
  const row = await db.profileDocument.create({ data: { userId, kind: p.kind, title: p.title, year: p.year ?? null, score: p.score ?? null, note: p.note ?? null, ...(fileData ?? {}) } });
  await audit({ actorId: userId, action: "profile.doc_add", entity: "ProfileDocument", entityId: row.id, after: { kind: p.kind, hasFile: Boolean(fileData) } });
  return row;
}

export async function deleteDocument(userId: string, id: string) {
  const d = await db.profileDocument.findUnique({ where: { id } });
  if (!d || d.userId !== userId) throw new ProfileError("That document wasn't found.");
  await db.profileDocument.delete({ where: { id } });
  await dropBlob(d.fileKey);
  await audit({ actorId: userId, action: "profile.doc_delete", entity: "ProfileDocument", entityId: id });
}
