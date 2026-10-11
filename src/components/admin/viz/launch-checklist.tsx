import Link from "next/link";
import { Check, Circle } from "lucide-react";
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
        {todo.map((i) => (
          <li key={i.id} className="flex items-center gap-3 border-t border-line-soft py-2.5 first:border-t-0">
            <span className="flex size-6 flex-none items-center justify-center rounded-full bg-gold-tint text-gold-deep ring-1 ring-gold-line"><Circle className="size-3 fill-current" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-ink">{i.label}</span><span className="block truncate text-[11.5px] text-ink-faint">{i.detail}</span></span>
            <Link href={i.href} className="flex-none rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-2 no-underline hover:border-ink hover:no-underline">{i.cta}</Link>
          </li>
        ))}
      </ul>
      {done > 0 && (
        <details className="group mt-2 border-t border-line-soft pt-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-[12px] font-semibold text-teal"><Check className="size-3.5" aria-hidden /> {done} done <span className="font-normal text-ink-faint group-open:hidden">· show</span></summary>
          <ul className="mt-1">
            {items.filter((i) => i.ok).map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-1.5">
                <span className="flex size-5 flex-none items-center justify-center rounded-full bg-teal text-white"><Check className="size-3" aria-hidden /></span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{i.label} <span className="text-ink-faint">· {i.detail}</span></span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
