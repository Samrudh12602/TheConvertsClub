import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/pricing";
import { Price, buyHref } from "@/components/site/price";

/** Package card in the two designed tones: light (white) and dark (ink). */
export function PackageCard({ product, tone }: { product: CatalogProduct; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <article className={clsx("flex flex-col rounded-xl border p-6", dark ? "border-ink bg-ink" : "border-line bg-card")}>
      <div className="flex items-start justify-between gap-2.5">
        <h3 className={clsx("font-display text-[19px] font-bold leading-[1.25]", dark ? "text-surface" : "text-ink")}>{product.name}</h3>
        {product.badge && (
          <span className="whitespace-nowrap rounded-[5px] bg-oxblood px-2 py-[5px] text-[10.5px] font-semibold leading-none text-white">
            {product.badge}
          </span>
        )}
      </div>
      <div className="mt-3.5">
        <Price
          product={product}
          className={clsx("text-[34px]", dark ? "text-surface" : "text-ink")}
          strikeSize="text-sm"
          strikeClassName={dark ? "text-dark-muted" : "text-ink-faint"}
        />
      </div>
      <ul className="mt-5 flex flex-1 flex-col gap-2">
        {product.includes.map((item) => (
          <li key={item} className="flex items-start gap-[9px]">
            <span aria-hidden className="mt-[7px] size-[5px] flex-none rounded-full bg-oxblood" />
            <span className={clsx("text-pretty text-[13.5px] leading-[1.55]", dark ? "text-dark-body" : "text-ink-2")}>{item}</span>
          </li>
        ))}
      </ul>
      <ButtonLink
        href={buyHref(product)}
        size="lg"
        variant={dark ? "onDark" : "dark"}
        className="mt-[22px] py-3.5 rounded-[9px]"
      >
        Buy {product.name}
      </ButtonLink>
    </article>
  );
}
