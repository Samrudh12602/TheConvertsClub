import { BarChart3, BookOpen, CalendarCheck, CalendarClock, CalendarDays, CalendarPlus, ClipboardList, Circle, CreditCard, FileText, GraduationCap, Inbox, Landmark, LayoutDashboard, LifeBuoy, Mail, MessageSquare, Package, PenSquare, PhoneCall, ScrollText, Settings, TrendingUp, UserRound, Users, Video, Wallet, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "": LayoutDashboard, book: CalendarPlus, gd: Users, sessions: Video, reviews: FileText, progress: TrendingUp, calls: PhoneCall, library: BookOpen,
  messages: MessageSquare, payments: CreditCard, onboarding: ClipboardList, settings: Settings, help: LifeBuoy, availability: CalendarClock,
  earnings: Wallet, resources: BookOpen, profile: UserRound, analytics: BarChart3, inbox: Inbox, students: GraduationCap, mentors: Users, applications: Inbox,
  calendar: CalendarDays, scheduler: CalendarCheck, payouts: Wallet, finance: Landmark, products: Package, communications: Mail, content: PenSquare, audit: ScrollText,
};

/** The icon for a portal nav link, by its last path segment ("/admin/finance" -> Landmark). */
export function NavIcon({ href, className }: { href: string; className?: string }) {
  const seg = href.split("?")[0].split("/")[2] ?? "";
  const Icon = ICONS[seg] ?? Circle;
  return <Icon aria-hidden className={className} strokeWidth={1.9} />;
}
