import { db } from "@/lib/db";
import type { CatalogProduct } from "@/lib/pricing";
import { unstable_cache } from "next/cache";

/**
 * Product catalog, read from Postgres (seeded from prisma/seed-data.ts, editable in Admin).
 * Prices are integer paise. The server always re-reads them here; a price sent from the client is never trusted.
 */

type Row = Awaited<ReturnType<typeof loadAll>>[number];

async function loadAll() {
  return db.product.findMany({
    where: { active: true },
    include: { credits: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

function toCatalog(p: Row): CatalogProduct {
  return {
    slug: p.slug,
    name: p.name,
    kind: p.kind,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    mentorPricePaise: p.mentorPricePaise,
    enrolledOnly: p.enrolledOnly,
    withAdmin: p.withAdmin,
    earlyBird: p.earlyBirdPricePaise != null && p.earlyBirdSeats != null ? { pricePaise: p.earlyBirdPricePaise, limit: p.earlyBirdSeats, seatsLeft: p.earlyBirdSeats } : null,
    credits: p.credits.map((c) => ({ kind: c.kind, quantity: c.quantity })),
    summary: p.summary,
    includes: p.includes,
    badge: p.badge ?? undefined,
  };
}

/** Cached for a minute and tagged so Admin edits can revalidate("catalog") instantly. */
const cachedAll = unstable_cache(async () => (await loadAll()).map(toCatalog), ["catalog:all"], {
  tags: ["catalog"],
  revalidate: 60,
});

/**
 * Early-bird seats already taken, per product: distinct students (by email) with a paid early-bird order, plus anyone
 * who started one in the last 30 minutes (so a seat isn't promised to two people who are paying at the same moment).
 */
export async function earlyBirdTaken(): Promise<Map<string, number>> {
  const rows = await db.$queryRaw<{ productId: string; n: number }[]>`
    SELECT "productId", COUNT(DISTINCT lower("guestEmail"))::int AS n FROM "Order"
    WHERE "earlyBird" = true AND (status IN ('PAID','PARTIALLY_REFUNDED') OR (status = 'CREATED' AND "createdAt" > now() - interval '30 minutes'))
    GROUP BY "productId"`;
  return new Map(rows.map((r) => [r.productId, r.n]));
}

/** The catalog with live early-bird seat counts (the product list itself is cached; the seat count never is). */
export async function getProducts(): Promise<CatalogProduct[]> {
  const list = await cachedAll();
  if (!list.some((p) => p.earlyBird)) return list;
  const [taken, ids] = await Promise.all([earlyBirdTaken(), db.product.findMany({ where: { slug: { in: list.filter((p) => p.earlyBird).map((p) => p.slug) } }, select: { id: true, slug: true } })]);
  const idOf = new Map(ids.map((i) => [i.slug, i.id]));
  return list.map((p) => (p.earlyBird ? { ...p, earlyBird: { ...p.earlyBird, seatsLeft: Math.max(0, p.earlyBird.limit - (taken.get(idOf.get(p.slug) ?? "") ?? 0)) } } : p));
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getBundles(): Promise<CatalogProduct[]> {
  return (await getProducts()).filter((p) => p.kind === "BUNDLE").sort((a, b) => a.pricePaise - b.pricePaise);
}

export async function getSingles(): Promise<CatalogProduct[]> {
  const rows = await db.product.findMany({
    where: { active: true, kind: "SINGLE" },
    orderBy: { singleOrder: "asc" },
    select: { slug: true },
  });
  const all = await getProducts();
  return rows.map((r) => all.find((p) => p.slug === r.slug)).filter((p): p is CatalogProduct => Boolean(p));
}
