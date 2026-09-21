import type { CreditKind, LedgerType, Prisma, PrismaClient, ReviewKind, SessionType } from "@/generated/prisma/client";

export type Tx = Prisma.TransactionClient | PrismaClient;

export class InsufficientCreditsError extends Error {
  constructor(public kind: CreditKind) {
    super(`No ${kind} credit available`);
  }
}

export const sessionCreditKind = (t: SessionType): CreditKind =>
  ({ MOCK_PI: "PI", STRATEGY_CALL: "STRATEGY", GUIDANCE: "GUIDANCE", GD_BATCH: "GD" } as const)[t];

export const reviewCreditKind = (k: ReviewKind): CreditKind =>
  ({ WAT: "WAT", SOP_BASIC: "SOP_BASIC", SOP_DETAILED: "SOP_DETAILED" } as const)[k];

export interface Balance {
  available: number;
  reserved: number;
}

/** Pure: fold ledger rows into balances per kind. */
export function foldLedger(rows: { kind: CreditKind; delta: number; reservedDelta: number }[]): Partial<Record<CreditKind, Balance>> {
  const out: Partial<Record<CreditKind, Balance>> = {};
  for (const r of rows) {
    const b = (out[r.kind] ??= { available: 0, reserved: 0 });
    b.available += r.delta;
    b.reserved += r.reservedDelta;
  }
  return out;
}

export async function getBalances(tx: Tx, userId: string) {
  const rows = await tx.creditLedger.groupBy({
    by: ["kind"],
    where: { userId },
    _sum: { delta: true, reservedDelta: true },
  });
  return foldLedger(rows.map((r) => ({ kind: r.kind, delta: r._sum.delta ?? 0, reservedDelta: r._sum.reservedDelta ?? 0 })));
}

/** Serialise all credit movements for one student so two concurrent bookings can never double-spend. */
export async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
}

interface Entry {
  userId: string;
  kind: CreditKind;
  type: LedgerType;
  delta: number;
  reservedDelta?: number;
  enrollmentId?: string;
  sessionId?: string;
  reviewId?: string;
  reason?: string;
  createdById?: string;
}

const write = (tx: Tx, e: Entry) => tx.creditLedger.create({ data: { reservedDelta: 0, ...e } });

export const grantCredit = (tx: Tx, a: { userId: string; kind: CreditKind; quantity: number; enrollmentId?: string; reason?: string }) =>
  write(tx, { userId: a.userId, kind: a.kind, type: "GRANT", delta: a.quantity, enrollmentId: a.enrollmentId, reason: a.reason });

/** Must run inside a transaction that already called lockUser(). */
export async function reserveCredit(tx: Prisma.TransactionClient, a: { userId: string; kind: CreditKind; sessionId?: string; reviewId?: string }) {
  const bal = (await getBalances(tx, a.userId))[a.kind];
  if (!bal || bal.available < 1) throw new InsufficientCreditsError(a.kind);
  return write(tx, { ...a, type: "RESERVE", delta: -1, reservedDelta: 1 });
}

/** Reserved credit is used up (session completed, late cancel or no-show). */
export const consumeCredit = (tx: Tx, a: { userId: string; kind: CreditKind; sessionId?: string; reviewId?: string; reason?: string }) =>
  write(tx, { ...a, type: "CONSUME", delta: 0, reservedDelta: -1 });

/** Reserved credit goes back to available (cancelled with enough notice, or hold expired). */
export const releaseCredit = (tx: Tx, a: { userId: string; kind: CreditKind; sessionId?: string; reviewId?: string; reason?: string }) =>
  write(tx, { ...a, type: "RELEASE", delta: 1, reservedDelta: -1 });

/** Admin correction. Reason is mandatory. */
export const adjustCredit = (tx: Tx, a: { userId: string; kind: CreditKind; delta: number; reason: string; createdById: string }) =>
  write(tx, { ...a, type: "ADJUST" });
