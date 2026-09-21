import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Refunds" };

export default function Page() {
  return <LegalPage slug="refunds" />;
}
