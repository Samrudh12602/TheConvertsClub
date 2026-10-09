import type { Metadata } from "next";
import Link from "next/link";
import { FaqTeaser } from "@/components/site/home-sections";
import { GdpiTeaser, SnapAnalysisShowcase, SnapCatalogue, SnapHero, SnapHow, SnapPacks } from "@/components/site/snap-sections";
import { getProduct } from "@/lib/catalog";
import { SNAP_FAQS } from "@/lib/snap-content";
import { listMocksFor } from "@/server/mocks";
import { gdpiComingSoon } from "@/server/site-mode";
import { currentUser } from "@/server/session";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "SNAP 2026 mocks",
  description: "Full-length SNAP mocks on the real exam screen: 60 questions, 60 minutes, +1 / −0.25. Instant analysis of what went wrong, worked solutions and a detailed PDF.",
};
export const dynamic = "force-dynamic";

export default async function MocksPage() {
  const [test, five, ten, { mocks }, soon, viewer] = await Promise.all([getProduct("snap-test-mock"), getProduct("snap-mocks-5"), getProduct("snap-mocks-10"), listMocksFor(null), gdpiComingSoon(), currentUser()]);
  const p = { test, five, ten };
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 pb-6 pt-5">
      {viewer?.role === "STUDENT" && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-line bg-teal-tint px-4 py-3 text-[13px] text-ink-2"><span>Welcome back. Your mocks and analyses are in your account.</span><ButtonLink href="/student/mocks" size="sm">Open my mocks</ButtonLink></div>}
      <SnapHero p={p} />
      <SnapPacks p={p} />
      <SnapHow />
      <SnapAnalysisShowcase />
      <SnapCatalogue mocks={mocks.map((m) => ({ id: m.id, title: m.title, isTest: m.isTest, questions: m.questions, durationMin: m.durationMin, released: m.released, releaseAt: m.releaseAt }))} />
      <FaqTeaser items={SNAP_FAQS} />
      {soon && <GdpiTeaser />}
      <p className="text-center text-[11.5px] leading-[1.6] text-ink-faint">SNAP is conducted by Symbiosis International (Deemed University). The Convert Club is an independent practice provider and is not affiliated with Symbiosis. These are practice papers: marks and percentiles are for practice and do not predict the real result. <Link href="/refunds" className="underline">Refund policy</Link>.</p>
    </div>
  );
}
