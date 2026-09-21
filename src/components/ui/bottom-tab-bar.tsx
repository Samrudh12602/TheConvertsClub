"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function BottomTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-hairline bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium min-h-[56px] justify-center",
                active ? "text-brand" : "text-muted"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
