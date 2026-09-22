import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel, Section } from "@/components/portal/ui";
import { FaqForm, FaqToggle, TestimonialForm, TestimonialToggle } from "@/components/admin/content-forms";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site content" };

export default async function ContentPage() {
  const [testimonials, faqItems] = await Promise.all([
    db.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    db.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <PortalPage width="max-w-[1000px]">
      <Section cols={340}>
        <Panel title="Testimonials (shown on /results once published)" flush={false}>
          <TestimonialForm />
          <div className="mt-3.5 flex flex-col gap-2 border-t border-line-soft pt-3.5">
            {testimonials.length === 0 ? <Empty>None yet — the public page shows placeholder content until you add real ones.</Empty> : testimonials.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-2.5 rounded-lg border border-line-soft p-2.5">
                <div className="min-w-0"><p className="text-[12.5px] leading-[1.5] text-ink-body">{t.quote}</p><p className="mt-1 text-[11px] font-semibold text-oxblood">{t.who}</p></div>
                <TestimonialToggle id={t.id} published={t.published} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="FAQ (overrides the defaults on /faq once any are published)" flush={false}>
          <FaqForm />
          <div className="mt-3.5 flex flex-col gap-2 border-t border-line-soft pt-3.5">
            {faqItems.length === 0 ? <Empty>None yet — the public page shows the built-in defaults.</Empty> : faqItems.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-2.5 rounded-lg border border-line-soft p-2.5">
                <div className="min-w-0"><p className="text-[12.5px] font-semibold text-ink">{f.question}</p><p className="mt-1 text-[11.5px] leading-[1.4] text-ink-muted">{f.answer}</p></div>
                <FaqToggle id={f.id} published={f.published} />
              </div>
            ))}
          </div>
        </Panel>
      </Section>
    </PortalPage>
  );
}
