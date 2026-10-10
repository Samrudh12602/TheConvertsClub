"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { currentUser } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { ProfileError, addDocument, deleteDocument, removeAvatar, saveBasics, saveMentorAbout, saveStudentBackground, setAvatar } from "@/server/profile";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const fail = (e: unknown): Result => {
  if (e instanceof ProfileError) return { ok: false, error: e.message };
  if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Check what you entered." };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};

async function me(scope: string, ...roles: ("STUDENT" | "MENTOR" | "ADMIN")[]) {
  const user = await currentUser();
  if (!user) throw new ProfileError("Please sign in again.");
  if (roles.length && !roles.includes(user.role as "STUDENT" | "MENTOR" | "ADMIN")) throw new ProfileError("That isn't available for your account.");
  if (!(await rateLimit(`profile:${scope}:${user.id}`, 60, 600)).ok) throw new ProfileError("Too many changes. Slow down for a minute.");
  return user;
}
const refresh = (role: string) => { revalidatePath(`/${role.toLowerCase()}`, "layout"); };
const fileFrom = async (fd: FormData, key = "file") => { const f = fd.get(key); return f instanceof File && f.size > 0 ? { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) } : undefined; };

export async function saveBasicsAction(input: unknown): Promise<Result> {
  try { const u = await me("basics"); const given = input as { name?: string; phone?: string }; await saveBasics(u.id, { name: u.role === "MENTOR" ? (u.name ?? "") : (given.name ?? ""), phone: given.phone ?? "" }); refresh(u.role); return { ok: true, message: "Saved." }; } catch (e) { return fail(e); }
}
export async function uploadAvatarAction(fd: FormData): Promise<Result> {
  try { const u = await me("avatar"); const f = await fileFrom(fd); if (!f) throw new ProfileError("Choose a photo first."); await setAvatar(u.id, f); refresh(u.role); return { ok: true, message: "Photo updated." }; } catch (e) { return fail(e); }
}
export async function removeAvatarAction(): Promise<Result> {
  try { const u = await me("avatar"); await removeAvatar(u.id); refresh(u.role); return { ok: true, message: "Photo removed." }; } catch (e) { return fail(e); }
}
export async function saveStudentBackgroundAction(input: unknown): Promise<Result> {
  try { const u = await me("student-bg", "STUDENT"); await saveStudentBackground(u.id, input as never); refresh(u.role); return { ok: true, message: "Profile saved." }; } catch (e) { return fail(e); }
}
export async function saveMentorAboutAction(input: unknown): Promise<Result> {
  try { const u = await me("mentor-about", "MENTOR"); await saveMentorAbout(u.id, input as never); refresh(u.role); return { ok: true, message: "Saved." }; } catch (e) { return fail(e); }
}
export async function addProfileDocumentAction(fd: FormData): Promise<Result> {
  try {
    const u = await me("doc-add", "STUDENT", "MENTOR");
    const year = String(fd.get("year") ?? "");
    await addDocument(u.id, { kind: String(fd.get("kind") ?? "") as never, title: String(fd.get("title") ?? ""), year: year as never, score: String(fd.get("score") ?? ""), note: String(fd.get("note") ?? "") }, await fileFrom(fd));
    refresh(u.role);
    return { ok: true, message: "Added." };
  } catch (e) { return fail(e); }
}
export async function deleteProfileDocumentAction(id: string): Promise<Result> {
  try { const u = await me("doc-del", "STUDENT", "MENTOR"); await deleteDocument(u.id, String(id)); refresh(u.role); return { ok: true, message: "Removed." }; } catch (e) { return fail(e); }
}
