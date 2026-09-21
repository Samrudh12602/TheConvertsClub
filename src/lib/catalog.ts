import { formatPaise, rupeesToPaise as r } from "@/lib/money";

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

// 31 January 2027, end of day IST.
const EARLY_BIRD_END = new Date("2027-01-31T23:59:59+05:30");

const PRODUCTS: CatalogProduct[] = [
  {
    slug: "call-convert-plus",
    name: "Call Convert Plus",
    kind: "BUNDLE",
    pricePaise: r(2999),
    mrpPaise: r(4999),
    earlyBirdEndsAt: EARLY_BIRD_END,
    enrolledOnly: false,
    credits: [
      { kind: "PI", quantity: 6 },
      { kind: "GD", quantity: 3 },
      { kind: "WAT", quantity: 2 },
      { kind: "SOP_DETAILED", quantity: 1 },
      { kind: "SOP_REVISION", quantity: 1 },
      { kind: "STRATEGY", quantity: 2 },
    ],
    summary: "6 PI, 3 GD, 2 WAT, SOP + revision, 2 strategy calls, deep dossier.",
    includes: [
      "6 mock PIs including institute-final rounds",
      "3 GD/GE batches",
      "2 WAT evaluations",
      "1 detailed SOP review plus one revision",
      "2 strategy calls",
      "Deep dossier per institute, multi-college prep",
    ],
    badge: "Multiple calls",
  },
  {
    slug: "call-convert",
    name: "Call Convert",
    kind: "BUNDLE",
    pricePaise: r(2199),
    mrpPaise: r(2999),
    earlyBirdEndsAt: EARLY_BIRD_END,
    enrolledOnly: false,
    credits: [
      { kind: "PI", quantity: 4 },
      { kind: "GD", quantity: 2 },
      { kind: "WAT", quantity: 1 },
      { kind: "SOP_DETAILED", quantity: 1 },
      { kind: "STRATEGY", quantity: 1 },
    ],
    summary: "4 PI, 2 GD, 1 WAT, 1 detailed SOP, 1 strategy call.",
    includes: [
      "4 mock PIs across different focus areas",
      "2 GD/GE batches",
      "1 WAT evaluation",
      "1 detailed SOP review",
      "1 strategy call with Samrudh",
      "Profile review, personalised booklet, form guidance",
    ],
    badge: "Most bought",
  },
  {
    slug: "mock-pi",
    name: "Mock PI",
    kind: "SINGLE",
    pricePaise: r(599),
    mrpPaise: null,
    earlyBirdEndsAt: null,
    enrolledOnly: false,
    credits: [{ kind: "PI", quantity: 1 }],
    summary: "One hour, one focus area, written feedback in 24 hours.",
    includes: [],
  },
  {
    slug: "additional-pi",
    name: "Additional PI",
    kind: "SINGLE",
    pricePaise: r(449),
    mrpPaise: r(599),
    earlyBirdEndsAt: null,
    enrolledOnly: true,
    credits: [{ kind: "PI", quantity: 1 }],
    summary: "For enrolled students who want one more.",
    includes: [],
  },
  {
    slug: "mock-gd",
    name: "Mock GD/GE",
    kind: "SINGLE",
    pricePaise: r(199),
    mrpPaise: null,
    earlyBirdEndsAt: null,
    enrolledOnly: false,
    credits: [{ kind: "GD", quantity: 1 }],
    summary: "Eight-person batch, live moderation, individual notes.",
    includes: [],
  },
  {
    slug: "wat",
    name: "WAT evaluation",
    kind: "SINGLE",
    pricePaise: r(199),
    mrpPaise: null,
    earlyBirdEndsAt: null,
    enrolledOnly: false,
    credits: [{ kind: "WAT", quantity: 1 }],
    summary: "Upload your essay, get it marked against the same rubric.",
    includes: [],
  },
  {
    slug: "sop-detailed",
    name: "Detailed SOP review",
    kind: "SINGLE",
    pricePaise: r(399),
    mrpPaise: null,
    earlyBirdEndsAt: null,
    enrolledOnly: false,
    credits: [{ kind: "SOP_DETAILED", quantity: 1 }],
    summary: "Line edits plus a rewrite of your weakest paragraph.",
    includes: [],
  },
  {
    slug: "sop-basic",
    name: "Basic SOP review",
    kind: "SINGLE",
    pricePaise: r(99),
    mrpPaise: null,
    earlyBirdEndsAt: null,
    enrolledOnly: false,
    credits: [{ kind: "SOP_BASIC", quantity: 1 }],
    summary: "Structure, tone and red flags. No line edits.",
    includes: [],
  },
  {
    slug: "quick-guidance",
    name: "Quick Guidance",
    kind: "SINGLE",
    pricePaise: r(299),
    mrpPaise: null,
    earlyBirdEndsAt: null,
    enrolledOnly: false,
    credits: [{ kind: "GUIDANCE", quantity: 1 }],
    summary: "A 45-minute call on what to prioritise before your date.",
    includes: [],
  },
];

/** Display order of the single-service grid on /packages. */
const SINGLES_ORDER = [
  "mock-pi",
  "additional-pi",
  "mock-gd",
  "wat",
  "sop-basic",
  "sop-detailed",
  "quick-guidance",
];

export const FEATURED_SLUG = "call-convert";

export async function getProducts(): Promise<CatalogProduct[]> {
  return PRODUCTS;
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getBundles(): Promise<CatalogProduct[]> {
  // Call Convert first, Plus second, regardless of grid order.
  return ["call-convert", "call-convert-plus"]
    .map((s) => PRODUCTS.find((p) => p.slug === s))
    .filter((p): p is CatalogProduct => Boolean(p));
}

export async function getSingles(): Promise<CatalogProduct[]> {
  return SINGLES_ORDER.map((s) => PRODUCTS.find((p) => p.slug === s)).filter(
    (p): p is CatalogProduct => Boolean(p),
  );
}

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
  const prices = products.map((p) => priceView(p, now).payablePaise).sort((a, b) => a - b);
  return prices.length > 1 ? prices.map(formatPaise).join(" / ") : formatPaise(prices[0]);
}
