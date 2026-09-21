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
    earlyBirdEndsAt: p.earlyBirdEndsAt,
    enrolledOnly: p.enrolledOnly,
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

export async function getProducts(): Promise<CatalogProduct[]> {
  const all = await cachedAll();
  // unstable_cache serialises Dates to strings; restore them.
  return all.map((p) => ({ ...p, earlyBirdEndsAt: p.earlyBirdEndsAt ? new Date(p.earlyBirdEndsAt) : null }));
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
