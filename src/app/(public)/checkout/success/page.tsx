import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProduct } from "@/lib/catalog";
import { describeCredit } from "@/lib/pricing";
import { isProductionEnv } from "@/lib/env";

export const metadata: Metadata = { title: "You're in", robots: { index: false, follow: false } };

/**
 * Phase 2 reads the paid Order by id and shows its real email and granted credits.
 * Until then this only renders in non-production with ?demo=1, so nobody can reach a
 * "payment confirmed" screen that isn't backed by a payment.
 */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  if (isProductionEnv() || demo !== "1") redirect("/packages");

  const product = await getProduct("call-convert");
  const credits = (product?.credits ?? []).map((c) => describeCredit(c, "short"));

  return (
    <div className="mx-auto max-w-[640px] px-5 py-10">
      <Card className="rounded-[14px] p-8 text-center">
        <div aria-hidden className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-tint font-display text-xl font-bold leading-none text-green">
          ✓
        </div>
        <h1 className="mt-[18px] font-display text-2xl font-bold leading-[1.25] text-ink">You&apos;re in</h1>
        <p className="mt-2.5 text-pretty text-sm leading-[1.7] text-ink-muted">
          Payment confirmed. We&apos;ve emailed you a link to set up your account — the credits are already waiting.
        </p>
        <div className="mt-5 rounded-[10px] border border-line-soft bg-surface p-4 text-left">
          <h2 className="type-label text-ink-faint">Credits added</h2>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {credits.map((c) => (
              <li key={c} className="rounded-md bg-line-soft px-2.5 py-[7px] text-xs font-semibold leading-none text-ink-2">
                {c}
              </li>
            ))}
          </ul>
        </div>
        <ButtonLink href="/login" size="lg" className="mt-5 px-[22px] rounded-[9px]">
          Set up my account
        </ButtonLink>
        <p className="mt-4 text-xs text-ink-faint">Demo screen, non-production only.</p>
      </Card>
    </div>
  );
}
