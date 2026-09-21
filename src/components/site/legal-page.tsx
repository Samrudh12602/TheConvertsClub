import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { isProductionEnv } from "@/lib/env";
import { legalDocs, type LegalSlug } from "@/lib/content";

const ORDER: { slug: LegalSlug; label: string }[] = [
  { slug: "terms", label: "Terms" },
  { slug: "privacy", label: "Privacy" },
  { slug: "refunds", label: "Refunds" },
];

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = (await legalDocs())[slug];
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-3.5 px-5 py-[26px]">
      {!isProductionEnv() && (
        <Notice>Structure only. A lawyer and a CA should write and review the final text, particularly refunds, GST and DPDP obligations.</Notice>
      )}
      <nav aria-label="Legal" className="flex gap-1.5">
        {ORDER.map((o) => (
          <Link
            key={o.slug}
            href={`/${o.slug}`}
            aria-current={o.slug === slug ? "page" : undefined}
            className={
              o.slug === slug
                ? "rounded-full bg-ink px-3.5 py-2.5 text-xs font-medium leading-none text-white no-underline"
                : "rounded-full border border-line-strong bg-white px-3.5 py-2.5 text-xs font-medium leading-none text-ink-2 no-underline hover:border-ink hover:no-underline"
            }
          >
            {o.label}
          </Link>
        ))}
      </nav>
      <Card className="p-[22px]">
        <h1 className="font-display text-[18px] font-bold leading-[1.25] text-ink">{doc.title}</h1>
        <ul className="mt-[13px] flex flex-col gap-[9px]">
          {doc.sections.map((s) => (
            <li key={s} className="text-pretty text-[13.5px] leading-[1.65] text-ink-muted">
              {s}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
