import clsx from "clsx";
import { priceView, type CatalogProduct } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";

export function buyHref(p: CatalogProduct): string {
  // Enrolled-only products are bought from inside the student portal, never as a guest.
  return p.enrolledOnly ? "/login" : `/checkout?product=${p.slug}`;
}

export function buyLabel(p: CatalogProduct, style: "short" | "long" = "short"): string {
  if (p.enrolledOnly) return "Log in to buy";
  return style === "long" ? `Buy ${p.name}` : "Buy";
}

export function Price({
  product,
  className,
  strikeClassName,
  strikeSize = "text-[12.5px]",
}: {
  product: CatalogProduct;
  className?: string;
  strikeClassName?: string;
  strikeSize?: string;
}) {
  const v = priceView(product);
  return (
    <div className="flex items-baseline gap-2">
      <span className={clsx("tnum font-display font-bold leading-none", className)}>{formatPaise(v.payablePaise)}</span>
      {v.strikePaise !== null && (
        <span className={clsx("tnum leading-none line-through", strikeSize, strikeClassName ?? "text-ink-faint")}>
          <span className="sr-only">was </span>
          {formatPaise(v.strikePaise)}
        </span>
      )}
    </div>
  );
}
