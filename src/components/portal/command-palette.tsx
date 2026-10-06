"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CornerDownLeft, Search } from "lucide-react";
import { NavIcon } from "@/components/portal/nav-icons";
import type { NavGroup } from "@/lib/portal-nav";

/** Ctrl/Cmd-K "jump to" for the portal: type a page name, arrows to choose, Enter to go. */
export function CommandPalette({ groups }: { groups: NavGroup[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const items = useMemo(() => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label ?? "" }))), [groups]);
  const shown = useMemo(() => items.filter((i) => `${i.label} ${i.group}`.toLowerCase().includes(q.trim().toLowerCase())), [items, q]);
  const active = Math.min(cursor, Math.max(0, shown.length - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-command-palette", onOpen); };
  }, []);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const go = (href: string) => { setOpen(false); setQ(""); setCursor(0); router.push(href); };
  const close = () => { setOpen(false); setQ(""); setCursor(0); };

  return (
    <dialog ref={ref} onClose={close} onClick={(e) => { if (e.target === ref.current) close(); }} aria-label="Jump to a page"
      className="mx-auto mt-[12vh] w-[calc(100%-32px)] max-w-[520px] rounded-2xl border border-line bg-card p-0 text-ink shadow-pop backdrop:bg-night/55 backdrop:backdrop-blur-[3px] open:animate-scale-in">
      {open && (
        <div>
          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <Search aria-hidden className="size-4 text-ink-faint" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setCursor(0); }} placeholder="Jump to a page…" aria-label="Jump to a page"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setCursor((active + 1) % Math.max(1, shown.length)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((active - 1 + shown.length) % Math.max(1, shown.length)); }
                else if (e.key === "Enter" && shown[active]) { e.preventDefault(); go(shown[active].href); }
              }}
              className="min-h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint md:text-[14px]" />
            <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint">Esc</kbd>
          </div>
          <ul className="max-h-[50vh] overflow-y-auto p-2">
            {shown.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-ink-faint">Nothing matches &ldquo;{q}&rdquo;.</li>}
            {shown.map((i, n) => (
              <li key={i.href}>
                <button type="button" onMouseEnter={() => setCursor(n)} onClick={() => go(i.href)} className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors", n === active ? "bg-oxblood-tint text-oxblood" : "text-ink-body")}>
                  <NavIcon href={i.href} className="size-[18px] flex-none" />
                  <span className="flex-1 font-medium">{i.label}</span>
                  {i.group && <span className="text-[11px] text-ink-faint">{i.group}</span>}
                  {n === active && <CornerDownLeft aria-hidden className="size-3.5 flex-none" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </dialog>
  );
}

/** A small "Search ⌘K" button for the top bar that opens the palette. */
export function PaletteButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("open-command-palette"))} className="hidden min-h-9 items-center gap-2 rounded-lg border border-line-strong bg-white px-2.5 text-[12px] text-ink-faint shadow-xs transition hover:border-oxblood hover:text-ink md:inline-flex" aria-label="Jump to a page">
      <Search aria-hidden className="size-3.5" />Jump to<kbd className="rounded border border-line bg-surface px-1 text-[10px] font-semibold">Ctrl K</kbd>
    </button>
  );
}
