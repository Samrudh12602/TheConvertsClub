import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Mock PIs, GD/GE, WAT evaluation, SOP review, strategy calls and quick guidance.",
};
export const revalidate = 3600;

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-5 py-[26px]">
      <h1 className="type-page text-ink">What we actually do</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {services.map((s) => (
          <Card key={s.name}>
            <div className="flex items-baseline justify-between gap-2.5">
              <h2 className="font-display text-base font-bold leading-[1.3] text-ink">{s.name}</h2>
              <p className="tnum whitespace-nowrap text-[13px] font-semibold leading-none text-oxblood">{s.price}</p>
            </div>
            <p className="mt-2.5 text-pretty text-[13.5px] leading-[1.65] text-ink-muted">{s.body}</p>
            <p className="mt-3 border-t border-line-soft pt-[11px] text-xs font-medium leading-normal text-ink-faint">{s.meta}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
