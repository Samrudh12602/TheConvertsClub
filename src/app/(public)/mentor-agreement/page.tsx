import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Mentor Agreement" };

export default function Page() {
  return <LegalPage slug="mentor-agreement" />;
}
