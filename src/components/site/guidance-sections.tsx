import clsx from "clsx";
import { ArrowRight, CalendarCheck, Check, Compass, GraduationCap, ListChecks, MessageCircle, PhoneCall, Sparkles, Target, Video } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { Price, buyHref } from "@/components/site/price";
import { formatPaise } from "@/lib/money";
import { priceView, type CatalogProduct } from "@/lib/pricing";

export interface GuidanceProducts { guide: CatalogProduct | null; strategy: CatalogProduct | null }

const rupees = (p: CatalogProduct) => formatPaise(priceView(p).payablePaise);

/** The home page strip under the mocks: two one-to-one calls, with their prices. */
export function GuidanceBand({ p }: { p: GuidanceProducts }) {
  if (!p.guide && !p.strategy) return null;
  const seats = p.strategy?.earlyBird && p.strategy.earlyBird.seatsLeft > 0 ? p.strategy.earlyBird.seatsLeft : null;
  return (
    <Reveal>
      <section aria-labelledby="guidance-band" className="relative overflow-hidden rounded-3xl bg-night p-6 text-surface shadow-lift ring-1 ring-white/5 sm:p-9">
        <span aria-hidden className="pointer-events-none absolute -right-14 -top-16 size-64 rounded-full bg-oxblood/45 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 left-1/4 size-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative grid items-center gap-7 md:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="type-eyebrow text-gold">One-to-one guidance</p>
            <h2 id="guidance-band" className="type-display mt-3 text-surface">Not sure what to do next? Talk it through.</h2>
            <p className="mt-3 max-w-[54ch] text-[14.5px] leading-[1.7] text-dark-soft">A focused one-to-one call on your exam plan: where you stand, which exams and colleges to aim for, and what to do with the weeks you have left. Honest advice, and you leave with a plan.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href="/guidance" size="lg" variant="onDark">See the calls <ArrowRight className="size-4" aria-hidden /></ButtonLink>
              {seats && <span className="rounded-full bg-gold/20 px-3 py-1.5 text-[11.5px] font-semibold text-gold">Early-bird price · {seats} seat{seats === 1 ? "" : "s"} left</span>}
            </div>
          </div>
          <div className="grid gap-3">
            {p.guide && <CallChip title="Guidance call" meta="30 minutes" price={rupees(p.guide)} />}
            {p.strategy && <CallChip title="Strategy call" meta="45 minutes, detailed" price={rupees(p.strategy)} was={priceView(p.strategy).strikePaise !== null ? formatPaise(priceView(p.strategy).strikePaise as number) : undefined} />}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function CallChip({ title, meta, price, was }: { title: string; meta: string; price: string; was?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur">
      <div><p className="text-[14px] font-semibold text-surface">{title}</p><p className="mt-0.5 text-[12px] text-dark-muted">{meta} · one-to-one</p></div>
      <p className="tnum font-display text-[22px] font-bold leading-none text-surface">{price}{was && <span className="ml-1.5 text-[12px] font-normal text-dark-muted line-through">{was}</span>}</p>
    </div>
  );
}

const COVER = [
  { icon: Target, title: "Where you stand", body: "Your scores, your sections and your timeline, read honestly." },
  { icon: Compass, title: "Which exams to take", body: "SNAP, CAT, XAT and others: what suits your profile and your dates." },
  { icon: GraduationCap, title: "Colleges that fit", body: "A realistic spread of colleges for your profile and your budget." },
  { icon: ListChecks, title: "A plan for the weeks left", body: "What to study, which mocks to take and what to drop." },
  { icon: MessageCircle, title: "Your questions", body: "Work experience, gaps, forms, interviews: ask what is on your mind." },
  { icon: CalendarCheck, title: "A next step you can act on", body: "You leave with a short, clear list for the next two weeks." },
];

const STEPS = [
  { icon: Check, title: "Choose a call", body: "Pick the trial or the strategy call and pay securely online." },
  { icon: PhoneCall, title: "We phone you", body: "Give us your mobile number when you pay. We call you within one working day to agree a time." },
  { icon: Video, title: "Have the call", body: "One-to-one, with an expert from our team. Bring your questions." },
  { icon: ListChecks, title: "Leave with a plan", body: "A short list of what to do next, while it is fresh." },
];

function CallCard({ product, label, bullets, tone }: { product: CatalogProduct; label?: string; bullets: string[]; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <article className={clsx("group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1", dark ? "border-white/10 bg-night text-surface shadow-lift hover:shadow-glow" : "border-line bg-card shadow-card hover:shadow-lift")}>
      <span aria-hidden className={clsx("absolute inset-x-0 top-0 h-[3px]", dark ? "bg-gradient-to-r from-gold via-oxblood to-gold" : "bg-brand")} />
      <div className="flex items-start justify-between gap-2">
        <h3 className={clsx("font-display text-[20px] font-bold leading-[1.25]", dark ? "text-surface" : "text-ink")}>{product.name}</h3>
        {label && <span className={clsx("whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10.5px] font-bold leading-none", dark ? "bg-gold/20 text-gold" : "bg-oxblood-tint text-oxblood")}>{label}</span>}
      </div>
      <p className={clsx("mt-2 text-[13px] leading-[1.6]", dark ? "text-dark-soft" : "text-ink-muted")}>{product.summary}</p>
      <div className="mt-4"><Price product={product} className={clsx("text-[38px]", dark ? "text-surface" : "text-ink")} strikeSize="text-sm" strikeClassName={dark ? "text-dark-muted" : "text-ink-faint"} onDark={dark} /></div>
      <ul className="mt-5 flex flex-1 flex-col gap-2">
        {bullets.map((b) => <li key={b} className="flex items-start gap-2.5 text-[13px] leading-[1.5]"><span className={clsx("mt-0.5 flex size-5 flex-none items-center justify-center rounded-full", dark ? "bg-white/10 text-gold" : "bg-teal-tint text-teal")}><Check className="size-3" aria-hidden /></span><span className={dark ? "text-dark-body" : "text-ink-2"}>{b}</span></li>)}
      </ul>
      <ButtonLink href={buyHref(product)} size="lg" variant={dark ? "onDark" : "dark"} className="mt-5 rounded-[9px] py-3.5" data-track={`guidance_buy_${product.slug}`}>Book the {product.name.toLowerCase()}</ButtonLink>
    </article>
  );
}

/** The full /guidance page. */
export function GuidancePage({ p, refundHours }: { p: GuidanceProducts; refundHours: number }) {
  const faqs = [
    { q: "Who will I talk to?", a: "An expert from our team who has been through the MBA admissions process and has helped many aspirants plan theirs." },
    { q: "How long is the call and how does it work?", a: "The guidance call is 30 minutes and the detailed strategy call is 45 minutes, both one-to-one. After you pay, we phone you on the mobile number you gave us, within one working day, and agree a time that suits you." },
    { q: "What should I bring?", a: "Your scores so far, the exams and dates you are considering, and your questions. A short list of colleges you like helps." },
    { q: "Why do you need my phone number?", a: "So we can call you. It is the only way we contact you about the call, and we do not share it. Please give a number you answer." },
    { q: "Can I get a refund?", a: `If you have not used the call, ask within ${refundHours} hours of paying and you get your money back. See our refund policy for the details.` },
    { q: "Do you guarantee admission?", a: "No. We give honest guidance and a plan. The result depends on your preparation and the exams." },
  ];
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-5 pb-6 pt-5 sm:gap-10">
      <section aria-labelledby="g-title" className="relative overflow-hidden rounded-3xl bg-night p-7 text-surface shadow-lift ring-1 ring-white/5 sm:p-12">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-80 rounded-full bg-oxblood/45 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative max-w-[640px]">
          <p className="type-eyebrow text-gold">One-to-one guidance</p>
          <h1 id="g-title" className="type-display mt-3 text-surface" style={{ fontSize: "clamp(30px, 5vw, 46px)" }}>Talk it through with someone who has been there.</h1>
          <p className="mt-4 text-[15px] leading-[1.7] text-dark-soft">A focused one-to-one call on your exam plan: SNAP, CAT, XAT and the colleges that fit your profile. Honest, practical, and you leave with a clear next step.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="#calls" size="lg" variant="onDark">Choose a call <ArrowRight className="size-4" aria-hidden /></ButtonLink>
            {p.guide && <ButtonLink href={buyHref(p.guide)} size="lg" variant="secondary">Guidance call · {rupees(p.guide)}</ButtonLink>}
          </div>
        </div>
      </section>

      <section id="calls" aria-labelledby="g-calls" className="scroll-mt-24">
        <Reveal className="mb-5 max-w-[620px]"><p className="type-eyebrow text-oxblood">Pick a call</p><h2 id="g-calls" className="type-display mt-3 text-ink">Quick guidance, or a detailed plan.</h2></Reveal>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}>
          {p.guide && <Reveal><CallCard product={p.guide} label="30 minutes" tone="light" bullets={p.guide.includes.length ? p.guide.includes : ["30 minutes, one-to-one on a call", "An honest read on where you stand"]} /></Reveal>}
          {p.strategy && <Reveal delay={80}><CallCard product={p.strategy} label={p.strategy.earlyBird && p.strategy.earlyBird.seatsLeft > 0 ? `Early bird · ${p.strategy.earlyBird.seatsLeft} left` : "45 minutes, detailed"} tone="dark" bullets={p.strategy.includes.length ? p.strategy.includes : ["45 minutes, one-to-one on a call", "A detailed plan for your next steps"]} /></Reveal>}
        </div>
      </section>

      <section aria-labelledby="g-cover" className="rounded-3xl border border-line bg-card px-6 py-10 shadow-card sm:px-10">
        <Reveal className="mx-auto max-w-[620px] text-center"><p className="type-eyebrow text-oxblood">What we cover</p><h2 id="g-cover" className="type-display mt-3 text-ink">Everything that is on your mind, in order.</h2></Reveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COVER.map((c, i) => (
            <Reveal key={c.title} as="li" delay={i * 50} className="flex gap-3.5">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-oxblood-tint text-oxblood"><c.icon className="size-5" aria-hidden /></span>
              <span><span className="block text-[14px] font-bold text-ink">{c.title}</span><span className="mt-1 block text-[13px] leading-[1.55] text-ink-muted">{c.body}</span></span>
            </Reveal>
          ))}
        </ul>
      </section>

      <section aria-labelledby="g-how">
        <Reveal className="mx-auto max-w-[620px] text-center"><p className="type-eyebrow text-oxblood">How it works</p><h2 id="g-how" className="type-display mt-3 text-ink">Four steps, and we do the scheduling.</h2></Reveal>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} as="li" delay={i * 70} className="flex flex-col items-center text-center">
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow"><s.icon className="size-5" aria-hidden /><span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">{i + 1}</span></span>
              <p className="mt-3 text-[14px] font-bold text-ink">{s.title}</p><p className="mt-1 max-w-[26ch] text-[12.5px] leading-[1.55] text-ink-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="g-faq" className="mx-auto w-full max-w-[760px]">
        <Reveal><p className="type-eyebrow text-oxblood">Questions</p><h2 id="g-faq" className="type-display mt-3 text-ink">Before you book</h2></Reveal>
        <div className="mt-5 flex flex-col gap-2.5">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-card px-5 py-4 shadow-xs">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold text-ink">{f.q}<Sparkles className="size-4 flex-none text-gold transition-transform group-open:rotate-12" aria-hidden /></summary>
              <p className="mt-2.5 text-[13.5px] leading-[1.7] text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="rounded-3xl border border-line bg-gradient-to-br from-oxblood-tint via-white to-gold-tint p-7 text-center shadow-card sm:p-10">
          <h2 className="type-display text-ink">Ready to get clear?</h2>
          <p className="mx-auto mt-2 max-w-[48ch] text-[14px] leading-[1.7] text-ink-muted">Practising for SNAP as well? The mocks show you where your marks go; the call turns that into a plan.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3"><ButtonLink href="#calls" size="lg">Choose a call</ButtonLink><ButtonLink href="/mocks" size="lg" variant="secondary">See the SNAP mocks</ButtonLink></div>
        </section>
      </Reveal>
    </div>
  );
}
