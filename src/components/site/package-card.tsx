import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/pricing";
import { Price, buyHref } from "@/components/site/price";

/** Package card in the two designed tones: light (white) and dark (ink). */
export function PackageCard({ product, tone }: { product: CatalogProduct; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <article className={clsx("group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1", dark ? "border-white/10 bg-night shadow-lift hover:shadow-glow" : "border-line bg-card shadow-card hover:shadow-lift")}>
      <span aria-hidden className={clsx("absolute inset-x-0 top-0 h-[3px]", dark ? "bg-gradient-to-r from-gold via-oxblood to-gold" : "bg-brand")} />
      <div className="flex items-start justify-between gap-2.5">
        <h3 className={clsx("font-display text-[19px] font-bold leading-[1.25]", dark ? "text-surface" : "text-ink")}>{product.name}</h3>
        {product.badge && (
          <span className="whitespace-nowrap rounded-full bg-brand px-2.5 py-[5px] text-[10.5px] font-semibold leading-none text-white shadow-xs">
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
          onDark={dark}
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
