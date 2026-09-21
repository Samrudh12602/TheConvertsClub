import { DEFAULT_SETTINGS } from "@/lib/settings";

/**
 * Navigation and screen titles for the three portals, from the Claude Design portal files.
 * Routes follow the build spec. Badges (counts) and user-specific titles are runtime data, wired in Phase 3+.
 */
export type PortalRole = "student" | "mentor" | "admin";

export interface NavItem {
  href: string;
  label: string;
  /** Page title and sub-title shown in the sticky top bar. */
  title: string;
  sub: string;
  /** Extra path prefixes that keep this item highlighted (e.g. detail pages). */
  match?: string[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface DetailRoute {
  pattern: RegExp;
  title: string;
  sub: string;
  crumb?: string;
}

export interface PortalConfig {
  role: PortalRole;
  base: string;
  groups: NavGroup[];
  details: DetailRoute[];
}

const s = DEFAULT_SETTINGS;

export const studentPortal: PortalConfig = {
  role: "student",
  base: "/student",
  groups: [
    {
      items: [
        { href: "/student", label: "Dashboard", title: "Dashboard", sub: "Everything in IST" },
        { href: "/student/book", label: "Book a session", title: "Book a session", sub: "Slots are released by mentors each Sunday" },
        { href: "/student/gd", label: "GD / GE batches", title: "GD / GE batches", sub: `Group sessions, ${s.gdCapacity} seats each` },
        { href: "/student/sessions", label: "My sessions", title: "My sessions", sub: "Past and upcoming" },
        { href: "/student/reviews", label: "WAT & SOP", title: "WAT & SOP", sub: `Async reviews, ${s.feedbackDueHours}-hour turnaround` },
        { href: "/student/progress", label: "Progress", title: "Progress", sub: "How your mocks have trended" },
        { href: "/student/calls", label: "My calls", title: "My calls", sub: "Track every interview date" },
        { href: "/student/library", label: "Library", title: "Library", sub: "Prep material from your mentors" },
        { href: "/student/payments", label: "Payments", title: "Payments", sub: "Receipts and top-ups" },
        { href: "/student/onboarding", label: "Onboarding", title: "Onboarding", sub: "Four short steps" },
        { href: "/student/settings", label: "Settings", title: "Settings", sub: "Account and notifications" },
        { href: "/student/help", label: "Help", title: "Help", sub: "Common questions" },
      ],
    },
  ],
  details: [{ pattern: /^\/student\/sessions\/[^/]+$/, title: "Feedback report", sub: "Session details and feedback" }],
};

export const mentorPortal: PortalConfig = {
  role: "mentor",
  base: "/mentor",
  groups: [
    {
      items: [
        { href: "/mentor", label: "Dashboard", title: "Dashboard", sub: "All times IST" },
        { href: "/mentor/availability", label: "Availability", title: "Availability", sub: "Offer whole hours; the system splits your window into slots" },
        { href: "/mentor/sessions", label: "My sessions", title: "My sessions", sub: "Assigned to you" },
        // The design has a "Feedback due" nav item; the spec routes only /mentor/feedback/[id], so it opens the filtered list.
        { href: "/mentor/sessions?status=feedback-due", label: "Feedback due", title: "Submit feedback", sub: "Pay accrues only after you submit", match: ["/mentor/feedback"] },
        { href: "/mentor/reviews", label: "WAT & SOP queue", title: "WAT & SOP queue", sub: `${s.feedbackDueHours}-hour turnaround` },
        { href: "/mentor/earnings", label: "Earnings", title: "Earnings", sub: "Accrued, approved and paid" },
        { href: "/mentor/messages", label: "Messages", title: "Messages", sub: "From Samrudh" },
        { href: "/mentor/resources", label: "Resources", title: "Resources", sub: "How we run a mock" },
        { href: "/mentor/profile", label: "Profile", title: "Profile", sub: "Your details and payout account" },
      ],
    },
  ],
  details: [
    { pattern: /^\/mentor\/sessions\/[^/]+$/, title: "Session", sub: "Not drawn in the design: reuses the feedback screen with fields locked" },
    { pattern: /^\/mentor\/feedback\/[^/]+$/, title: "Submit feedback", sub: "Pay accrues only after you submit" },
  ],
};

export const adminPortal: PortalConfig = {
  role: "admin",
  base: "/admin",
  groups: [
    {
      label: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", title: "Overview", sub: "Dashboard" },
        { href: "/admin/analytics", label: "Analytics", title: "Analytics", sub: "Overview" },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/admin/students", label: "Students", title: "Students", sub: "People" },
        { href: "/admin/mentors", label: "Mentors", title: "Mentors", sub: "People" },
        { href: "/admin/applications", label: "Applications", title: "Mentor applications", sub: "People" },
      ],
    },
    {
      label: "Delivery",
      items: [
        { href: "/admin/scheduler", label: "Scheduler", title: "Scheduler", sub: "Delivery" },
        { href: "/admin/sessions", label: "Sessions", title: "All sessions", sub: "Delivery" },
        { href: "/admin/reviews", label: "Reviews", title: "WAT & SOP reviews", sub: "Delivery" },
      ],
    },
    {
      label: "Money",
      items: [
        { href: "/admin/payouts", label: "Payouts", title: "Payouts", sub: "Money" },
        { href: "/admin/finance", label: "Finance", title: "Finance", sub: "Money" },
        { href: "/admin/products", label: "Products", title: "Products", sub: "Money" },
      ],
    },
    {
      label: "Ops",
      items: [
        { href: "/admin/communications", label: "Communications", title: "Communications", sub: "Ops" },
        { href: "/admin/content", label: "Content", title: "Site content", sub: "Ops" },
        { href: "/admin/settings", label: "Settings", title: "Settings", sub: "Ops" },
        { href: "/admin/audit", label: "Audit log", title: "Audit log", sub: "Ops" },
      ],
    },
  ],
  details: [
    { pattern: /^\/admin\/students\/[^/]+$/, title: "Student", sub: "People · Students", crumb: "People · Students" },
    { pattern: /^\/admin\/mentors\/[^/]+$/, title: "Mentor", sub: "People · Mentors", crumb: "People · Mentors" },
  ],
};

export const portals: Record<PortalRole, PortalConfig> = { student: studentPortal, mentor: mentorPortal, admin: adminPortal };

export interface ResolvedScreen {
  title: string;
  sub: string;
}

/** Find the screen for a path inside a portal, or null (404). */
export function resolveScreen(config: PortalConfig, path: string): ResolvedScreen | null {
  const clean = path.replace(/\/+$/, "") || config.base;
  for (const g of config.groups) {
    for (const it of g.items) {
      if (it.href.split("?")[0] === clean) return { title: it.title, sub: it.sub };
    }
  }
  const d = config.details.find((x) => x.pattern.test(clean));
  return d ? { title: d.title, sub: d.sub } : null;
}
