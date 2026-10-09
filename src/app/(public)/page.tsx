import { GdpiTeaser, SnapAnalysisShowcase, SnapBand, SnapCatalogue, SnapFeatures, SnapHero, SnapHow, SnapPacks } from "@/components/site/snap-sections";
import { SNAP_FAQS } from "@/lib/snap-content";
import { listMocksFor } from "@/server/mocks";
import { gdpiComingSoon } from "@/server/site-mode";
import { DirectSpotlight, FaqTeaser, FinalCta, Hero, HowItWorks, MentorShowcase, PanelSpotlight, StatsStrip, TrialStrip } from "@/components/site/home-sections";
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
  const [soon, snapTest, snapFive, snapTen] = await Promise.all([gdpiComingSoon(), getProduct("snap-test-mock"), getProduct("snap-mocks-5"), getProduct("snap-mocks-10")]);
  const snap = { test: snapTest, five: snapFive, ten: snapTen };
  if (soon) {
    // The GDPI offering is "coming soon": the front page is the SNAP mocks.
    const { mocks } = await listMocksFor(null);
    return (
      <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-5 pb-6 pt-5 sm:gap-10">
        <SnapHero p={snap} />
        <SnapFeatures />
        <SnapPacks p={snap} />
        <SnapAnalysisShowcase />
        <SnapHow />
        <SnapCatalogue mocks={mocks.map((m) => ({ id: m.id, title: m.title, isTest: m.isTest, questions: m.questions, durationMin: m.durationMin, released: m.released, releaseAt: m.releaseAt }))} />
        <GdpiTeaser />
        <FaqTeaser items={SNAP_FAQS.slice(0, 6)} />
        <FinalCta snap />
      </div>
    );
  }
  const [products, featured, policy, how, questions, mentors] = await Promise.all([getProducts(), getProduct(FEATURED_SLUG), getPolicy(), steps(), faqs(), getPublicMentors()]);
  const trials = products.filter((p) => p.slug.startsWith("trial-")).sort((a, b) => a.pricePaise - b.pricePaise);
  const direct = products.filter((p) => p.withAdmin && !p.slug.startsWith("trial-"));
  const seats = direct.map((p) => p.earlyBird?.seatsLeft ?? 0);
  const cheapest = Math.min(...products.filter((p) => !p.enrolledOnly && !p.slug.startsWith("trial-") && !p.slug.startsWith("snap-")).map((p) => priceView(p).payablePaise));

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-5 pb-6 pt-5 sm:gap-10">
      <ReferralBanner next="/" />
      <Hero featured={featured} seatsLeft={seats.length ? Math.max(...seats) : null} feedbackHours={policy.feedbackDueHours} />
      <SnapBand p={snap} />
      <TrialStrip trials={trials} />
      <StatsStrip feedbackHours={policy.feedbackDueHours} fromPaise={Number.isFinite(cheapest) ? cheapest : 9900} />
      <HowItWorks steps={how} />
      <PanelSpotlight product={products.find((p) => p.slug === "panel-pi") ?? null} />

      <section aria-labelledby="everything">
        <Reveal className="mb-5 max-w-[560px]">
          <p className="type-eyebrow text-oxblood">What we offer</p>
          <h2 id="everything" className="type-display mt-3 text-ink">Pick one session, or the whole season</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.filter((p) => !p.withAdmin && !p.enrolledOnly && !p.slug.startsWith("trial-") && !p.slug.startsWith("snap-") && p.slug !== "panel-pi").map((p, i) => (
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
