"use client";

import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  Users2,
  FileText,
  BookOpen,
  TrendingUp,
  Phone,
  Wallet,
  UserCircle,
  HelpCircle,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { ImpersonationBanner } from "@/components/portal/impersonation-banner";
import { Logo } from "@/components/marketing/logo";
import { currentStudent, notifications } from "@/lib/data";

const SIDEBAR_SECTIONS = [
  {
    label: "Prepare",
    items: [
      { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/student/book", label: "Book a session", icon: CalendarPlus },
      { href: "/student/sessions", label: "My sessions", icon: CalendarCheck },
      { href: "/student/gd-batches", label: "GD/GE batches", icon: Users2 },
      { href: "/student/reviews", label: "WAT & SOP reviews", icon: FileText },
      { href: "/student/library", label: "Prep library", icon: BookOpen },
      { href: "/student/progress", label: "Progress", icon: TrendingUp },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/student/calls", label: "My calls tracker", icon: Phone },
      { href: "/student/payments", label: "Payments & plan", icon: Wallet },
      { href: "/student/profile", label: "Profile & settings", icon: UserCircle },
      { href: "/student/help", label: "Help", icon: HelpCircle },
    ],
  },
];

const TABS = [
  { href: "/student/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/student/book", label: "Book", icon: CalendarPlus },
  { href: "/student/sessions", label: "Sessions", icon: CalendarCheck },
  { href: "/student/progress", label: "Progress", icon: TrendingUp },
  { href: "/student/profile", label: "Profile", icon: UserCircle },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        sections={SIDEBAR_SECTIONS}
        header={
          <div className="px-5 py-5 border-b border-hairline">
            <Logo />
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <ImpersonationBanner />
        <PortalTopbar role="Student" name={currentStudent.name} notifications={notifications.student} />
        <main className="px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-6xl mx-auto">{children}</main>
      </div>
      <BottomTabBar items={TABS} />
    </div>
  );
}
