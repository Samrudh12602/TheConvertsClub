import { PortalPage } from "@/components/portal/portal-page";
import { Empty, Panel, Section } from "@/components/portal/ui";
import { FaqForm, FaqToggle, ResourceDelete, ResourceForm, SeasonStatDelete, SeasonStatForm, TestimonialForm, TestimonialToggle } from "@/components/admin/content-forms";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site content" };

export default async function ContentPage() {
  const [testimonials, faqItems, resources, seasonStats] = await Promise.all([
    db.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    db.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
    db.resource.findMany({ orderBy: [{ audience: "asc" }, { sortOrder: "asc" }] }),
    db.seasonStat.findMany({ orderBy: { sortOrder: "asc" } }),
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
        <Panel title="Season stats (stat tiles on /results)" flush={false}>
          <SeasonStatForm />
          <div className="mt-3.5 flex flex-col gap-2 border-t border-line-soft pt-3.5">
            {seasonStats.length === 0 ? <Empty>None yet — the public page shows bracketed placeholder numbers until you add real ones.</Empty> : seasonStats.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-2.5 rounded-lg border border-line-soft p-2.5">
                <div className="min-w-0"><p className="tnum text-[13px] font-bold text-ink">{s.value}</p><p className="mt-0.5 text-[11.5px] text-ink-faint">{s.label}</p></div>
                <SeasonStatDelete id={s.id} />
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
        <Panel title="Library & resources (student library and mentor resources)" flush={false}>
          <ResourceForm />
          <div className="mt-3.5 flex flex-col gap-2 border-t border-line-soft pt-3.5">
            {resources.length === 0 ? <Empty>None yet — both /student/library and /mentor/resources are empty until you add some.</Empty> : resources.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2.5 rounded-lg border border-line-soft p-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-oxblood">{r.audience === "STUDENT" ? "Student" : "Mentor"} · {r.kind}</p>
                  <p className="mt-1.5 text-[12.5px] font-semibold text-ink">{r.title}</p>
                  {r.meta && <p className="mt-0.5 text-[11.5px] text-ink-faint">{r.meta}</p>}
                  {r.url && <p className="mt-0.5 truncate text-[11px] text-ink-faint">{r.url}</p>}
                </div>
                <ResourceDelete id={r.id} />
              </div>
            ))}
          </div>
        </Panel>
      </Section>
    </PortalPage>
  );
}
