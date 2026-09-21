import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/** Fixed-window limiter backed by Postgres (one atomic upsert). Use for login, booking and checkout. */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const resetAt = new Date(Date.now() + windowSec * 1000);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>(Prisma.sql`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`);
  const { count, resetAt: until } = rows[0];
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt: until };
}
