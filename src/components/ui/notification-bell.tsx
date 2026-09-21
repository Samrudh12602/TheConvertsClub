"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

export function NotificationBell({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = items.filter((i) => i.unread).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink hover:border-border-strong"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-[var(--shadow-token-lg)]">
            <div className="border-b border-hairline px-4 py-3">
              <p className="font-semibold text-ink text-sm">Notifications</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={cn("flex gap-3 border-b border-hairline last:border-0 px-4 py-3", item.unread && "bg-sunken/40")}>
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.unread ? "bg-accent" : "bg-transparent")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-xs text-muted mt-0.5">{item.description}</p>
                      <p className="text-[11px] text-muted mt-1">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
