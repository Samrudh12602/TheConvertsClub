import clsx from "clsx";
import { Crown, FileText, GraduationCap, MessageCircle, Mic, PenLine, Users, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { CatalogProduct } from "@/lib/pricing";
import { EnrolledOnlyNote, Price, buyHref, buyLabel, isPubliclyPurchasable } from "@/components/site/price";

/** An icon and colour per kind of service, so a grid of products reads at a glance instead of as identical boxes. */
const LOOK: Record<string, { icon: LucideIcon; tint: string }> = {
  "mock-pi": { icon: Mic, tint: "bg-oxblood-tint text-oxblood" },
  "additional-pi": { icon: Mic, tint: "bg-oxblood-tint text-oxblood" },
  "mock-gd": { icon: Users, tint: "bg-teal-tint text-teal" },
  wat: { icon: PenLine, tint: "bg-indigo-tint text-indigo" },
  "sop-basic": { icon: FileText, tint: "bg-gold-tint text-gold-deep" },
  "sop-detailed": { icon: FileText, tint: "bg-gold-tint text-gold-deep" },
  "quick-guidance": { icon: MessageCircle, tint: "bg-plum-tint text-plum" },
  "pi-with-samrudh": { icon: Crown, tint: "bg-gold-tint text-gold-deep" },
  "strategy-with-samrudh": { icon: Crown, tint: "bg-gold-tint text-gold-deep" },
};

export function ProductTile({ product }: { product: CatalogProduct }) {
  const purchasable = isPubliclyPurchasable(product);
  const look = LOOK[product.slug] ?? { icon: GraduationCap, tint: "bg-line-soft text-ink-2" };
  const Icon = look.icon;
  return (
    <div className={clsx("group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-[18px] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift", product.withAdmin ? "border-gold-line" : "border-line")}>
      {product.withAdmin && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold to-[#e0b45a]" />}
      <div className="flex items-start justify-between gap-2">
        <span className={clsx("flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", look.tint)}><Icon className="size-[18px]" strokeWidth={1.9} aria-hidden /></span>
        {product.badge && <span className="rounded-full bg-gold-tint px-2.5 py-1.5 text-[10.5px] font-semibold leading-none text-gold-deep">{product.badge}</span>}
      </div>
      <h3 className="text-[14px] font-semibold leading-[1.3] text-ink">{product.name}</h3>
      <Price product={product} className="text-[24px] text-ink" />
      <p className="flex-1 text-pretty text-[12.5px] leading-[1.6] text-ink-muted">{product.summary}</p>
      {purchasable ? (
        <ButtonLink href={buyHref(product)} variant="fillOnHover" aria-label={buyLabel(product, "long")}>
          {buyLabel(product)}
        </ButtonLink>
      ) : (
        <EnrolledOnlyNote className="rounded-lg border border-line-soft bg-surface py-2.5 text-center text-[11.5px] leading-[1.4] text-ink-faint" />
      )}
    </div>
  );
}
