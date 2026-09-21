"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  href: string;
  keywords?: string;
}

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const onOpenEvent = () => setOpen(true);
    document.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => `${i.label} ${i.group} ${i.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-[var(--shadow-token-lg)]">
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <Search size={16} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, mentors, sessions, settings…"
            className="h-14 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <kbd className="rounded border border-hairline px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No matches.</p>}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setOpen(false);
                setQuery("");
                router.push(item.href as never);
              }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-sunken"
            >
              <span className="text-sm font-medium text-ink">{item.label}</span>
              <span className="text-xs text-muted">{item.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
