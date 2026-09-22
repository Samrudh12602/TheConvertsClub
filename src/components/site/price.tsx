import clsx from "clsx";
import { priceView, type CatalogProduct } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";

/** Enrolled-only products (e.g. Additional PI) are never buyable from the public site — only from
 * inside the student portal once actually enrolled. Public pages show the price but no buy action. */
export const isPubliclyPurchasable = (p: CatalogProduct) => !p.enrolledOnly;

export function buyHref(p: CatalogProduct): string {
  return `/checkout?product=${p.slug}`;
}

export function buyLabel(p: CatalogProduct, style: "short" | "long" = "short"): string {
  return style === "long" ? `Buy ${p.name}` : "Buy";
}

/** Shown in place of a Buy button for enrolled-only products on public pages. */
export function EnrolledOnlyNote({ className }: { className?: string }) {
  return (
    <p className={className ?? "text-center text-[11.5px] leading-[1.4] text-ink-faint"}>
      For enrolled students only
    </p>
  );
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
