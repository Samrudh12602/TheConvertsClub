import Link from "next/link";
import { ArrowRight, Ban, Check, MessageCircleMore } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { packages, publicMentors, testimonials } from "@/lib/data";
import { formatINR } from "@/lib/format";

const STEPS = [
  { title: "Pay & onboard", description: "Pick a package, complete a 4-step profile: your calls, documents and prep gaps." },
  { title: "Practice with mentors", description: "Book Mock PIs, GD/GE and WAT with students who cracked the same interviews." },
  { title: "Walk in ready", description: "Structured feedback after every session, tracked against a readiness score." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 0%, rgba(201,162,75,0.25) 0%, transparent 60%), radial-gradient(40% 40% at 10% 100%, rgba(122,90,248,0.12) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-2xl">
            <Badge variant="gold">GDPI season · Jan–Mar</Badge>
            <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] text-white">
              You got the call.
              <br />
              Now let&apos;s <span className="text-gold-400">convert it.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base sm:text-lg text-navy-100">
              Student-led GDPI preparation for MBA aspirants who&apos;ve already cracked IIM, XLRI, MDI, SPJIMR and more.
              Personalised, affordable, no fluff.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink size="lg" href="/packages">
                See packages <ArrowRight size={17} />
              </ButtonLink>
              <Link
                href="/checkout?service=quick-guidance"
                className="inline-flex h-13 items-center justify-center rounded-[var(--radius-md)] border border-white/20 px-7 text-base font-semibold text-white hover:bg-white/10"
              >
                Book Quick Guidance ₹299
              </Link>
            </div>
            <p className="mt-6 text-sm text-navy-100/70 flex items-center gap-2">
              <Ban size={15} className="text-gold-400" /> No lectures. No CAT coaching. No unnecessary packages.
            </p>
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-8 text-white/80 text-sm">
            <span>
              <strong className="text-white font-display text-xl">[50+]</strong> students mentored in Year 1
            </span>
            <span>
              <strong className="text-white font-display text-xl">[VERIFIED STAT]</strong> conversion rate — coming soon
            </span>
            <span>
              <strong className="text-white font-display text-xl">6</strong> mentors from IIM, XLRI, SPJIMR & more
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="relative">
              <span className="font-display text-4xl font-bold text-accent/25">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 font-semibold text-ink text-lg">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Package teasers */}
      <section className="bg-sunken/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Packages built for conversion</h2>
              <p className="mt-2 text-muted max-w-lg">Bundled Mock PIs, GD/GE, WAT and SOP review — priced for the whole season.</p>
            </div>
            <Link href="/packages" className="text-sm font-semibold text-brand flex items-center gap-1">
              Compare all packages <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={pkg.badge ? "border-accent ring-1 ring-accent" : ""}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-ink">{pkg.name}</h3>
                  {pkg.badge && <Badge variant="gold">{pkg.badge}</Badge>}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-ink tabular-nums">{formatINR(pkg.price)}</span>
                  <span className="text-sm text-muted line-through tabular-nums">{formatINR(pkg.mrp)}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {pkg.inclusions.slice(0, 4).map((inc) => (
                    <li key={inc} className="flex items-center gap-2 text-sm text-ink">
                      <Check size={15} className="text-success shrink-0" /> {inc}
                    </li>
                  ))}
                </ul>
                <ButtonLink href="/packages" fullWidth variant={pkg.badge ? "primary" : "secondary"} className="mt-5">
                  View details
                </ButtonLink>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Learn from who&apos;s been there</h2>
          <Link href="/mentors" className="text-sm font-semibold text-brand flex items-center gap-1">
            Meet all mentors <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publicMentors.slice(0, 3).map((m) => (
            <Card key={m.id} className="flex gap-4">
              <Avatar name={m.name} size={52} />
              <div>
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-xs text-muted">
                  {m.college} · {m.batch}
                </p>
                <p className="mt-2 text-sm text-ink">{m.bio}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-navy-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white text-center">What converts sound like</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6">
                <p className="text-white/90 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar name={t.name} size={36} />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gold-400">{t.institute}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <MessageCircleMore className="mx-auto text-accent" size={32} />
        <h2 className="font-display mt-4 text-3xl sm:text-4xl font-semibold text-ink">Your interview is weeks away.</h2>
        <p className="mt-3 text-muted max-w-md mx-auto">Start with a ₹299 guidance call, or go straight to a full package.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink size="lg" href="/packages">
            See packages
          </ButtonLink>
          <ButtonLink size="lg" variant="outline" href="/checkout?service=quick-guidance">
            Book Quick Guidance ₹299
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
