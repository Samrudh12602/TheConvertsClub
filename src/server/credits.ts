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

export interface CreditSummary {
  /** Total ever granted (purchases + admin adjustments), net of any negative adjustment. */
  granted: number;
  /** Free to spend right now. */
  available: number;
  /** Held by an active booking or in-review submission. */
  reserved: number;
  /** Used up (completed session, late cancel, no-show, or a consumed review). */
  used: number;
}

/**
 * Full picture per credit kind: granted, available, held and used. Kinds are never merged or
 * interchangeable — a PI credit can never cover a GD or WAT, so this always reports them separately.
 * used = granted - available - reserved (CONSUME removes from reserved without returning it to available).
 */
export async function getCreditSummary(tx: Tx, userId: string): Promise<Partial<Record<CreditKind, CreditSummary>>> {
  const [grants, balances] = await Promise.all([
    tx.creditLedger.groupBy({ by: ["kind"], where: { userId, type: { in: ["GRANT", "ADJUST"] } }, _sum: { delta: true } }),
    getBalances(tx, userId),
  ]);
  const out: Partial<Record<CreditKind, CreditSummary>> = {};
  for (const g of grants) {
    const granted = g._sum.delta ?? 0;
    const bal = balances[g.kind] ?? { available: 0, reserved: 0 };
    out[g.kind] = { granted, available: bal.available, reserved: bal.reserved, used: Math.max(0, granted - bal.available - bal.reserved) };
  }
  for (const kind of Object.keys(balances) as CreditKind[]) {
    if (!out[kind]) {
      const bal = balances[kind]!;
      out[kind] = { granted: bal.available + bal.reserved, available: bal.available, reserved: bal.reserved, used: 0 };
    }
  }
  return out;
}

export interface EnrollmentCredits {
  enrollmentId: string;
  productSlug: string;
  productName: string;
  purchasedAt: Date;
  status: "ACTIVE" | "REFUNDED";
  /** Exactly what this one purchase granted — never merged with credits from another purchase. */
  credits: { kind: CreditKind; quantity: number }[];
}

/** Every enrollment (course/service purchased) with exactly what it granted, oldest first. */
export async function getEnrollmentBreakdown(db: PrismaClient, userId: string): Promise<EnrollmentCredits[]> {
  const rows = await db.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { product: { include: { credits: true } } },
  });
  return rows.map((e) => ({
    enrollmentId: e.id,
    productSlug: e.product.slug,
    productName: e.product.name,
    purchasedAt: e.createdAt,
    status: e.status,
    credits: e.product.credits.map((c) => ({ kind: c.kind, quantity: c.quantity })),
  }));
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
