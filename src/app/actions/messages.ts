"use server";

import { revalidatePath } from "next/cache";
import { rateLimit } from "@/server/ratelimit";
import { audit } from "@/server/audit";
import { MessageError, sendMessage } from "@/server/messages";
import { currentUser } from "@/server/session";

export type MessageResult = { ok: true } | { ok: false; error: string };

export async function sendMessageAction(_prev: MessageResult | null, formData: FormData): Promise<MessageResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "You need to be signed in." };
  if (!(await rateLimit(`message:${user.id}`, 20, 600)).ok) return { ok: false, error: "You're sending messages too fast. Wait a few minutes." };
  const toUserId = String(formData.get("toUserId") ?? "") || undefined;
  try {
    await sendMessage({ id: user.id, name: user.name, role: user.role, isDemo: user.isDemo }, { body: String(formData.get("body") ?? ""), toUserId });
    await audit({ actorId: user.id, action: "message.send", entity: "User", entityId: toUserId ?? user.id });
    revalidatePath("/student/messages");
    revalidatePath("/mentor/messages");
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch (e) {
    if (e instanceof MessageError) return { ok: false, error: e.message };
    console.error("sendMessageAction failed", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
