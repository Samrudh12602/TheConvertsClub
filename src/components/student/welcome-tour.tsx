"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { CalendarPlus, CreditCard, MessageSquareText, X } from "lucide-react";

const KEY = "welcome-tour-dismissed";
const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); window.addEventListener("welcome-tour", cb); return () => { window.removeEventListener("storage", cb); window.removeEventListener("welcome-tour", cb); }; };
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

/** A three-step welcome for a new student. Dismissed once and remembered on this device. */
export function WelcomeTour({ name }: { name: string }) {
  const dismissed = useSyncExternalStore(subscribe, read, () => true);
  if (dismissed) return null;
  const close = () => { try { localStorage.setItem(KEY, "1"); } catch { /* no storage */ } window.dispatchEvent(new Event("welcome-tour")); };
  const steps = [
    { icon: <CalendarPlus />, title: "Book your first mock", body: "Pick a type, a focus and a time. Slots open every Sunday.", href: "/student/book", cta: "Book now" },
    { icon: <CreditCard />, title: "Know your credits", body: "Each kind has its own credit. They're in the sidebar and the rings below.", href: "/student/payments", cta: "See payments" },
    { icon: <MessageSquareText />, title: "Feedback lands here", body: "Scores, strengths, fixes and what to prepare next arrive within a day.", href: "/student/sessions", cta: "My sessions" },
  ];
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold-line bg-gradient-to-br from-gold-tint to-white p-5 shadow-card" aria-label="Welcome">
      <button type="button" onClick={close} aria-label="Dismiss welcome" className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-faint transition hover:bg-white hover:text-ink"><X className="size-4" /></button>
      <p className="type-eyebrow text-gold-deep">Welcome</p>
      <h2 className="mt-1.5 font-display text-[20px] font-bold leading-[1.25] text-ink">Welcome, {name}. Three things to get going.</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <Link key={s.title} href={s.href} className="group rounded-xl border border-line bg-white p-4 text-inherit no-underline transition-all hover:-translate-y-0.5 hover:border-oxblood hover:shadow-card hover:no-underline">
            <span className="flex size-9 items-center justify-center rounded-xl bg-oxblood-tint text-oxblood [&>svg]:size-[18px]">{s.icon}</span>
            <p className="mt-3 text-[13.5px] font-semibold text-ink"><span className="tnum mr-1.5 text-ink-faint">{i + 1}.</span>{s.title}</p>
            <p className="mt-1 text-[12px] leading-[1.5] text-ink-muted">{s.body}</p>
            <p className="mt-2.5 text-[12px] font-semibold text-oxblood">{s.cta} →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
