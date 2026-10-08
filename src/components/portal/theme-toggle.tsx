"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const subscribe = (cb: () => void) => { window.addEventListener("theme-change", cb); return () => window.removeEventListener("theme-change", cb); };
const read = () => document.documentElement.getAttribute("data-theme") === "dark";

/** Light / dark switch for the portals. Remembered on this device only. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, read, () => false);
  const flip = () => {
    const next = !dark;
    if (next) document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* no storage */ }
    window.dispatchEvent(new Event("theme-change"));
  };
  return (
    <button type="button" onClick={flip} aria-pressed={dark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-white text-ink-muted shadow-xs transition hover:border-oxblood hover:text-ink">
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
