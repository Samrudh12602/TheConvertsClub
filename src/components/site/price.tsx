import clsx from "clsx";
import { priceView, type CatalogProduct } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import { getReferral, referralPrice } from "@/server/referral";

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

export async function Price({
  product,
  className,
  strikeClassName,
  strikeSize = "text-[12.5px]",
  onDark = false,
}: {
  product: CatalogProduct;
  className?: string;
  strikeClassName?: string;
  strikeSize?: string;
  onDark?: boolean;
}) {
  const v = priceView(product);
  // A visitor who arrived through a mentor's /r/CODE link sees what they will actually pay.
  const ref = await getReferral();
  const withCode = referralPrice(product, ref);
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className={clsx("tnum font-display font-bold leading-none", className, withCode !== null && "opacity-60")}>{formatPaise(v.payablePaise)}</span>
        {v.strikePaise !== null && (
          <span className={clsx("tnum leading-none line-through", strikeSize, strikeClassName ?? "text-ink-faint")}>
            <span className="sr-only">was </span>
            {formatPaise(v.strikePaise)}
          </span>
        )}
      </div>
      {withCode !== null && ref && (
        <p className={clsx("tnum mt-1.5 text-[12.5px] font-semibold leading-[1.3]", onDark ? "text-blush" : "text-green")}>
          {formatPaise(withCode)} <span className="font-medium">with {ref.mentorFirst}&apos;s code {ref.code}</span>
        </p>
      )}
    </div>
  );
}
