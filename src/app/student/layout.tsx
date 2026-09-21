import type { Metadata } from "next";
import { PortalFrame } from "@/components/portal/portal-frame";

export const metadata: Metadata = {
  title: { default: "Student portal", template: "%s · The Convert Club" },
  robots: { index: false, follow: false },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <PortalFrame role="student">{children}</PortalFrame>;
}
