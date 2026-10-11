import Link from "next/link";
import clsx from "clsx";

export const RANGES = [{ key: "7", label: "7 days", days: 7 }, { key: "30", label: "30 days", days: 30 }, { key: "90", label: "90 days", days: 90 }] as const;

/** Pick how far back the analytics look. It is a plain link, so the page stays fast and shareable. */
export function RangeTabs({ current }: { current: string }) {
  return (
    <nav aria-label="Time range" className="inline-flex rounded-full border border-line bg-card p-1 shadow-xs">
      {RANGES.map((r) => (
        <Link key={r.key} href={`/admin/analytics?range=${r.key}`} aria-current={current === r.key ? "page" : undefined} className={clsx("rounded-full px-4 py-2 text-[12px] font-semibold leading-none no-underline hover:no-underline", current === r.key ? "bg-ink text-white shadow-xs" : "text-ink-muted hover:text-ink")}>{r.label}</Link>
      ))}
    </nav>
  );
}
