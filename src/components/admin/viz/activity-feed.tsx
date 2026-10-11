import Link from "next/link";
import { FileCheck2, Mail, ShoppingBag, Undo2, UserPlus } from "lucide-react";
import clsx from "clsx";
import type { ActivityItem } from "@/server/admin-metrics";
import { TINT, type Tone } from "./palette";

const KIND: Record<ActivityItem["kind"], { icon: typeof Mail; tone: Tone }> = {
  order: { icon: ShoppingBag, tone: "teal" }, signup: { icon: UserPlus, tone: "indigo" }, mock: { icon: FileCheck2, tone: "gold" }, mail: { icon: Mail, tone: "plum" }, refund: { icon: Undo2, tone: "oxblood" },
};

/** "5 min ago", "3 h ago", "2 days ago". */
export function ago(iso: string, now: Date): string {
  const s = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86_400);
  return d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** The newest things that happened, as one coloured timeline. */
export function ActivityFeed({ items, now }: { items: ActivityItem[]; now: Date }) {
  if (items.length === 0) return <p className="px-1 py-6 text-center text-[12.5px] text-ink-faint">Sales, sign-ups and finished mocks show up here as they happen.</p>;
  return (
    <ol className="relative flex flex-col">
      <span aria-hidden className="absolute bottom-3 left-[17px] top-3 w-px bg-line" />
      {items.map((it, i) => {
        const k = KIND[it.kind];
        return (
          <li key={`${it.at}-${i}`}>
            <Link href={it.href} className="relative flex items-start gap-3 rounded-xl px-1.5 py-2 text-inherit no-underline transition-colors hover:bg-surface hover:no-underline">
              <span className={clsx("relative z-10 flex size-[30px] flex-none items-center justify-center rounded-full ring-4 ring-card [&>svg]:size-3.5", TINT[k.tone])}><k.icon aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-ink">{it.title}</span>
                <span className="block truncate text-[11.5px] text-ink-faint">{it.sub}</span>
              </span>
              <span className="mt-0.5 flex-none text-[11px] text-ink-faint">{ago(it.at, now)}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
