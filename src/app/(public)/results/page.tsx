import type { Metadata } from "next";
import { Card, DarkPanel } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { getResults } from "@/lib/content";

export const metadata: Metadata = { title: "Results", description: "What last season's students converted." };

export default async function ResultsPage() {
  const results = await getResults();
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-5 py-[26px]">
      <h1 className="type-page text-ink">Results</h1>
      {results === null ? (
        <Card className="text-sm leading-[1.6] text-ink-muted">
          We&apos;ll publish verified season results here, each one from a student who agreed to share it.
        </Card>
      ) : (
        <>
          <Notice>Placeholder figures, shown outside production only. Replace with your verified season numbers before launch — every claim here needs a student who consented to it.</Notice>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
            {results.stats.map((r) => (
              <li key={r.label}>
                <DarkPanel className="h-full p-5">
                  <p className="tnum font-display text-[30px] font-bold leading-none">{r.value}</p>
                  <p className="mt-[9px] text-[12.5px] leading-normal text-dark-muted">{r.label}</p>
                </DarkPanel>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {results.testimonials.map((t) => (
              <Card key={t.quote}>
                <blockquote className="text-pretty text-[14.5px] leading-[1.65] text-ink-body">{t.quote}</blockquote>
                <p className="mt-[13px] border-t border-line-soft pt-3 text-xs font-semibold leading-[1.4] text-oxblood">{t.who}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
