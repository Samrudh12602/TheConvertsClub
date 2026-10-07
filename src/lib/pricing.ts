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
  | "GUIDANCE"
  | "PI_DIRECT"
  | "STRATEGY_DIRECT"
  | "TRIAL_GUIDANCE"
  | "TRIAL_PI";

export interface Credit {
  kind: CreditKind;
  quantity: number;
}

/** Early-bird: while seats remain, the product sells at `pricePaise` instead of its normal price. */
export interface EarlyBird { pricePaise: number; limit: number; seatsLeft: number }

export interface CatalogProduct {
  slug: string;
  name: string;
  kind: "BUNDLE" | "SINGLE";
  pricePaise: number;
  mrpPaise: number | null;
  /** Exact price a mentor's own coupon charges for this product, when set. Null means a mentor
   * coupon just applies its normal discount (e.g. 10% off pricePaise) here, like anywhere else. */
  mentorPricePaise: number | null;
  /** Only purchasable from inside the student portal by an enrolled student. */
  enrolledOnly: boolean;
  /** Taken directly by the owner: the owner is emailed on purchase, mentor referral codes don't apply, and enrolled students see it in their Top-up shop. */
  withAdmin: boolean;
  /** Set when the product has an early-bird offer (null/absent otherwise). seatsLeft is read fresh, not cached. */
  earlyBird?: EarlyBird | null;
  credits: Credit[];
  /** One-line description for grids. */
  summary: string;
  /** Marketing bullet list for bundle cards. */
  includes: string[];
  badge?: string;
}

export const FEATURED_SLUG = "call-convert";

export interface PriceView {
  /** What the buyer pays with no coupon. */
  payablePaise: number;
  /** The struck-through MRP, shown whenever it's higher than payablePaise. */
  strikePaise: number | null;
}

/**
 * Three tiers, at most: MRP (struck through, if set and higher) -> pricePaise (what's shown and
 * charged by default, no coupon needed) -> a mentor's own coupon, which can push the price down
 * further still (see checkCoupon). Nothing here is time-limited or enrollment-gated — that's set
 * per product by admin (pricePaise itself, e.g. Additional PI's enrolled price; enrolledOnly is a
 * separate, unrelated gate on who can even buy it).
 */
export function priceView(p: CatalogProduct): PriceView {
  // Early bird: the normal price is shown struck through and the buyer pays the early-bird price, until the seats run out.
  if (p.earlyBird && p.earlyBird.seatsLeft > 0 && p.earlyBird.pricePaise < p.pricePaise) return { payablePaise: p.earlyBird.pricePaise, strikePaise: p.pricePaise };
  const strikePaise = p.mrpPaise !== null && p.mrpPaise > p.pricePaise ? p.mrpPaise : null;
  return { payablePaise: p.pricePaise, strikePaise };
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
  PI_DIRECT: { long: ["PI with Samrudh", "PIs with Samrudh"], short: ["PI with Samrudh", "PI with Samrudh"] },
  STRATEGY_DIRECT: { long: ["strategy call with Samrudh", "strategy calls with Samrudh"], short: ["Strategy with Samrudh", "Strategy with Samrudh"] },
  TRIAL_GUIDANCE: { long: ["trial guidance call", "trial guidance calls"], short: ["Trial guidance", "Trial guidance"] },
  TRIAL_PI: { long: ["trial mock PI", "trial mock PIs"], short: ["Trial mock PI", "Trial mock PI"] },
};

/** "4 mock PIs" (long) or "4 Mock PI" (short chip). */
export function describeCredit(c: Credit, style: "long" | "short" = "long"): string {
  const [one, many] = LABELS[c.kind][style];
  return `${c.quantity} ${c.quantity === 1 ? one : many}`;
}

/** "From ₹99" style label for a set of products, or the single price. */
export function priceRangeLabel(products: CatalogProduct[]): string {
  if (products.length === 0) return "—";
  const prices = products.map((p) => priceView(p).payablePaise).sort((a, b) => a - b);
  return prices.length > 1 ? prices.map(formatPaise).join(" / ") : formatPaise(prices[0]);
}

export interface CouponLite {
  type: "PERCENT" | "FLAT";
  /** Percent (1-100) or flat paise. */
  value: number;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  /** Set only for a mentor's own coupon — see `mentorPricePaise` below. */
  mentorId?: string | null;
}

export type CouponCheck = { ok: true; discountPaise: number } | { ok: false; reason: string };

/** Razorpay's minimum charge is ₹1, so a coupon can never take an order below 100 paise. */
export const MIN_CHARGE_PAISE = 100;

/**
 * `mentorPricePaise`: when this coupon belongs to a mentor AND the product being bought has one set,
 * the discount is whatever gets the order to exactly that price — not the coupon's own percent/flat
 * value. Lets one mentor coupon charge a specific target price on, say, Call Convert, while still
 * applying its normal percent everywhere else.
 */
export function checkCoupon(c: CouponLite | null, payablePaise: number, now: Date = new Date(), mentorPricePaise: number | null = null): CouponCheck {
  if (!c || !c.active) return { ok: false, reason: "That code isn't valid." };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, reason: "That code has expired." };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { ok: false, reason: "That code has been fully used." };
  // A mentor's referral code is a flagship-programs-only discount: it works on a product only when admin has set a
  // "mentor code price" for it. Every other product is already priced to leave room for mentor pay, so it never discounts.
  if (c.mentorId && mentorPricePaise === null) return { ok: false, reason: "Mentor codes apply to Call Convert and Call Convert Plus only." };
  const raw = c.mentorId && mentorPricePaise !== null
    ? payablePaise - mentorPricePaise
    : c.type === "PERCENT" ? Math.floor((payablePaise * Math.min(100, Math.max(0, c.value))) / 100 / 100) * 100 : c.value; // whole rupees, never ₹539.10
  const discountPaise = Math.max(0, Math.min(raw, payablePaise - MIN_CHARGE_PAISE));
  return discountPaise > 0 ? { ok: true, discountPaise } : { ok: false, reason: "That code doesn't apply to this order." };
}
