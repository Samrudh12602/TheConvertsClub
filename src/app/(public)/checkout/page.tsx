import type { Metadata } from "next";
import { isSellable } from "@/server/site-mode";
import { redirect } from "next/navigation";
import { CheckoutView, type CheckoutSummary } from "@/components/site/checkout-view";
import { getProduct } from "@/lib/catalog";
import { describeCredit, priceView } from "@/lib/pricing";
import { getPolicy } from "@/lib/settings-db";
import { paymentsConfigured } from "@/server/razorpay";
import { quote } from "@/server/checkout";
import { getReferral } from "@/server/referral";
import { ReferralBanner } from "@/components/site/referral-banner";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
  const { product: raw } = await searchParams;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  const product = slug ? await getProduct(slug) : null;

  if (!product) redirect("/packages");
  // Enrolled-only products (e.g. Additional PI) are never sold here, even to a signed-in visitor who
  // types the URL directly — only from inside the student portal, and only once actually enrolled.
  // Login alone doesn't unlock it, so this never suggests it does.
  if (product.enrolledOnly) redirect("/packages");
  if (!(await isSellable(product.slug))) redirect("/mocks");

  const policy = await getPolicy();
  const v = priceView(product);
  const user = await currentUser();
  // If the visitor entered a mentor's code earlier, apply it here (they can still change or clear it).
  const ref = await getReferral();
  const applied = ref ? await quote(product.slug, ref.code).catch(() => null) : null;
  const summary: CheckoutSummary = {
    slug: product.slug,
    name: product.name,
    items: product.credits.map((c) => describeCredit(c)),
    earlyBirdSeatsLeft: product.earlyBird && product.earlyBird.seatsLeft > 0 ? product.earlyBird.seatsLeft : undefined,
    listPricePaise: v.strikePaise,
    discountPaise: v.strikePaise !== null ? v.strikePaise - v.payablePaise : 0,
    totalPaise: v.payablePaise,
    refundWindowHours: policy.refundWindowHours,
    paymentsEnabled: paymentsConfigured(),
    initialCoupon: ref && applied && applied.couponDiscountPaise > 0 ? { code: ref.code, discountPaise: applied.couponDiscountPaise, message: applied.couponMessage ?? "Code applied" } : undefined,
    lockEmail: user?.role === "STUDENT",
    signedInOther: Boolean(user && user.role !== "STUDENT"),
    prefill: user?.role === "STUDENT" ? { name: user.name?.replace(/\s*\(demo\)\s*/, "") ?? "", email: user.email, phone: user.phone ?? "" } : undefined,
  };

  return (
    <>
      <div className="mx-auto max-w-[900px] px-5 pt-[26px] empty:hidden"><ReferralBanner next={`/checkout?product=${product.slug}`} /></div>
      <CheckoutView summary={summary} />
    </>
  );
}
