import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type Json = Prisma.InputJsonValue;

/** Every admin action (and every "view as" use) is written here. Never throws: auditing must not break the action. */
export async function audit(entry: {
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  before?: Json;
  after?: Json;
  ip?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        before: entry.before,
        after: entry.after,
        ip: entry.ip ?? null,
      },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
