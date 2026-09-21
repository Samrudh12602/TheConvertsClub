"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SidebarSection {
  label?: string;
  items: { href: string; label: string; icon: LucideIcon; badge?: number }[];
}

export function Sidebar({
  sections,
  header,
  className,
}: {
  sections: SidebarSection[];
  header?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex w-64 shrink-0 flex-col border-r border-hairline bg-surface h-screen sticky top-0 overflow-y-auto",
        className
      )}
    >
      {header}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/")) || pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-brand text-inverse" : "text-ink hover:bg-sunken"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={17} />
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          active ? "bg-white/20 text-inverse" : "bg-accent text-on-gold"
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
