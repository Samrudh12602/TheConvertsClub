import Link from "next/link";
import { Check, Circle } from "lucide-react";
import clsx from "clsx";
import type { CheckItem } from "@/server/admin-metrics";
import { ProgressRing } from "@/components/ui/charts";

/** Everything that has to be true before you announce, with a link to fix each one that isn't. */
export function LaunchChecklist({ items }: { items: CheckItem[] }) {
  const done = items.filter((i) => i.ok).length;
  const todo = items.filter((i) => !i.ok);
  return (
    <div>
      <div className="flex items-center gap-4">
        <ProgressRing value={done} max={items.length} label={`${done}/${items.length}`} tone={todo.length === 0 ? "teal" : "gold"} size={84} />
        <p className="text-[13px] leading-[1.55] text-ink-2">{todo.length === 0 ? <><b className="text-teal">You&apos;re ready to launch.</b> Every check is green.</> : <><b className="text-ink">{todo.length} thing{todo.length === 1 ? "" : "s"} left</b> before you announce. Each one links to where you fix it.</>}</p>
      </div>
      <ul className="mt-3 flex flex-col">
        {[...todo, ...items.filter((i) => i.ok)].map((i) => (
          <li key={i.id} className="flex items-center gap-3 border-t border-line-soft py-2.5 first:border-t-0">
            <span className={clsx("flex size-6 flex-none items-center justify-center rounded-full", i.ok ? "bg-teal text-white" : "bg-gold-tint text-gold-deep ring-1 ring-gold-line")}>{i.ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3 fill-current" aria-hidden />}</span>
            <span className="min-w-0 flex-1"><span className={clsx("block truncate text-[12.5px] font-medium", i.ok ? "text-ink-2" : "text-ink")}>{i.label}</span><span className="block truncate text-[11.5px] text-ink-faint">{i.detail}</span></span>
            {!i.ok && <Link href={i.href} className="flex-none rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-2 no-underline hover:border-ink hover:no-underline">{i.cta}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
