"use client";

import { cn } from "@/lib/cn";

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto border-b border-hairline", className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
            active === tab.key ? "text-brand" : "text-muted hover:text-ink"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                active === tab.key ? "bg-accent text-on-gold" : "bg-sunken text-muted"
              )}
            >
              {tab.count}
            </span>
          )}
          {active === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}
