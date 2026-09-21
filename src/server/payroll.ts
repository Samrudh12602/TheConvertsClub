import type { MentorTier, PayService, ReviewKind, SessionType } from "@/generated/prisma/client";

/** Pure payroll rules. DB-touching code lives in the actions that call these. */

export const serviceForSession = (t: SessionType): PayService | null =>
  ({ MOCK_PI: "PI", GD_BATCH: "GD", GUIDANCE: "GUIDANCE", STRATEGY_CALL: null } as const)[t];

export const serviceForReview = (k: ReviewKind): PayService => (k === "WAT" ? "WAT" : "SOP");

export type RateTable = Partial<Record<`${MentorTier}:${PayService}`, number>>;

export const rateKey = (tier: MentorTier, service: PayService) => `${tier}:${service}` as const;

/**
 * Snapshot of what a mentor earns for one item, taken at the moment feedback is submitted.
 * Returns null when there is no rate (that tier doesn't do that service), so nothing is silently paid at 0.
 */
export function accrualFor(tier: MentorTier, service: PayService, rates: RateTable): { amountPaise: number; rateSnapshotPaise: number } | null {
  const rate = rates[rateKey(tier, service)];
  return rate === undefined ? null : { amountPaise: rate, rateSnapshotPaise: rate };
}

export interface BonusRuleLite {
  id: string;
  tier: MentorTier;
  threshold: number;
  amountPaise: number;
  active: boolean;
}

/**
 * Cumulative milestone bonuses: every threshold the mentor has reached in the period is owed once.
 * `alreadyAwarded` holds rule ids already awarded for this mentor and period.
 */
export function bonusesDue(tier: MentorTier, mockCount: number, rules: BonusRuleLite[], alreadyAwarded: Set<string>): BonusRuleLite[] {
  return rules
    .filter((r) => r.active && r.tier === tier && mockCount >= r.threshold && !alreadyAwarded.has(r.id))
    .sort((a, b) => a.threshold - b.threshold);
}

/** Next unreached threshold, for the "48 of 50" progress bar. */
export function nextThreshold(tier: MentorTier, mockCount: number, rules: BonusRuleLite[]): BonusRuleLite | null {
  return rules.filter((r) => r.active && r.tier === tier && r.threshold > mockCount).sort((a, b) => a.threshold - b.threshold)[0] ?? null;
}

/** Period key: one per season, or one per IST calendar month. */
export function periodKey(period: "SEASON" | "MONTH", at: Date, seasonLabel = "season"): string {
  if (period === "SEASON") return seasonLabel;
  const ist = new Date(at.getTime() + 5.5 * 3_600_000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const overallScore = (scores: Record<string, number>): number => {
  const v = Object.values(scores);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0;
};
