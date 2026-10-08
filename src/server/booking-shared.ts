import { db } from "@/lib/db";

export class BookingError extends Error {
  constructor(message: string, public code: "NO_CREDIT" | "TAKEN" | "HOLD_EXPIRED" | "NOT_ALLOWED" | "NOT_FOUND" | "POLICY") {
    super(message);
  }
}

export const now = () => new Date();
export const openOrExpiredHold = (t: Date) => ({ OR: [{ status: "OPEN" as const }, { status: "HELD" as const, heldUntil: { lt: t } }] });

/** Real students are only ever matched to real mentors, and demo students to demo mentors. */
export const isDemoStudent = async (client: Pick<typeof db, "user">, studentId: string) => Boolean((await client.user.findUnique({ where: { id: studentId }, select: { isDemo: true } }))?.isDemo);
