import { DirectSpotlight, FaqTeaser, FinalCta, Hero, HowItWorks, MentorShowcase, StatsStrip } from "@/components/site/home-sections";
import { ProductTile } from "@/components/site/product-tile";
import { ReferralBanner } from "@/components/site/referral-banner";
import { Reveal } from "@/components/ui/motion";
import { getProduct, getProducts } from "@/lib/catalog";
import { faqs, getPublicMentors, steps } from "@/lib/content";
import { FEATURED_SLUG, priceView } from "@/lib/pricing";
import { getPolicy } from "@/lib/settings-db";

// Reads the visitor's referral cookie to show mentor-code prices, so this page renders per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, featured, policy, how, questions, mentors] = await Promise.all([getProducts(), getProduct(FEATURED_SLUG), getPolicy(), steps(), faqs(), getPublicMentors()]);
  const trials = products.filter((p) => p.slug.startsWith("trial-")).sort((a, b) => a.pricePaise - b.pricePaise);
  const direct = products.filter((p) => p.withAdmin && !p.slug.startsWith("trial-"));
  const seats = direct.map((p) => p.earlyBird?.seatsLeft ?? 0);
  const cheapest = Math.min(...products.filter((p) => !p.enrolledOnly && !p.slug.startsWith("trial-")).map((p) => priceView(p).payablePaise));

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-5 pb-6 pt-5 sm:gap-10">
      <ReferralBanner next="/" />
      <Hero featured={featured} seatsLeft={seats.length ? Math.max(...seats) : null} feedbackHours={policy.feedbackDueHours} trials={trials} />
      <StatsStrip feedbackHours={policy.feedbackDueHours} fromPaise={Number.isFinite(cheapest) ? cheapest : 9900} />
      <HowItWorks steps={how} />

      <section aria-labelledby="everything">
        <Reveal className="mb-5 max-w-[560px]">
          <p className="type-eyebrow text-oxblood">What we offer</p>
          <h2 id="everything" className="type-display mt-3 text-ink">Pick one session, or the whole season</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.filter((p) => !p.withAdmin && !p.slug.startsWith("trial-")).map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 6) * 60} className="h-full"><ProductTile product={p} /></Reveal>
          ))}
        </div>
      </section>

      <DirectSpotlight items={direct} />
      <MentorShowcase mentors={mentors} />
      <FaqTeaser items={questions.slice(0, 5)} />
      <FinalCta />
    </div>
  );
}
