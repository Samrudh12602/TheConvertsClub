import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, BarChart3, Check, Clock, FileText, Gauge, Lock, ListChecks, MonitorPlay, ShieldCheck, Sparkles, Target, Timer, TrendingDown, Trophy } from "lucide-react";
import { PaletteShape } from "@/components/mocks/exam-parts";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { Price, buyHref } from "@/components/site/price";
import { fmtWhen } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { priceView, type CatalogProduct } from "@/lib/pricing";
import { SNAP_STEPS } from "@/lib/snap-content";

export interface SnapProducts { test: CatalogProduct | null; five: CatalogProduct | null; ten: CatalogProduct | null }
export interface CatalogueMock { id: string; title: string; isTest: boolean; questions: number; durationMin: number; released: boolean; releaseAt: Date | null }

const rupees = (p: CatalogProduct) => formatPaise(priceView(p).payablePaise);

/** A drawn miniature of the exam screen, so a visitor sees what they'll sit before they buy. Decorative. */
export function ExamPreview() {
  const states = ["answered", "notAnswered", "marked", "answeredMarked", "answered", "notVisited", "notVisited", "notVisited"] as const;
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-[#cfd6de] bg-white text-[#222] shadow-pop" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="flex items-center justify-between bg-[#2f2f2f] px-3 py-2 text-[10.5px]"><span className="font-semibold text-[#e8e07a]">SNAP 2026 Mock</span><span className="text-white/80">Tools ▾ · Accessibility · Magnifier</span></div>
      <div className="flex items-center justify-between border-b border-[#ddd] px-3 py-1 text-[9.5px] font-semibold text-[#444]"><span>Section</span><span className="text-[#d9261c]">Time Left : 42:17</span></div>
      <div className="flex border-b border-[#ddd] text-[10px] font-semibold"><span className="bg-[#2f6aa6] px-3 py-1.5 text-white">General English</span><span className="px-3 py-1.5 text-[#2f6aa6]">Logical Reasoning</span><span className="px-3 py-1.5 text-[#2f6aa6]">Quant &amp; DI</span></div>
      <div className="flex flex-col sm:flex-row">
        <div className="min-w-0 flex-1 p-3">
          <p className="text-[9.5px] font-bold text-[#b8431a]">Question Type: MCQ</p>
          <p className="mt-2 text-[11px] font-bold">Question No. 7.</p>
          <p className="mt-1.5 text-[10px] leading-[1.5]">The committee&apos;s report was deliberately _______; it offered detail to appear thorough but stopped short of the _______ conclusions.</p>
          {["lucid; tentative", "exhaustive; vague", "equivocal; unambiguous", "cryptic; ambiguous"].map((o, i) => <p key={o} className="mt-1.5 flex items-center gap-1.5 text-[10px]"><span className={clsx("size-2.5 rounded-full border", i === 2 ? "border-[#3a78b8] bg-[#3a78b8]" : "border-[#999]")} />{o}</p>)}
          <div className="mt-3 flex gap-1.5 text-[9px]"><span className="rounded border border-[#bbb] bg-[#f4f4f4] px-2 py-1">Mark for review and Next</span><span className="rounded border border-[#bbb] bg-[#f4f4f4] px-2 py-1">Clear</span><span className="ml-auto rounded bg-[#3a78b8] px-2 py-1 font-semibold text-white">Save &amp; Next</span></div>
        </div>
        <div className="w-full flex-none border-t-2 border-[#222] bg-[#dcecf8] p-2.5 sm:w-[34%] sm:border-l-2 sm:border-t-0">
          <div className="grid grid-cols-4 gap-1.5">{states.map((st, i) => <PaletteShape key={i} state={st} label={i + 1} size={26} />)}</div>
          <p className="mt-2.5 text-[8.5px] font-semibold text-[#333]">Answered · Not answered · Marked · Not visited</p>
        </div>
      </div>
    </div>
  );
}

export function SnapHero({ p }: { p: SnapProducts }) {
  const stats = [["60", "questions"], ["60 min", "on a server clock"], ["+1 / −0.25", "real marking"], ["3", "sections, like SNAP"], ["PDF", "analysis, with solutions"]] as const;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-hero shadow-lift">
      <span aria-hidden className="absolute -left-24 top-24 size-72 rounded-full bg-oxblood/10 blur-3xl" />
      <span aria-hidden className="absolute -right-20 -top-16 size-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative grid items-center gap-12 px-6 py-10 sm:px-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-oxblood-line bg-white/80 px-3 py-1.5 text-[11.5px] font-semibold leading-none text-oxblood shadow-xs backdrop-blur"><span aria-hidden className="relative flex size-2"><span className="absolute inline-flex size-2 animate-ring rounded-full bg-teal/50" /><span className="relative inline-flex size-2 rounded-full bg-teal" /></span>SNAP 2026 · full-length computer-based mocks</span>
          <h1 className="type-display mt-5 text-ink sm:text-[54px] sm:leading-[1.03]">Sit the mock on the <span className="bg-gradient-to-r from-oxblood via-[#b4414f] to-gold bg-clip-text text-transparent">real SNAP screen</span>. Then see exactly what went wrong.</h1>
          <p className="mt-5 max-w-[52ch] text-pretty text-[16px] leading-[1.7] text-ink-muted">Sections, a question palette, review flags and negative marking, just like the exam. The moment you submit you get your analysis: where you lost marks, careless or concept, and a worked solution for every question.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {p.test && <ButtonLink href={buyHref(p.test)} size="lg" className="px-6" data-track="snap_hero_test">Take the test mock · {rupees(p.test)} <ArrowRight className="size-4" /></ButtonLink>}
            <ButtonLink href="#packs" variant="secondary" size="lg" className="px-5" data-track="snap_hero_packs">See the packs</ButtonLink>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[12.5px] font-medium text-ink-2">
            {([[ShieldCheck, "Built by people who converted"], [Target, "Marks, accuracy, topics"], [FileText, "Detailed PDF analysis"]] as const).map(([Icon, t]) => <li key={t} className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-teal-tint text-teal"><Icon className="size-3.5" aria-hidden /></span>{t}</li>)}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-[500px] pb-10 sm:pb-24 sm:pt-8 lg:max-w-none">
          {/* Illustrations of the product, not live data. */}
          <div aria-hidden className="absolute -right-2 top-0 z-10 hidden w-[158px] animate-float-slow rounded-2xl border border-line bg-white p-3 shadow-lift sm:block">
            <p className="type-label text-ink-faint">Timer</p>
            <div className="mt-2 flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-oxblood-tint text-oxblood"><Timer className="size-4" /></span><div><p className="tnum text-[15px] font-bold leading-none text-ink">42:17</p><p className="mt-1 text-[10.5px] leading-none text-ink-faint">server clock</p></div></div>
          </div>
          <div className="sm:rotate-[1.5deg] sm:transition-transform sm:duration-500 sm:hover:rotate-0"><ExamPreview /></div>
          <div aria-hidden className="absolute -left-4 bottom-0 z-10 hidden w-[190px] animate-float rounded-2xl border border-line bg-white p-3 shadow-lift sm:block">
            <p className="type-label text-ink-faint">After you submit</p>
            <div className="mt-2 flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-teal-tint text-teal"><Trophy className="size-4" /></span><div><p className="tnum text-[15px] font-bold leading-none text-ink">34.5 / 60</p><p className="mt-1 text-[10.5px] leading-none text-ink-faint">+ what went wrong</p></div></div>
          </div>
          {p.test && (
            <div className="absolute bottom-0 right-2 z-10 hidden w-[200px] overflow-hidden rounded-2xl bg-night p-4 text-surface shadow-pop ring-1 ring-white/10 sm:block">
              <span aria-hidden className="absolute -right-8 -top-8 size-24 rounded-full bg-oxblood/50 blur-2xl" />
              <p className="type-eyebrow relative text-gold">Start here</p>
              <p className="relative mt-1.5 font-display text-[28px] font-bold leading-none">{rupees(p.test)}</p>
              <p className="relative mt-1.5 text-[11.5px] leading-[1.5] text-dark-soft">One full mock + full analysis. One per person.</p>
            </div>
          )}
        </div>
      </div>
      <dl className="relative grid grid-cols-2 border-t border-line bg-white/60 backdrop-blur sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([v, l]) => <div key={l} className="border-line px-5 py-4 text-center odd:max-sm:border-r lg:border-r lg:last:border-r-0"><dt className="sr-only">{l}</dt><dd className="font-display text-[20px] font-bold leading-none text-ink">{v}<span className="mt-1.5 block font-sans text-[11.5px] font-medium text-ink-faint">{l}</span></dd></div>)}
      </dl>
    </section>
  );
}

export function SnapFeatures() {
  const items = [
    [MonitorPlay, "The real screen", "Section tabs, question palette, mark for review, clear response and a countdown: the layout you'll see on exam day."],
    [Lock, "A fair clock", "Time is kept on our server. Refreshing or closing the tab doesn't buy you extra minutes."],
    [ListChecks, "Real marking", "+1 for a right answer, −0.25 for a wrong one, nothing for a skip. Your score is what the exam would give."],
    [TrendingDown, "Why you lost marks", "Every miss is sorted: careless, concept gap, too slow, or never reached, so you fix the right thing."],
    [BarChart3, "Topic-level results", "See which topics and sections cost you, and how your time compared to an even pace."],
    [FileText, "A PDF to keep", "A detailed report with all 60 worked solutions, stamped with your name, for revision."],
  ] as const;
  return (
    <section aria-labelledby="snap-feat" className="relative overflow-hidden rounded-3xl bg-night px-6 py-12 text-surface shadow-lift ring-1 ring-white/10 sm:px-10 sm:py-14">
      <span aria-hidden className="absolute -left-16 -top-20 size-64 rounded-full bg-oxblood/40 blur-3xl" />
      <span aria-hidden className="absolute -bottom-24 right-0 size-72 rounded-full bg-gold/15 blur-3xl" />
      <Reveal className="relative mx-auto max-w-[640px] text-center"><p className="type-eyebrow text-gold">Why these mocks</p><h2 id="snap-feat" className="mt-3 font-display text-[30px] font-bold leading-[1.12] sm:text-[36px]">Practice that feels like the exam, and teaches you after it.</h2></Reveal>
      <ul className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([Icon, t, b], i) => (
          <Reveal key={t} as="li" delay={i * 60} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07]"><span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold"><Icon className="size-5" aria-hidden /></span><h3 className="mt-4 text-[15px] font-bold">{t}</h3><p className="mt-1.5 text-[13px] leading-[1.65] text-dark-body">{b}</p></Reveal>
        ))}
      </ul>
    </section>
  );
}

function PackCard({ product, label, tone, bullets, note, perMock }: { product: CatalogProduct; label?: string; tone: "light" | "dark"; bullets: string[]; note?: string; perMock?: string }) {
  const dark = tone === "dark";
  return (
    <article className={clsx("group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1", dark ? "border-white/10 bg-night text-surface shadow-lift hover:shadow-glow" : "border-line bg-card shadow-card hover:shadow-lift")}>
      <span aria-hidden className={clsx("absolute inset-x-0 top-0 h-[3px]", dark ? "bg-gradient-to-r from-gold via-oxblood to-gold" : "bg-brand")} />
      <div className="flex items-start justify-between gap-2"><h3 className={clsx("font-display text-[19px] font-bold leading-[1.25]", dark ? "text-surface" : "text-ink")}>{product.name}</h3>{label && <span className="whitespace-nowrap rounded-full bg-brand px-2.5 py-[5px] text-[10.5px] font-semibold leading-none text-white shadow-xs">{label}</span>}</div>
      <div className="mt-3.5"><Price product={product} className={clsx("text-[36px]", dark ? "text-surface" : "text-ink")} strikeSize="text-sm" strikeClassName={dark ? "text-dark-muted" : "text-ink-faint"} onDark={dark} /></div>
      {perMock && <p className={clsx("mt-1 text-[12px] font-medium", dark ? "text-gold" : "text-teal")}>{perMock}</p>}
      <ul className="mt-5 flex flex-1 flex-col gap-2">{bullets.map((b) => <li key={b} className="flex items-start gap-2.5"><span className={clsx("mt-0.5 flex size-5 flex-none items-center justify-center rounded-full", dark ? "bg-white/10 text-gold" : "bg-teal-tint text-teal")}><Check className="size-3" aria-hidden /></span><span className={clsx("text-[13.5px] leading-[1.55]", dark ? "text-dark-body" : "text-ink-2")}>{b}</span></li>)}</ul>
      {note && <p className={clsx("mt-3 text-[11.5px] leading-[1.55]", dark ? "text-dark-muted" : "text-ink-faint")}>{note}</p>}
      <ButtonLink href={buyHref(product)} size="lg" variant={dark ? "onDark" : "dark"} className="mt-5 rounded-[9px] py-3.5" data-track={`snap_buy_${product.slug}`}>Buy {product.name}</ButtonLink>
    </article>
  );
}

export function SnapPacks({ p }: { p: SnapProducts }) {
  if (!p.test && !p.five && !p.ten) return null;
  const per = (x: CatalogProduct | null, n: number) => (x ? `${formatPaise(Math.round(priceView(x).payablePaise / n))} a mock` : undefined);
  const saving = p.five && p.ten ? priceView(p.five).payablePaise * 2 - priceView(p.ten).payablePaise : 0;
  return (
    <section id="packs" aria-labelledby="packs-title" className="scroll-mt-24">
      <Reveal className="mb-5 max-w-[620px]"><p className="type-eyebrow text-oxblood">Pick your pack</p><h2 id="packs-title" className="type-display mt-3 text-ink">Start with one for ₹50. Add more when you&apos;re convinced.</h2></Reveal>
      <div className="grid gap-4 md:grid-cols-3">
        {p.test && <Reveal><PackCard product={p.test} label="Start here" tone="light" bullets={["One full-length mock, the real exam screen", "The complete analysis and every solution", "A detailed PDF report", "See the quality before you commit"]} note="One per person." /></Reveal>}
        {p.five && <Reveal delay={80}><PackCard product={p.five} tone="light" perMock={per(p.five, 5)} bullets={["5 full-length mocks, taken any time they're live", "Instant analysis and a PDF for each", "Section-wise, topic-wise and time analysis", "What-went-wrong breakdown after every mock"]} /></Reveal>}
        {p.ten && <Reveal delay={160}><PackCard product={p.ten} label="Best value" tone="dark" perMock={`${per(p.ten, 10) ?? ""}${saving > 0 ? ` · saves ${formatPaise(saving)} over two 5-packs` : ""}`} bullets={["10 full-length mocks", "Everything in the 5-pack, for twice the practice", "Track your score and weak topics across mocks", "Best price for the full December run"]} note="Mocks open one after another; see the list below for what's live." /></Reveal>}
      </div>
    </section>
  );
}

export function SnapHow() {
  const icons = [ListChecks, MonitorPlay, BarChart3, FileText];
  return (
    <section aria-labelledby="snap-how" className="rounded-3xl border border-line bg-card px-6 py-10 shadow-card sm:px-10">
      <Reveal className="mx-auto max-w-[620px] text-center"><p className="type-eyebrow text-oxblood">How it works</p><h2 id="snap-how" className="type-display mt-3 text-ink">From buying to knowing what to fix</h2></Reveal>
      <ol className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SNAP_STEPS.map((s, i) => { const Icon = icons[i]; return (
          <Reveal key={s.title} as="li" delay={i * 70} className="flex flex-col items-center text-center"><span className="relative flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow"><Icon className="size-5" aria-hidden /><span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-oxblood shadow-card ring-1 ring-line">{i + 1}</span></span><h3 className="mt-3.5 text-[14px] font-bold text-ink">{s.title}</h3><p className="mt-1.5 max-w-[26ch] text-[12.5px] leading-[1.6] text-ink-muted">{s.body}</p></Reveal>
        ); })}
      </ol>
    </section>
  );
}

export function SnapAnalysisShowcase() {
  const items = [[Gauge, "Score, accuracy and attempt rate"], [BarChart3, "Section-wise and topic-wise results"], [TrendingDown, "What went wrong: careless, concept gap, time lost, never reached"], [Clock, "Time spent on every question against an even pace"], [ListChecks, "A worked solution for all 60 questions"], [FileText, "A detailed PDF, stamped with your name"]] as const;
  return (
    <section aria-labelledby="snap-analysis" className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
      <Reveal><p className="type-eyebrow text-oxblood">The analysis</p><h2 id="snap-analysis" className="type-display mt-3 text-ink">Not just a score. A list of what to fix.</h2><p className="mt-3 max-w-[50ch] text-[15px] leading-[1.7] text-ink-muted">A mock is only worth the time you spend learning from it. Every attempt ends with a breakdown built to show where your marks went.</p>
        <ul className="mt-5 flex flex-col gap-3">{items.map(([Icon, t]) => <li key={t} className="flex items-start gap-3 text-[13.5px] leading-[1.55] text-ink-2"><span className="mt-0.5 flex size-7 flex-none items-center justify-center rounded-lg bg-oxblood-tint text-oxblood"><Icon className="size-4" aria-hidden /></span>{t}</li>)}</ul></Reveal>
      <Reveal delay={100}>
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-lift" aria-label="Sample analysis">
          <div className="h-1.5 bg-gradient-to-r from-oxblood via-gold to-teal" />
          <div className="p-5">
            <div className="flex items-center justify-between"><p className="type-eyebrow text-oxblood">Sample analysis</p><span className="rounded-full bg-gold-tint px-2.5 py-1 text-[10px] font-semibold text-gold-deep">Illustration</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">{[["Score", "34.5 / 60"], ["Accuracy", "71%"], ["Attempted", "48 / 60"]].map(([k, v]) => <div key={k} className="rounded-xl bg-surface p-3"><p className="type-label text-ink-faint">{k}</p><p className="tnum mt-1.5 font-display text-[17px] font-bold text-ink">{v}</p></div>)}</div>
            <p className="mt-4 text-[12.5px] font-semibold text-ink">What went wrong</p>
            <div className="mt-2 flex flex-col gap-1.5">{[["Rushed and wrong", 5, "w-[40%]"], ["Long time, still wrong", 4, "w-[32%]"], ["Never reached", 8, "w-[64%]"]].map(([k, n, w]) => <div key={k as string}><div className="flex justify-between text-[11.5px] text-ink-2"><span>{k}</span><span className="tnum font-semibold">{n}</span></div><div className="mt-1 h-1.5 rounded-full bg-line-soft"><div className={clsx("h-full rounded-full bg-oxblood/80", w as string)} /></div></div>)}</div>
            <p className="mt-4 text-[12.5px] font-semibold text-ink">By section</p>
            <div className="mt-2 grid grid-cols-3 gap-2.5">{[["English", 78, "bg-teal"], ["Reasoning", 52, "bg-gold"], ["Quant & DI", 41, "bg-oxblood"]].map(([k, v, c]) => <div key={k as string} className="rounded-lg bg-surface p-2.5"><p className="text-[11px] text-ink-muted">{k}</p><div className="mt-1.5 h-1.5 rounded-full bg-line-soft"><div className={clsx("h-full rounded-full", c as string)} style={{ width: `${v}%` }} /></div><p className="tnum mt-1 text-[11px] font-semibold text-ink">{v}%</p></div>)}</div>
            <p className="mt-4 text-[12.5px] font-semibold text-ink">Weakest topics</p>
            <p className="mt-1 text-[12px] leading-[1.6] text-ink-muted">Data sufficiency · Seating arrangements · Para jumbles</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function SnapCatalogue({ mocks }: { mocks: CatalogueMock[] }) {
  if (mocks.length === 0) return null;
  const slots = Math.max(0, 10 - mocks.length);
  const live = mocks.filter((m) => m.released).length;
  return (
    <section aria-labelledby="snap-list">
      <Reveal className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="type-eyebrow text-oxblood">The mocks</p><h2 id="snap-list" className="type-display mt-3 text-ink">What&apos;s live and what&apos;s next</h2></div><p className="text-[12.5px] font-medium text-ink-muted"><span className="font-bold text-teal">{live} live</span> · more opening before the December exam</p></Reveal>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mocks.map((m) => (
          <Reveal key={m.id} as="li" className={clsx("flex items-center gap-3.5 rounded-2xl border p-4 shadow-xs", m.released ? "border-teal/30 bg-card" : "border-line bg-card")}><span className={clsx("flex size-11 flex-none items-center justify-center rounded-xl", m.released ? "bg-teal-tint text-teal" : "bg-line-soft text-ink-faint")}><FileText className="size-5" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-ink">{m.title}</span><span className="block text-[12px] text-ink-faint">{m.questions} questions · {m.durationMin} min</span></span><span className={clsx("flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold", m.released ? "bg-teal-tint text-teal" : "bg-line-soft text-ink-muted")}>{m.released ? "Live" : m.releaseAt ? `Opens ${fmtWhen(m.releaseAt)}` : "Coming soon"}</span></Reveal>
        ))}
        {Array.from({ length: slots }, (_, i) => (
          <li key={`slot-${i}`} aria-hidden className="flex items-center gap-3.5 rounded-2xl border border-dashed border-line-strong bg-surface/60 p-4"><span className="flex size-11 flex-none items-center justify-center rounded-xl bg-line-soft text-ink-faint"><Lock className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-ink-muted">Mock {mocks.length + i + 1}</span><span className="block text-[12px] text-ink-faint">60 questions · 60 min</span></span><span className="flex-none rounded-full bg-line-soft px-2.5 py-1 text-[11px] font-semibold text-ink-muted">Releasing soon</span></li>
        ))}
      </ul>
    </section>
  );
}

/** A compact promo for the normal home page (when the GDPI offering is also on sale). */
export function SnapBand({ p }: { p: SnapProducts }) {
  if (!p.test && !p.five && !p.ten) return null;
  return (
    <Reveal>
      <section aria-labelledby="snap-band" className="relative overflow-hidden rounded-3xl bg-night p-6 text-surface shadow-lift ring-1 ring-white/10 sm:p-8">
        <span aria-hidden className="absolute -right-12 -top-12 size-52 rounded-full bg-oxblood/40 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-[260px] flex-[1_1_380px]"><p className="type-eyebrow text-gold">New · SNAP 2026</p><h2 id="snap-band" className="mt-2 font-display text-[26px] font-bold leading-[1.15]">SNAP mocks on the real exam screen, with the analysis of what went wrong.</h2><p className="mt-2 text-[13px] leading-[1.65] text-dark-soft">Full-length, 60 questions in 60 minutes, +1 / −0.25. {p.test ? `Try the test mock for ${rupees(p.test)}` : ""}{p.five ? `, 5 mocks ${rupees(p.five)}` : ""}{p.ten ? `, 10 mocks ${rupees(p.ten)}` : ""}.</p></div>
          <div className="flex flex-wrap gap-2.5"><ButtonLink href="/mocks" variant="onDark" size="lg" data-track="snap_band_open">See the SNAP mocks <ArrowRight className="size-4" /></ButtonLink></div>
        </div>
      </section>
    </Reveal>
  );
}

/** Home page, while the GDPI offering is "coming soon": a short, honest teaser. */
export function GdpiTeaser() {
  return (
    <Reveal>
      <section aria-labelledby="gdpi-soon" className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card sm:p-9">
        <span aria-hidden className="absolute -left-10 -top-12 size-48 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-gold-tint px-3 py-1.5 text-[11.5px] font-semibold leading-none text-gold-deep"><Sparkles className="size-3.5" aria-hidden />Coming soon</span>
            <h2 id="gdpi-soon" className="type-display mt-4 text-ink">After SNAP: GD and PI prep with last year&apos;s converts.</h2>
            <p className="mt-3 max-w-[54ch] text-[14.5px] leading-[1.7] text-ink-muted">Mock PIs, panel interviews, GD batches and WAT/SOP reviews from people who converted the same calls. It opens after the SNAP mocks. If you&apos;re already a student, everything you bought is still in your account.</p>
            <div className="mt-5 flex flex-wrap gap-3"><ButtonLink href="/contact" variant="secondary">Ask us about it</ButtonLink><ButtonLink href="/login" variant="quiet">Already a student? Log in</ButtonLink></div></div>
          <div aria-hidden className="hidden rounded-2xl border border-dashed border-line-strong bg-surface p-5 md:block"><ShieldCheck className="size-8 text-teal" /><p className="mt-3 text-[13px] font-semibold text-ink">Built by students who converted</p><p className="mt-1 text-[12px] leading-[1.6] text-ink-muted">The same people who&apos;ll sit your panel are the ones who wrote these mocks&apos; analysis notes.</p></div>
        </div>
      </section>
    </Reveal>
  );
}

/** Shown in place of a GDPI page while it is "coming soon". */
export function ComingSoon({ what }: { what: string }) {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center px-5 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gold-tint text-gold-deep"><Sparkles className="size-7" aria-hidden /></span>
      <p className="type-eyebrow mt-5 text-gold-deep">Coming soon</p>
      <h1 className="type-page mt-2 text-ink">{what} is coming soon</h1>
      <p className="mt-3 max-w-[50ch] text-[14.5px] leading-[1.7] text-ink-muted">Interview prep with last year&apos;s converts opens after SNAP. In the meantime the SNAP 2026 mocks are live: real exam screen, instant analysis, and a worked solution for every question.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href="/mocks" size="lg">See the SNAP mocks <ArrowRight className="size-4" /></ButtonLink><ButtonLink href="/contact" variant="secondary" size="lg">Contact us</ButtonLink></div>
      <p className="mt-5 text-xs text-ink-faint">Already a student? <Link href="/login">Log in</Link> to see your sessions and credits.</p>
    </div>
  );
}
