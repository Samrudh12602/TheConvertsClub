import { cache } from "react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { LEGAL_VERSION, missingDocs, requiredDocsFor, type LegalDocKey } from "@/lib/legal";

export type AcceptanceSource = "signup" | "checkout" | "gate" | "invite";

/** Who and from where, for the acceptance record. Best-effort; never blocks an acceptance. */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/** Writes one row per document. Re-accepting the same version is a no-op, so the first record is the one that stands. */
export async function recordAcceptance(a: { userId: string; docs: LegalDocKey[]; source: AcceptanceSource; ip?: string | null; userAgent?: string | null; at?: Date; version?: string }) {
  if (a.docs.length === 0) return;
  await db.legalAcceptance.createMany({
    data: a.docs.map((document) => ({ userId: a.userId, document, version: a.version ?? LEGAL_VERSION, source: a.source, ip: a.ip ?? null, userAgent: a.userAgent ?? null, ...(a.at ? { acceptedAt: a.at } : {}) })),
    skipDuplicates: true,
  });
}

const acceptedNow = cache((userId: string) => db.legalAcceptance.findMany({ where: { userId, version: LEGAL_VERSION }, select: { document: true, version: true } }));

/** The documents this user still has to accept at the current version. Demo accounts and admins are never asked. */
export async function outstandingDocs(user: { id: string; role: string; isDemo: boolean }): Promise<LegalDocKey[]> {
  if (user.isDemo || !requiredDocsFor(user.role)) return [];
  return missingDocs(user.role, await acceptedNow(user.id));
}

export async function hasAcceptedCurrent(user: { id: string; role: string; isDemo: boolean }): Promise<boolean> {
  return (await outstandingDocs(user)).length === 0;
}
