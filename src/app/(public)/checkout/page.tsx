import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutView, type CheckoutSummary } from "@/components/site/checkout-view";
import { getProduct } from "@/lib/catalog";
import { describeCredit, priceView } from "@/lib/pricing";
import { formatIstDayMonth } from "@/lib/datetime";
import { formatPaise } from "@/lib/money";
import { getPolicy } from "@/lib/settings-db";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
  const { product: raw } = await searchParams;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  const product = slug ? await getProduct(slug) : null;

  if (!product) redirect("/packages");
  // Enrolled-only products are bought from inside the student portal.
  if (product.enrolledOnly) redirect("/login");

  const policy = await getPolicy();
  const v = priceView(product);
  const summary: CheckoutSummary = {
    name: product.name,
    items: product.credits.map((c) => describeCredit(c)),
    listPricePaise: v.strikePaise,
    discountPaise: v.discountPaise,
    discountLabel: v.earlyBirdActive ? "Early bird" : "Discount",
    totalPaise: v.payablePaise,
    earlyBirdNote:
      v.earlyBirdActive && v.earlyBirdEndsAt
        ? `Early-bird applied · ${formatPaise(v.discountPaise)} off until ${formatIstDayMonth(v.earlyBirdEndsAt)}`
        : null,
    refundWindowHours: policy.refundWindowHours,
  };

  return <CheckoutView summary={summary} />;
}
