"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type Tone = "success" | "error" | "info";
interface ToastItem { id: number; tone: Tone; text: string }
interface Api { success: (text: string) => void; error: (text: string) => void; info: (text: string) => void }

const Ctx = createContext<Api>({ success: () => undefined, error: () => undefined, info: () => undefined });
export const useToast = () => useContext(Ctx);

const STYLE: Record<Tone, string> = {
  success: "border-teal-line bg-white text-ink",
  error: "border-oxblood-line bg-white text-ink",
  info: "border-line-strong bg-white text-ink",
};
const ICON = { success: <CheckCircle2 className="size-[18px] text-teal" aria-hidden />, error: <TriangleAlert className="size-[18px] text-oxblood" aria-hidden />, info: <Info className="size-[18px] text-indigo" aria-hidden /> };

/** Small, non-blocking confirmations: "Saved", "Booked", or what went wrong. Replaces plain inline text. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const n = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((tone: Tone, text: string) => {
    const id = ++n.current;
    setItems((l) => [...l.slice(-3), { id, tone, text }]);
    setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4200);
  }, [dismiss]);
  const api = useMemo<Api>(() => ({ success: (t) => push("success", t), error: (t) => push("error", t), info: (t) => push("info", t) }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {items.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className={clsx("pointer-events-auto flex w-full max-w-[380px] animate-toast-in items-start gap-3 rounded-xl border px-4 py-3 shadow-pop", STYLE[t.tone])}>
            <span className="mt-px flex-none">{ICON[t.tone]}</span>
            <p className="min-w-0 flex-1 text-[13px] leading-[1.45]">{t.text}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 flex-none rounded p-1 text-ink-faint hover:bg-line-soft hover:text-ink"><X className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
