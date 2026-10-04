import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { isProductionEnv } from "@/lib/env";
import { legalDocs, type LegalSlug } from "@/lib/content";

const ORDER: { slug: LegalSlug; label: string }[] = [
  { slug: "terms", label: "Terms" },
  { slug: "privacy", label: "Privacy" },
  { slug: "refunds", label: "Refunds" },
  { slug: "mentor-agreement", label: "Mentor Agreement" },
];

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = (await legalDocs())[slug];
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-3.5 px-5 py-[26px]">
      {!isProductionEnv() && (
        <Notice>Draft shown outside production. Have an Indian advocate review the final text, and a CA review anything about tax, before launch.</Notice>
      )}
      <nav aria-label="Legal" className="flex flex-wrap gap-1.5">
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
      <Card className="p-[22px] sm:p-7">
        <h1 className="font-display text-[22px] font-bold leading-[1.25] text-ink">{doc.title}</h1>
        <p className="mt-2 text-pretty text-[13px] leading-[1.65] text-ink-faint">{doc.summary}</p>
        <div className="mt-6 flex flex-col gap-6">
          {doc.sections.map((sec, i) => (
            <section key={sec.heading} aria-labelledby={`s${i + 1}`}>
              <h2 id={`s${i + 1}`} className="font-display text-[15px] font-bold leading-[1.35] text-ink">{i + 1}. {sec.heading}</h2>
              <ol className="mt-2.5 flex flex-col gap-2.5">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-pretty text-[13.5px] leading-[1.7] text-ink-muted">
                    <span className="tnum w-9 flex-none text-ink-faint">{i + 1}.{j + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
