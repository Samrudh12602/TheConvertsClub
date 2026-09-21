"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
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

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 shadow-[var(--shadow-token-lg)] animate-[gold-check-pop_200ms_ease-out]",
          widths[size]
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sunken"
        >
          <X size={16} />
        </button>
        {title && <h2 className="text-lg font-semibold text-ink pr-8 font-display">{title}</h2>}
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="mt-2 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="h-10 rounded-[var(--radius-md)] border border-border-strong px-4 text-sm font-semibold text-ink hover:bg-sunken"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "h-10 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-white disabled:opacity-60",
            destructive ? "bg-danger hover:opacity-90" : "bg-brand hover:bg-brand-strong"
          )}
        >
          {loading ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
