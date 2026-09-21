import { ButtonLink } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/pricing";
import { Price, buyHref, buyLabel } from "@/components/site/price";

export function ProductTile({ product }: { product: CatalogProduct }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-[18px] hover:border-ink">
      <h3 className="text-[13.5px] font-semibold leading-[1.3] text-ink">{product.name}</h3>
      <Price product={product} className="text-[22px] text-ink" />
      <p className="flex-1 text-pretty text-[12.5px] leading-[1.55] text-ink-muted">{product.summary}</p>
      <ButtonLink href={buyHref(product)} variant="fillOnHover" aria-label={buyLabel(product, "long")}>
        {buyLabel(product)}
      </ButtonLink>
    </div>
  );
}
