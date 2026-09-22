import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PackageCard } from "@/components/site/package-card";
import { EnrolledOnlyNote, Price, buyHref, buyLabel, isPubliclyPurchasable } from "@/components/site/price";
import { getBundles, getSingles } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Packages",
  description: "Season packages for GDPI prep, or buy a single mock, GD, WAT or SOP review.",
};
export const revalidate = 3600;

export default async function PackagesPage() {
  const [bundles, singles] = await Promise.all([getBundles(), getSingles()]);
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-[18px] px-5 py-[26px]">
      <div>
        <h1 className="type-page text-ink">Packages</h1>
        <p className="mt-2 max-w-[60ch] text-sm leading-[1.6] text-ink-muted">
          Buy a season package if you have multiple calls. Buy one session if you want to try us first.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3.5">
        {bundles.map((b, i) => (
          <PackageCard key={b.slug} product={b} tone={i === 0 ? "light" : "dark"} />
        ))}
      </div>

      <Card className="p-[22px]">
        <h2 className="type-section text-ink">One session at a time</h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {singles.map((s) => (
            <div key={s.slug} className="flex flex-col gap-[9px] rounded-[10px] border border-line p-[15px]">
              <h3 className="text-[12.5px] font-medium leading-[1.4] text-ink-2">{s.name}</h3>
              <Price product={s} className="text-[21px] text-ink" />
              {isPubliclyPurchasable(s) ? (
                <ButtonLink href={buyHref(s)} variant="fillOnHover" aria-label={buyLabel(s, "long")} className="mt-auto rounded-[7px] text-xs">
                  {buyLabel(s)}
                </ButtonLink>
              ) : (
                <EnrolledOnlyNote className="mt-auto rounded-[7px] border border-line-soft bg-surface py-2 text-center text-[11px] leading-[1.4] text-ink-faint" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
