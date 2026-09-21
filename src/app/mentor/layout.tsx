"use client";

import {
  LayoutDashboard,
  CalendarClock,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Wallet,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { ImpersonationBanner } from "@/components/portal/impersonation-banner";
import { Logo } from "@/components/marketing/logo";
import { Badge } from "@/components/ui/badge";
import { currentMentor, notifications } from "@/lib/data";

const SIDEBAR_SECTIONS = [
  {
    label: "Sessions",
    items: [
      { href: "/mentor/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/mentor/availability", label: "Availability", icon: CalendarClock },
      { href: "/mentor/sessions", label: "Sessions", icon: CalendarCheck, badge: 2 },
      { href: "/mentor/reviews", label: "Reviews queue", icon: ClipboardCheck },
    ],
  },
  {
    label: "Earnings",
    items: [
      { href: "/mentor/earnings", label: "Earnings & pay", icon: Wallet },
      { href: "/mentor/messages", label: "Platform messages", icon: MessageSquare, badge: 1 },
      { href: "/mentor/resources", label: "Resources", icon: FileText },
      { href: "/mentor/profile", label: "Profile", icon: UserCircle },
    ],
  },
];

const TABS = [
  { href: "/mentor/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mentor/availability", label: "Slots", icon: CalendarClock },
  { href: "/mentor/sessions", label: "Sessions", icon: CalendarCheck },
  { href: "/mentor/earnings", label: "Earnings", icon: Wallet },
  { href: "/mentor/profile", label: "Profile", icon: UserCircle },
];

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        sections={SIDEBAR_SECTIONS}
        header={
          <div className="px-5 py-5 border-b border-hairline space-y-2.5">
            <Logo />
            <Badge variant="gold">{currentMentor.tier} · visible only to you</Badge>
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <ImpersonationBanner />
        <PortalTopbar
          role="Mentor"
          name={currentMentor.name}
          notifications={notifications.mentor}
          extra={
            <Badge variant="gold" className="md:hidden">
              {currentMentor.tier}
            </Badge>
          }
        />
        <main className="px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-6xl mx-auto">{children}</main>
      </div>
      <BottomTabBar items={TABS} />
    </div>
  );
}
