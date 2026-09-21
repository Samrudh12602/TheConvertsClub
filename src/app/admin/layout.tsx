"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Users,
  GraduationCap,
  UserPlus,
  CalendarRange,
  CalendarCheck,
  ClipboardCheck,
  Wallet,
  LineChart,
  PackageSearch,
  Activity,
  Mail,
  FileStack,
  Settings,
  Search,
  UserCog,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { Logo } from "@/components/marketing/logo";
import { CommandPalette, type CommandItem } from "@/components/ui/command-palette";
import { notifications } from "@/lib/data";

const SIDEBAR_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Command center", icon: LayoutGrid }],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/students", label: "Students", icon: Users },
      { href: "/admin/mentors", label: "Mentors", icon: GraduationCap },
      { href: "/admin/applications", label: "Applications", icon: UserPlus, badge: 2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/scheduler", label: "Scheduler", icon: CalendarRange, badge: 9 },
      { href: "/admin/sessions", label: "All sessions", icon: CalendarCheck },
      { href: "/admin/reviews", label: "Reviews queue", icon: ClipboardCheck },
      { href: "/admin/payouts", label: "Payouts", icon: Wallet },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/finance", label: "Finance", icon: LineChart },
      { href: "/admin/products", label: "Products & pricing", icon: PackageSearch },
      { href: "/admin/progress", label: "Progress & quality", icon: Activity },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/communications", label: "Communications", icon: Mail },
      { href: "/admin/content", label: "Content", icon: FileStack },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const COMMAND_ITEMS: CommandItem[] = [
  { id: "c1", label: "Command center", group: "Overview", href: "/admin" },
  { id: "c2", label: "Students", group: "Growth", href: "/admin/students" },
  { id: "c3", label: "Mentors", group: "Growth", href: "/admin/mentors" },
  { id: "c4", label: "Mentor applications", group: "Growth", href: "/admin/applications" },
  { id: "c5", label: "Scheduler", group: "Operations", href: "/admin/scheduler" },
  { id: "c6", label: "All sessions", group: "Operations", href: "/admin/sessions" },
  { id: "c7", label: "Reviews queue", group: "Operations", href: "/admin/reviews" },
  { id: "c8", label: "Payouts", group: "Operations", href: "/admin/payouts" },
  { id: "c9", label: "Finance", group: "Business", href: "/admin/finance" },
  { id: "c10", label: "Products & pricing", group: "Business", href: "/admin/products" },
  { id: "c11", label: "Progress & quality", group: "Business", href: "/admin/progress" },
  { id: "c12", label: "Communications", group: "Engagement", href: "/admin/communications" },
  { id: "c13", label: "Content", group: "Engagement", href: "/admin/content" },
  { id: "c14", label: "Settings", group: "System", href: "/admin/settings" },
  { id: "c15", label: "Aarav Mehta", group: "Student", href: "/admin/students/s1" },
  { id: "c16", label: "Ishaan Kapoor", group: "Mentor", href: "/admin/mentors/m1" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <PortalTopbar
          role="Admin"
          name="Samrudh"
          notifications={notifications.admin}
          extra={
            <>
              <button
                onClick={() => document.dispatchEvent(new Event("open-command-palette"))}
                className="hidden md:flex items-center gap-2 rounded-[var(--radius-md)] border border-hairline bg-sunken/50 px-3 h-9 text-xs text-muted w-52"
              >
                <Search size={13} /> Search…
                <kbd className="ml-auto rounded border border-hairline px-1 text-[10px]">⌘K</kbd>
              </button>
              <Link
                href="/mentor/dashboard?admin_view=mentor&name=Samrudh"
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken"
              >
                <UserCog size={13} /> Mentor mode
              </Link>
            </>
          }
        />
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">{children}</main>
      </div>
      <CommandPalette items={COMMAND_ITEMS} />
    </div>
  );
}
