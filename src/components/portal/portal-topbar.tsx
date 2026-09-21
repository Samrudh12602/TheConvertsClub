"use client";

import { Menu } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell, NotificationItem } from "@/components/ui/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function PortalTopbar({
  role,
  name,
  notifications,
  onMenuClick,
  extra,
}: {
  role: "Student" | "Mentor" | "Admin";
  name: string;
  notifications: NotificationItem[];
  onMenuClick?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-hairline bg-surface/90 backdrop-blur px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-sunken">
            <Menu size={18} />
          </button>
        )}
        <div className="md:hidden">
          <Logo />
        </div>
        <Badge variant="navy" className="hidden md:inline-flex">
          {role}
        </Badge>
      </div>
      <div className="flex items-center gap-2.5">
        {extra}
        <ThemeToggle />
        <NotificationBell items={notifications} />
        <Avatar name={name} size={38} />
      </div>
    </header>
  );
}
