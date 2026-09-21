import { db } from "@/lib/db";

/** In-app notification (mirrors the important emails). Never throws. */
export async function notify(userId: string, n: { title: string; body?: string; href?: string }) {
  try {
    await db.notification.create({ data: { userId, ...n } });
  } catch (e) {
    console.error("notify failed", e);
  }
}
