"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** An accessible pop-up (native <dialog>: focus is trapped, Escape closes, the page behind is inert). */
export function Dialog({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-label={title}
      className={clsx("m-auto w-[calc(100%-32px)] max-w-[440px] rounded-2xl border border-line bg-card p-0 text-ink shadow-pop backdrop:bg-night/55 backdrop:backdrop-blur-[3px] open:animate-scale-in", className)}
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-[19px] font-bold leading-[1.25] text-ink">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-ink-faint hover:bg-line-soft hover:text-ink"><X className="size-4" /></button>
          </div>
          <div className="mt-3">{children}</div>
        </div>
      )}
    </dialog>
  );
}

/** "Are you sure?" with a clear primary action. `danger` turns the button the warning colour. */
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = "Confirm", busy = false, danger = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: React.ReactNode; confirmLabel?: string; busy?: boolean; danger?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="text-[13.5px] leading-[1.65] text-ink-muted">{body}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={danger ? "dark" : "primary"} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</Button>
      </div>
    </Dialog>
  );
}
