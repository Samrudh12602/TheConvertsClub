"use client";

import { useState } from "react";
import { CalendarClock, IndianRupee, UserPlus, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Msg {
  id: string;
  icon: typeof CalendarClock;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  emailToggleOn: boolean;
}

const INITIAL: Msg[] = [
  { id: "m1", icon: UserPlus, title: "New session assigned", description: "Mock PI with Aarav Mehta, 23 Sep, 4:00 PM IST.", time: "3h ago", unread: true, emailToggleOn: true },
  { id: "m2", icon: Ban, title: "Session cancelled", description: "Mock GD/GE with Sanya Kapoor was cancelled by the student.", time: "1d ago", unread: true, emailToggleOn: true },
  { id: "m3", icon: IndianRupee, title: "Payout processed", description: "₹9,600 credited to your UPI ending okhdfc.", time: "3w ago", unread: false, emailToggleOn: true },
  { id: "m4", icon: CalendarClock, title: "Schedule change", description: "Your Wed 5 PM slot was moved to 6 PM by Admin.", time: "1mo ago", unread: false, emailToggleOn: false },
];

export default function MentorMessagesPage() {
  const [items, setItems] = useState(INITIAL);

  const toggleEmail = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, emailToggleOn: !i.emailToggleOn } : i)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Platform messages</h1>
        <Badge variant="neutral">{items.filter((i) => i.unread).length} unread</Badge>
      </div>

      <div className="divide-y divide-hairline rounded-[var(--radius-lg)] border border-hairline bg-surface">
        {items.map((item) => (
          <div key={item.id} className={`flex items-start gap-4 p-4 ${item.unread ? "bg-sunken/30" : ""}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-ink">
              <item.icon size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <span className="text-xs text-muted shrink-0">{item.time}</span>
              </div>
              <p className="text-sm text-muted mt-0.5">{item.description}</p>
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={item.emailToggleOn} onChange={() => toggleEmail(item.id)} className="h-3.5 w-3.5 accent-[var(--gold-500)]" />
                Also email me this
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
