"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "480px",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div
        style={{ width }}
        className={cn(
          "absolute right-0 top-0 h-full max-w-full overflow-y-auto bg-surface shadow-[var(--shadow-token-lg)] transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-hairline bg-surface px-6 py-5">
          <div>
            {title && <h2 className="text-lg font-semibold text-ink font-display">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
