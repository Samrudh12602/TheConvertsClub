import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CalendarClock, ClipboardList, Clock, Crown, IndianRupee, MessageSquareText, ShieldCheck, ShoppingBag, Sparkles, Star, Video } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CountUp, Reveal } from "@/components/ui/motion";
import { Price, buyHref } from "@/components/site/price";
import type { CatalogProduct } from "@/lib/pricing";
import { priceView } from "@/lib/pricing";
import type { PublicMentor } from "@/lib/content";

/* ---------------------------------------------------------------- hero */

const priceLabel = (p: CatalogProduct) => `₹${Math.round(priceView(p).payablePaise / 100)}`;

export function Hero({ featured, seatsLeft, feedbackHours, trials }: { featured: CatalogProduct | null; seatsLeft: number | null; feedbackHours: number; trials: CatalogProduct[] }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-hero shadow-lift">
      <div className="grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-oxblood-line bg-white/80 px-3 py-1.5 text-[11.5px] font-semibold leading-none text-oxblood shadow-xs backdrop-blur">
            <span aria-hidden className="relative flex size-2"><span className="absolute inline-flex size-2 animate-ring rounded-full bg-teal/50" /><span className="relative inline-flex size-2 rounded-full bg-teal" /></span>
            GDPI prep, student-led
          </span>
          <h1 className="type-display mt-5 text-ink sm:text-[52px] sm:leading-[1.04]">
            Mocks with last year&apos;s <span className="bg-gradient-to-r from-oxblood via-[#b4414f] to-gold bg-clip-text text-transparent">converts</span>, at a price you&apos;ll actually pay.
          </h1>
          <p className="mt-5 max-w-[50ch] text-pretty text-[16px] leading-[1.7] text-ink-muted">
            One mock or the whole season. Real panel-style interviews, written feedback you can act on, and no sales call, no bundle you didn&apos;t want.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink href="/packages" size="lg" className="px-6">See packages <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="/free-guide" variant="secondary" size="lg" className="px-5">Free interview checklist</ButtonLink>
          </div>
          {trials.length > 0 && (
            <a href="#try-us" className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-teal-line bg-teal-tint px-3.5 py-2.5 text-[12.5px] font-semibold leading-[1.35] text-teal no-underline shadow-xs transition hover:shadow-card hover:no-underline">
              <Sparkles aria-hidden className="size-4 flex-none" />
              Not sure yet? Try us first: {trials.map((t) => `${t.name.replace("Trial ", "").replace(/^./, (c) => c.toUpperCase())} ${priceLabel(t)}`).join(" · ")}
              <ArrowRight aria-hidden className="size-3.5 flex-none" />
            </a>
          )}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12.5px] font-medium text-ink-2">
            {[[ShieldCheck, "Mentors who converted"], [Clock, `Feedback within ${feedbackHours} hours`], [IndianRupee, "Prices in the open"]].map(([I, t]) => {
              const Icon = I as typeof ShieldCheck;
              return <li key={t as string} className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-teal-tint text-teal"><Icon className="size-3.5" aria-hidden /></span>{t as string}</li>;
            })}
          </ul>
          {seatsLeft !== null && seatsLeft > 0 && (
            <Link href="/packages" className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-line bg-gold-tint px-3.5 py-2 text-[12px] font-semibold leading-none text-gold-deep no-underline shadow-xs transition-shadow hover:shadow-card hover:no-underline">
              <Sparkles className="size-3.5" aria-hidden /> Early bird with Samrudh · {seatsLeft} seats left <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
          {trials.length > 0 ? (
            <div id="try-us" className="relative scroll-mt-24 overflow-hidden rounded-2xl bg-night p-6 text-surface shadow-pop ring-1 ring-white/10">
              <span aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-teal/30 blur-3xl" />
              <span aria-hidden className="absolute -bottom-12 -left-8 size-36 rounded-full bg-oxblood/40 blur-3xl" />
              <p className="type-eyebrow relative text-gold">Try us first</p>
              <h2 className="relative mt-2.5 font-display text-[23px] font-bold leading-[1.2]">Feel the quality before you commit.</h2>
              <p className="relative mt-2.5 text-[12.5px] leading-[1.65] text-dark-soft">Same sessions, same standard, taken by Samrudh himself. Pay a token amount and see how good we really are.</p>
              <ul className="relative mt-5 flex flex-col gap-2.5">
                {trials.map((t) => (
                  <li key={t.slug} className="flex items-center gap-3 rounded-xl bg-white/[0.07] p-3.5 ring-1 ring-white/10">
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-white/10 text-gold">{t.slug === "trial-guidance" ? <MessageSquareText className="size-5" aria-hidden /> : <Video className="size-5" aria-hidden />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold leading-[1.25]">{t.slug === "trial-guidance" ? "Guidance call" : "Mock PI"}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-[1.35] text-dark-soft">{t.slug === "trial-guidance" ? "25 minutes with Samrudh" : "A real mock with feedback"}</span>
                    </span>
                    <span className="tnum font-display text-[24px] font-bold leading-none">{priceLabel(t)}</span>
                    <ButtonLink href={buyHref(t)} variant="onDark" size="sm" className="flex-none">Book</ButtonLink>
                  </li>
                ))}
              </ul>
              <p className="relative mt-4 text-[11.5px] leading-[1.6] text-dark-muted">It&apos;s a paid trial, not free, because good sessions cost real time and a small price keeps the slot for people who show up. One of each per person.</p>
              {featured && <Link href={buyHref(featured)} className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-[12.5px] font-semibold text-dark-text no-underline hover:text-white hover:no-underline"><span>Ready to go all in? <span className="text-white">{featured.name}</span></span><span className="tnum flex items-center gap-2 text-[15px] text-white">{priceLabel(featured)}<ArrowRight aria-hidden className="size-4" /></span></Link>}
            </div>
          ) : featured && (
            <div className="relative overflow-hidden rounded-2xl bg-night p-6 text-surface shadow-pop ring-1 ring-white/10">
              <p className="type-eyebrow relative text-dark-muted">Most bought</p>
              <h2 className="relative mt-2.5 font-display text-[21px] font-bold leading-[1.2]">{featured.name}</h2>
              <div className="relative mt-3"><Price product={featured} className="text-[36px] text-surface" strikeSize="text-sm" strikeClassName="text-dark-muted" onDark /></div>
              <ButtonLink href={buyHref(featured)} variant="onDark" size="lg" block className="relative mt-5 min-h-[46px]">Buy now <ArrowRight className="size-4" /></ButtonLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- stats */

export function StatsStrip({ feedbackHours, fromPaise }: { feedbackHours: number; fromPaise: number }) {
  const tiles: { value: number; suffix?: string; prefix?: string; label: string; tone: string }[] = [
    { value: 1, suffix: " hr", label: "per live mock, one-to-one", tone: "text-oxblood" },
    { value: feedbackHours, suffix: " hrs", label: "to your written feedback", tone: "text-teal" },
    { value: 6, label: "focus areas to choose from", tone: "text-gold-deep" },
    { value: Math.round(fromPaise / 100), prefix: "₹", label: "is where prices start", tone: "text-indigo" },
  ];
  return (
    <section aria-label="At a glance" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t, i) => (
        <Reveal key={t.label} delay={i * 70} className="rounded-2xl border border-line bg-card p-5 text-center shadow-card">
          <p className={clsx("font-display text-[34px] font-bold leading-none", t.tone)}>{t.prefix}<CountUp value={t.value} />{t.suffix}</p>
          <p className="mt-2 text-[12.5px] leading-[1.45] text-ink-muted">{t.label}</p>
        </Reveal>
      ))}
    </section>
  );
}

/* --------------------------------------------------------- how it works */

const STEP_ICONS = [ShoppingBag, ClipboardList, CalendarClock, Video, MessageSquareText];

export function HowItWorks({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <section aria-labelledby="how" className="rounded-3xl border border-line bg-card px-6 py-10 shadow-card sm:px-10">
      <Reveal className="mx-auto max-w-[620px] text-center">
        <p className="type-eyebrow text-oxblood">How it works</p>
        <h2 id="how" className="type-display mt-3 text-ink">From payment to feedback in five steps</h2>
      </Reveal>
      <ol className="relative mt-10 grid gap-6 md:grid-cols-5">
        <span aria-hidden className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent md:block" />
        {steps.map((s, i) => {
          const Icon = STEP_ICONS[i] ?? Star;
          return (
            <Reveal as="li" key={s.n} delay={i * 90} className="relative flex flex-col items-center text-center">
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-glow"><Icon className="size-5" aria-hidden /><span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-oxblood shadow-card ring-1 ring-line">{i + 1}</span></span>
              <h3 className="mt-4 font-display text-[15px] font-bold leading-[1.25] text-ink">{s.title}</h3>
              <p className="mt-2 text-pretty text-[12.5px] leading-[1.6] text-ink-muted">{s.body}</p>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------- with Samrudh spotlight */

export function DirectSpotlight({ items }: { items: CatalogProduct[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="direct" className="relative overflow-hidden rounded-3xl bg-night p-7 text-surface shadow-pop ring-1 ring-white/10 sm:p-10">
      <span aria-hidden className="absolute -left-10 -top-16 size-64 rounded-full bg-gold/25 blur-3xl" />
      <span aria-hidden className="absolute -bottom-20 right-0 size-72 rounded-full bg-oxblood/40 blur-3xl" />
      <Reveal className="relative max-w-[560px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-[11.5px] font-semibold leading-none text-[#e8c476] ring-1 ring-gold/30"><Crown className="size-3.5" aria-hidden /> Straight from the founder</span>
        <h2 id="direct" className="type-display mt-4 text-surface">Want it directly with Samrudh?</h2>
        <p className="mt-3 text-[15px] leading-[1.7] text-dark-soft">A one-hour mock PI or a focused strategy call, one-to-one with the person who built this. Limited early-bird seats.</p>
      </Reveal>
      <div className="relative mt-7 grid gap-4 md:grid-cols-2">
        {items.map((p, i) => (
          <Reveal key={p.slug} delay={i * 100} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur transition-colors hover:bg-white/[0.08]">
            <h3 className="font-display text-[18px] font-bold leading-[1.25]">{p.name}</h3>
            <div className="mt-3"><Price product={p} className="text-[30px] text-surface" strikeSize="text-sm" strikeClassName="text-dark-muted" onDark /></div>
            <p className="mt-2.5 text-[12.5px] leading-[1.6] text-dark-soft">{p.summary}</p>
            <ButtonLink href={buyHref(p)} variant="onDark" size="md" className="mt-4">Reserve a seat <ArrowRight className="size-4" /></ButtonLink>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- mentors */

const AVATAR_TINTS = ["from-oxblood to-[#b4414f]", "from-teal to-[#2a8c83]", "from-gold to-[#d4a04a]", "from-indigo to-[#4a49a6]", "from-plum to-[#8a4a82]"];

export function Avatar({ name, src, size = 56, i = 0 }: { name: string; src: string | null; size?: number; i?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- private-backed mentor photo, not an optimizable static asset
    <img src={src} alt="" width={size} height={size} className="flex-none rounded-2xl object-cover shadow-card ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className={clsx("flex flex-none items-center justify-center rounded-2xl bg-gradient-to-br font-display font-bold text-white shadow-card ring-2 ring-white", AVATAR_TINTS[i % AVATAR_TINTS.length])} style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>
  );
}

export function MentorShowcase({ mentors }: { mentors: PublicMentor[] }) {
  if (mentors.length === 0) return null;
  return (
    <section aria-labelledby="mentors" className="rounded-3xl border border-line bg-card px-6 py-10 shadow-card sm:px-10">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[560px]"><p className="type-eyebrow text-oxblood">Your mentors</p><h2 id="mentors" className="type-display mt-3 text-ink">People who sat the same panels</h2></div>
        <Link href="/mentors" className="inline-flex items-center gap-1.5 text-[13px] font-semibold no-underline hover:no-underline">Meet everyone <ArrowRight className="size-4" /></Link>
      </Reveal>
      <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mentors.slice(0, 4).map((m, i) => (
          <Reveal as="li" key={m.id} delay={i * 80} className="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lift">
            <Avatar name={m.name} src={m.photoSrc} i={i} />
            <h3 className="mt-3.5 font-display text-[15.5px] font-bold leading-[1.2] text-ink">{m.name}</h3>
            <p className="mt-1 text-[12px] font-semibold leading-[1.3] text-oxblood">{m.college}</p>
            {m.rating && <p className="tnum mt-2 flex items-center gap-1 text-[12px] font-semibold text-gold-deep"><Star className="size-3.5 fill-gold text-gold" aria-hidden />{m.rating.avg.toFixed(1)} <span className="font-normal text-ink-faint">({m.rating.count})</span></p>}
            {m.bio && <p className="mt-2 line-clamp-3 text-pretty text-[12.5px] leading-[1.6] text-ink-muted">{m.bio}</p>}
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ----------------------------------------------------------------- FAQ */

export function FaqTeaser({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section aria-labelledby="faq" className="grid gap-8 rounded-3xl border border-line bg-card px-6 py-10 shadow-card sm:px-10 lg:grid-cols-[0.8fr_1.2fr]">
      <Reveal>
        <p className="type-eyebrow text-oxblood">Questions</p>
        <h2 id="faq" className="type-display mt-3 text-ink">Before you buy</h2>
        <p className="mt-3 max-w-[34ch] text-[14px] leading-[1.7] text-ink-muted">The honest answers, in plain words.</p>
        <Link href="/faq" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold no-underline hover:no-underline">All questions <ArrowRight className="size-4" /></Link>
      </Reveal>
      <div className="flex flex-col gap-2.5">
        {items.map((f, i) => (
          <Reveal key={f.q} delay={i * 70}>
            <details className="group rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors open:bg-white open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold leading-[1.4] text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="flex size-6 flex-none items-center justify-center rounded-full bg-line-soft text-ink-2 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2.5 text-pretty text-[13.5px] leading-[1.7] text-ink-muted">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- closing CTA */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-night px-6 py-12 text-center shadow-pop ring-1 ring-white/10 sm:px-10">
      <span aria-hidden className="absolute left-1/2 top-0 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-oxblood/50 blur-3xl" />
      <Reveal className="relative mx-auto max-w-[560px]">
        <h2 className="type-display text-surface">Your call is coming. Be the one who&apos;s already done it ten times.</h2>
        <p className="mt-4 text-[15px] leading-[1.7] text-dark-soft">Start with one mock, or take the whole season.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/packages" variant="onDark" size="lg" className="px-6">See packages <ArrowRight className="size-4" /></ButtonLink>
          <ButtonLink href="/contact" variant="secondary" size="lg" className="border-white/15 bg-white/10 text-surface hover:bg-white/15 hover:text-surface">Talk to us</ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
