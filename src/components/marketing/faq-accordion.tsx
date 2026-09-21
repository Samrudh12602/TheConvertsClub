"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-hairline rounded-[var(--radius-lg)] border border-hairline bg-surface">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left"
              aria-expanded={open}
            >
              <span className="font-medium text-ink text-sm sm:text-base">{item.q}</span>
              <ChevronDown size={18} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-200 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <p className="px-5 pb-4.5 text-sm text-muted leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
