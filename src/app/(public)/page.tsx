import { ButtonLink } from "@/components/ui/button";
import { DarkPanel } from "@/components/ui/card";
import { Price, buyHref } from "@/components/site/price";
import { ProductTile } from "@/components/site/product-tile";
import { describeCredit, FEATURED_SLUG, getProduct, getProducts } from "@/lib/catalog";

// Early-bird pricing flips on a date, so re-render at least hourly.
export const revalidate = 3600;

export default async function HomePage() {
  const [products, featured] = await Promise.all([getProducts(), getProduct(FEATURED_SLUG)]);

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-[18px] p-5">
      <section className="flex flex-wrap items-center gap-5 rounded-[14px] border border-line bg-card p-6 sm:p-8">
        <div className="min-w-0 flex-[1_1_320px]">
          <p className="type-eyebrow text-oxblood">GDPI prep, student-led</p>
          <h1 className="type-display mt-3.5 text-ink">Mocks with last year&apos;s converts, at a price you&apos;ll actually pay.</h1>
          <p className="mt-3.5 max-w-[48ch] text-pretty text-[15px] leading-[1.65] text-ink-muted">
            One mock or the whole season. No sales call, no bundle you didn&apos;t want.
          </p>
        </div>
        {featured && (
          <DarkPanel className="flex-[0_1_300px]">
            <p className="type-eyebrow text-dark-muted">Most bought</p>
            <h2 className="mt-2.5 font-display text-[19px] font-bold leading-[1.25]">{featured.name}</h2>
            <div className="mt-3">
              <Price product={featured} className="text-[32px] text-surface" strikeSize="text-sm" strikeClassName="text-dark-muted" />
            </div>
            <p className="mt-2.5 text-[12.5px] leading-[1.6] text-dark-soft">
              {featured.credits.map((c) => describeCredit(c)).join(", ")}.
            </p>
            <ButtonLink href={buyHref(featured)} variant="onDark" size="lg" block className="mt-4 min-h-[46px]">
              Buy now
            </ButtonLink>
          </DarkPanel>
        )}
      </section>

      <section aria-labelledby="everything">
        <h2 id="everything" className="sr-only">
          Everything we sell
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
          {products.map((p) => (
            <ProductTile key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
