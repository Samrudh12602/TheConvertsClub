import { formatPaise } from "@/lib/money";

/**
 * Product catalog. This is the shape of the Prisma `Product` + `ProductCredit` seed (Phase 1/2);
 * pages read it only through the functions below so swapping in the database is a one-file change.
 * Prices are integer paise. Never trust a price sent from the client - the server re-reads this.
 */

export type CreditKind =
  | "PI"
  | "GD"
  | "WAT"
  | "SOP_BASIC"
  | "SOP_DETAILED"
  | "SOP_REVISION"
  | "STRATEGY"
  | "GUIDANCE";

export interface Credit {
  kind: CreditKind;
  quantity: number;
}

export interface CatalogProduct {
  slug: string;
  name: string;
  kind: "BUNDLE" | "SINGLE";
  pricePaise: number;
  mrpPaise: number | null;
  /** While now < earlyBirdEndsAt the price is pricePaise; afterwards it reverts to mrpPaise. */
  earlyBirdEndsAt: Date | null;
  /** Only purchasable from inside the student portal by an enrolled student. */
  enrolledOnly: boolean;
  credits: Credit[];
  /** One-line description for grids. */
  summary: string;
  /** Marketing bullet list for bundle cards. */
  includes: string[];
  badge?: string;
}

export const FEATURED_SLUG = "call-convert";

export interface PriceView {
  /** What the buyer pays. */
  payablePaise: number;
  /** The struck-through list price, when a discount is showing. */
  strikePaise: number | null;
  discountPaise: number;
  earlyBirdActive: boolean;
  earlyBirdEndsAt: Date | null;
}

export function priceView(p: CatalogProduct, now: Date = new Date()): PriceView {
  const earlyBirdActive = p.earlyBirdEndsAt !== null && now < p.earlyBirdEndsAt;
  const expired = p.earlyBirdEndsAt !== null && !earlyBirdActive;
  const payablePaise = expired && p.mrpPaise !== null ? p.mrpPaise : p.pricePaise;
  const strikePaise = p.mrpPaise !== null && payablePaise < p.mrpPaise ? p.mrpPaise : null;
  return {
    payablePaise,
    strikePaise,
    discountPaise: strikePaise !== null ? strikePaise - payablePaise : 0,
    earlyBirdActive,
    earlyBirdEndsAt: earlyBirdActive ? p.earlyBirdEndsAt : null,
  };
}

const LABELS: Record<CreditKind, { long: [string, string]; short: [string, string] }> = {
  PI: { long: ["mock PI", "mock PIs"], short: ["Mock PI", "Mock PI"] },
  GD: { long: ["GD/GE batch", "GD/GE batches"], short: ["GD/GE", "GD/GE"] },
  WAT: { long: ["WAT evaluation", "WAT evaluations"], short: ["WAT", "WAT"] },
  SOP_BASIC: { long: ["basic SOP review", "basic SOP reviews"], short: ["basic SOP", "basic SOP"] },
  SOP_DETAILED: {
    long: ["detailed SOP review", "detailed SOP reviews"],
    short: ["detailed SOP", "detailed SOP"],
  },
  SOP_REVISION: { long: ["SOP revision", "SOP revisions"], short: ["SOP revision", "SOP revision"] },
  STRATEGY: { long: ["strategy call", "strategy calls"], short: ["strategy call", "strategy call"] },
  GUIDANCE: { long: ["guidance call", "guidance calls"], short: ["guidance call", "guidance call"] },
};

/** "4 mock PIs" (long) or "4 Mock PI" (short chip). */
export function describeCredit(c: Credit, style: "long" | "short" = "long"): string {
  const [one, many] = LABELS[c.kind][style];
  return `${c.quantity} ${c.quantity === 1 ? one : many}`;
}

/** "From ₹99" style label for a set of products, or the single price. */
export function priceRangeLabel(products: CatalogProduct[], now: Date = new Date()): string {
  if (products.length === 0) return "—";
  const prices = products.map((p) => priceView(p, now).payablePaise).sort((a, b) => a - b);
  return prices.length > 1 ? prices.map(formatPaise).join(" / ") : formatPaise(prices[0]);
}
