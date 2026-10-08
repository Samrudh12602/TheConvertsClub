"use client";

import { createContext, useContext, useState } from "react";
import clsx from "clsx";

/**
 * The owner's hours come in two kinds: free time (ordinary sessions) and hours set aside for the paid PI / strategy
 * calls with Samrudh. This holds which kind the owner is currently adding, for both the "add window" form and the
 * click-to-toggle week grid. Everyone else only ever has the one kind, so for them it is invisible.
 */
const Ctx = createContext<{ direct: boolean; canDirect: boolean }>({ direct: false, canDirect: false });
export const useMode = () => useContext(Ctx);

const ModeState = createContext<(d: boolean) => void>(() => undefined);

export function ModeProvider({ canDirect, children }: { canDirect: boolean; children: React.ReactNode }) {
  const [direct, setDirect] = useState(false);
  return (
    <ModeState.Provider value={setDirect}>
      <Ctx.Provider value={{ direct: canDirect && direct, canDirect }}>{children}</Ctx.Provider>
    </ModeState.Provider>
  );
}

export function ModePicker() {
  const { direct, canDirect } = useMode();
  const set = useContext(ModeState);
  if (!canDirect) return null;
  const opt = (value: boolean, title: string, sub: string) => (
    <button type="button" onClick={() => set(value)} aria-pressed={direct === value}
      className={clsx("flex-[1_1_240px] rounded-[10px] border p-3 text-left", direct === value ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-body hover:border-ink")}>
      <span className="block text-[13px] font-semibold leading-[1.3]">{title}</span>
      <span className={clsx("mt-1 block text-[11.5px] leading-[1.4]", direct === value ? "text-dark-soft" : "text-ink-faint")}>{sub}</span>
    </button>
  );
  return (
    <div className="rounded-[11px] border border-line bg-card p-4">
      <p className="type-label text-ink-faint">You are adding hours for</p>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {opt(false, "My free time", "Ordinary sessions: you take whatever you're free for before other mentors do, and strategy calls from the programs.")}
        {opt(true, "Special paid sessions", "The paid PI and strategy call with Samrudh, and Panel PIs. Kept separate from your free time.")}
      </div>
    </div>
  );
}
