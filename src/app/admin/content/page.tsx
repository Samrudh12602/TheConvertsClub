import { PortalPage } from "@/components/portal/portal-page";
import { BookOpen, HelpCircle, MessageSquareQuote, TrendingUp } from "lucide-react";
import { Empty, Kpi, KpiGrid, Panel, Section } from "@/components/portal/ui";
import { FaqForm, FaqToggle, ResourceDelete, ResourceForm, SeasonStatDelete, SeasonStatForm, TestimonialForm, TestimonialToggle, FeatureButton } from "@/components/admin/content-forms";
import { db } from "@/lib/db";
import { isFeaturable, testimonialWho } from "@/lib/testimonial";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site content" };

export default async function ContentPage() {
  const [testimonials, faqItems, resources, seasonStats, candidates] = await Promise.all([
    db.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    db.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
    db.resource.findMany({ orderBy: [{ audience: "asc" }, { sortOrder: "asc" }] }),
    db.seasonStat.findMany({ orderBy: { sortOrder: "asc" } }),
    // Happy students who wrote a comment AND said we may show it, not yet published.
    db.sessionRating.findMany({
      where: { featureConsent: true, rating: { gte: 4 }, comment: { not: null }, student: { isDemo: false } },
      orderBy: { createdAt: "desc" }, take: 30, include: { student: { include: { studentProfile: true } } },
    }).then(async (rows) => {
      const used = new Set((await db.testimonial.findMany({ where: { ratingId: { in: rows.map((r) => r.id) } }, select: { ratingId: true } })).map((t) => t.ratingId));
      return rows.filter((r) => !used.has(r.id) && isFeaturable(r));
    }),
  ]);
  return (
    <PortalPage width="max-w-[1000px]">
      <KpiGrid>
        <Kpi label="Testimonials" value={testimonials.filter((t) => t.published).length} note={`${testimonials.length} total · ${candidates.length} ready to feature`} noteTone={candidates.length ? "green" : "muted"} icon={<MessageSquareQuote />} accent="teal" />
        <Kpi label="FAQ items" value={faqItems.filter((f) => f.published).length} note={`${faqItems.length} total`} icon={<HelpCircle />} accent="indigo" />
        <Kpi label="Season stats" value={seasonStats.length} note="Tiles on /results" icon={<TrendingUp />} accent="gold" />
        <Kpi label="Resources" value={resources.length} note="Students and mentors" icon={<BookOpen />} accent="oxblood" />
      </KpiGrid>
      {candidates.length > 0 && (
        <Panel title={`Students who said you can feature their comment · ${candidates.length}`} flush={false}>
          <div className="flex flex-col gap-2">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-white">
                <div className="min-w-0"><p className="text-[12.5px] leading-[1.5] text-ink-body">&ldquo;{c.comment}&rdquo;</p><p className="mt-1 text-[11px] font-semibold text-oxblood">{testimonialWho(c.student.name, c.student.studentProfile?.college)} · {c.rating}/5</p></div>
                <FeatureButton ratingId={c.id} />
              </div>
            ))}
          </div>
        </Panel>
      )}
      <Section cols={340}>
        <Panel title="Testimonials (shown on /results once published)" flush={false}>
          <TestimonialForm />
          <div className="mt-3.5 flex flex-col gap-2 border-t border-line-soft pt-3.5">
            {testimonials.length === 0 ? <Empty>None yet — the public page shows placeholder content until you add real ones.</Empty> : testimonials.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-2.5 rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-white">
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
              <div key={s.id} className="flex items-start justify-between gap-2.5 rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-white">
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
              <div key={f.id} className="flex items-start justify-between gap-2.5 rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-white">
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
              <div key={r.id} className="flex items-start justify-between gap-2.5 rounded-xl border border-line bg-surface/60 p-3 transition-colors hover:bg-white">
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
