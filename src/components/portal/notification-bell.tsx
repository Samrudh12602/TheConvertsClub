"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { relative } from "@/lib/format";

type Item = { id: string; title: string; body: string | null; href: string | null; readAt: string | null; createdAt: string };

const POLL_MS = 30_000;

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { unread: number; items: Item[] };
      setItems(d.items);
      setUnread(d.unread);
    } catch { /* offline: keep what we have */ }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearTimeout(first); clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const post = (body: object) => fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});

  const markAll = async () => {
    setItems((xs) => xs.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await post({ all: true });
  };

  const openItem = (n: Item) => {
    setOpen(false);
    if (!n.readAt) {
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      post({ id: n.id });
    }
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-line-soft hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="tnum absolute right-0.5 top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-oxblood px-1 py-[3px] text-[9.5px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[11px] border border-line bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2.5">
            <p className="text-[13px] font-bold leading-none text-ink">Notifications</p>
            {unread > 0 && <button type="button" onClick={markAll} className="text-[11.5px] font-semibold leading-none text-oxblood hover:underline">Mark all read</button>}
          </div>
          {items.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-[12.5px] leading-normal text-ink-faint">Nothing yet. Bookings, feedback and payments will show up here.</p>
          ) : (
            <ul className="max-h-[380px] overflow-y-auto">
              {items.map((n) => {
                const inner = (
                  <>
                    <span aria-hidden className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-oxblood"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-pretty text-[12.5px] leading-[1.45] ${n.readAt ? "text-ink-muted" : "font-semibold text-ink"}`}>{n.title}</span>
                      {n.body && <span className="mt-0.5 block text-pretty text-xs leading-[1.45] text-ink-faint">{n.body}</span>}
                      <span className="mt-1 block text-[11px] leading-none text-ink-faint">{relative(new Date(n.createdAt))}</span>
                    </span>
                  </>
                );
                const cls = "flex gap-2.5 border-b border-line-soft px-3.5 py-2.5 text-left no-underline last:border-b-0 hover:bg-line-soft hover:no-underline";
                return (
                  <li key={n.id}>
                    {n.href ? <Link href={n.href} onClick={() => openItem(n)} className={cls}>{inner}</Link> : <button type="button" onClick={() => openItem(n)} className={`${cls} w-full`}>{inner}</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
