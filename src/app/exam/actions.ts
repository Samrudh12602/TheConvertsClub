"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/server/session";
import { rateLimit } from "@/server/ratelimit";
import { MockError, addTime, recordTabSwitch, saveResponse, startAttempt, submitAttempt } from "@/server/mocks";

type Ok<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (e: unknown): { ok: false; error: string } => {
  if (e instanceof MockError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};
const id = z.string().min(1).max(40);

async function guard(scope: string, limit = 900) {
  const user = await requireStudent();
  // An exam saves after every question, so this is generous: it only stops runaway loops.
  if (!(await rateLimit(`exam:${scope}:${user.id}`, limit, 600)).ok) throw new MockError("Too many requests. Slow down for a moment.");
  return user;
}

export async function startExamAction(slug: string): Promise<Ok<{ attemptId: string }>> {
  try {
    const user = await guard("start", 30);
    const a = await startAttempt(user.id, z.string().min(1).max(80).parse(slug));
    revalidatePath("/student", "layout");
    return { ok: true, attemptId: a.id };
  } catch (e) { return fail(e); }
}

const saveSchema = z.object({ questionId: id, choice: z.number().int().min(0).max(5).nullable(), marked: z.boolean(), timeSecDelta: z.number().min(0).max(3600).optional() });

export async function saveAnswerAction(attemptId: string, input: z.infer<typeof saveSchema>): Promise<Ok> {
  try { const user = await guard("save"); await saveResponse(user.id, id.parse(attemptId), saveSchema.parse(input)); return { ok: true }; } catch (e) { return fail(e); }
}

export async function addTimeAction(attemptId: string, questionId: string, seconds: number): Promise<Ok> {
  try { const user = await guard("time"); await addTime(user.id, id.parse(attemptId), id.parse(questionId), z.number().min(0).max(3600).parse(seconds)); return { ok: true }; } catch (e) { return fail(e); }
}

export async function tabSwitchAction(attemptId: string): Promise<Ok> {
  try { const user = await guard("tab", 120); await recordTabSwitch(user.id, id.parse(attemptId)); return { ok: true }; } catch (e) { return fail(e); }
}

export async function submitExamAction(attemptId: string): Promise<Ok> {
  try {
    const user = await guard("submit", 30);
    await submitAttempt(user.id, id.parse(attemptId));
    revalidatePath("/student", "layout");
    return { ok: true };
  } catch (e) { return fail(e); }
}
