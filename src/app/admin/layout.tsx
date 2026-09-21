import type { Metadata } from "next";
import { PortalFrame } from "@/components/portal/portal-frame";

export const metadata: Metadata = {
  title: { default: "Admin portal", template: "%s · The Convert Club" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalFrame role="admin">{children}</PortalFrame>;
}
