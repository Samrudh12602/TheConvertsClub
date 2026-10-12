import type { Metadata } from "next";
import { GuidancePage } from "@/components/site/guidance-sections";
import { getProduct } from "@/lib/catalog";
import { getPolicy } from "@/lib/settings-db";

export const metadata: Metadata = {
  title: "One-to-one guidance calls",
  description: "A focused one-to-one video call on your exam plan: SNAP, CAT, XAT and the colleges that fit your profile. From ₹199.",
};
export const dynamic = "force-dynamic";

export default async function Page() {
  const [guide, strategy, policy] = await Promise.all([getProduct("guidance-call"), getProduct("strategy-call"), getPolicy()]);
  return <GuidancePage p={{ guide, strategy }} refundHours={policy.refundWindowHours} />;
}
