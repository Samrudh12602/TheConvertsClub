import clsx from "clsx";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import type { Tone } from "@/lib/labels";

/** White panel with a bold header row, used for lists and tables across the portals. */
export function Panel({ title, action, children, className, flush = true }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={clsx("overflow-hidden rounded-[10px] border border-line bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-3">
          <h2 className="text-[13.5px] font-bold leading-none text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-3.5"}>{children}</div>
    </section>
  );
}

export function Row({ children, href, className }: { children: React.ReactNode; href?: string; className?: string }) {
  const cls = clsx("flex items-center gap-3 border-b border-line-soft px-3.5 py-3 last:border-b-0", href && "hover:bg-surface", className);
  return href ? <Link href={href} className={clsx(cls, "text-inherit no-underline hover:no-underline")}>{children}</Link> : <div className={cls}>{children}</div>;
}

export function Kpi({ label, value, note, noteTone = "muted" }: { label: string; value: React.ReactNode; note?: React.ReactNode; noteTone?: "muted" | "green" | "oxblood" | "amber" }) {
  const tones = { muted: "text-ink-muted", green: "text-green", oxblood: "text-oxblood", amber: "text-amber" };
  return (
    <div className="rounded-[10px] border border-line bg-card px-3.5 py-3.5">
      <p className="type-label text-ink-faint">{label}</p>
      <p className="tnum mt-[9px] font-display text-[26px] font-bold leading-[1.1] text-ink">{value}</p>
      {note && <p className={clsx("mt-[5px] text-[11.5px] leading-[1.35]", tones[noteTone])}>{note}</p>}
    </div>
  );
}

export function KpiGrid({ children, min = 168 }: { children: React.ReactNode; min?: number }) {
  return <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>{children}</div>;
}

const meterTone: Record<string, string> = { green: "bg-green", amber: "bg-amber", oxblood: "bg-oxblood", indigo: "bg-indigo", stone: "bg-ink-faint" };

export function Meter({ pct, tone = "oxblood", label, note }: { pct: number; tone?: keyof typeof meterTone; label?: string; note?: string }) {
  return (
    <div>
      {(label || note) && (
        <div className="flex justify-between gap-2 text-xs font-medium leading-[1.2] text-ink-2">
          <span>{label}</span>
          <span className="tnum text-ink-faint">{note}</span>
        </div>
      )}
      <div className={clsx("h-2 overflow-hidden rounded bg-line-soft", (label || note) && "mt-1.5")} role="img" aria-label={`${Math.round(pct)} percent`}>
        <div className={clsx("h-full", meterTone[tone])} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <Pill tone={tone} className="flex-none whitespace-nowrap">{children}</Pill>;
}

export function DateBadge({ day, mon, w = "w-11" }: { day: string; mon: string; w?: string }) {
  return (
    <div className={clsx("flex-none text-center", w)}>
      <p className="font-display text-[15px] font-bold leading-none text-ink">{day}</p>
      <p className="mt-[3px] text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-ink-faint">{mon}</p>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-3.5 py-6 text-center text-[13px] leading-normal text-ink-faint">{children}</p>;
}

/** Coloured-edge insight card (feedback blocks, progress notes, messages). */
export function Insight({ title, tone, children }: { title: string; tone: "green" | "oxblood" | "amber" | "indigo" | "stone"; children: React.ReactNode }) {
  const edge: Record<string, string> = { green: "border-l-green text-green", oxblood: "border-l-oxblood text-oxblood", amber: "border-l-amber text-amber", indigo: "border-l-indigo text-indigo", stone: "border-l-ink-muted text-ink-muted" };
  return (
    <div className={clsx("rounded-[10px] border border-line border-l-[3px] bg-card p-[15px]", edge[tone].split(" ")[0])}>
      <p className={clsx("type-label", edge[tone].split(" ")[1])}>{title}</p>
      <div className="mt-[9px] flex flex-col gap-[9px] text-[13px] leading-[1.55] text-ink-body">{children}</div>
    </div>
  );
}

export function Section({ children, cols = 260 }: { children: React.ReactNode; cols?: number }) {
  return <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols}px, 1fr))` }}>{children}</div>;
}

export function Flash({ tone = "amber", children }: { tone?: "amber" | "green" | "oxblood"; children: React.ReactNode }) {
  const t = { amber: "border-amber-line bg-amber-tint text-amber-ink", green: "border-green/20 bg-green-tint text-green", oxblood: "border-oxblood-line bg-oxblood-tint text-oxblood" };
  return <div role={tone === "oxblood" ? "alert" : "status"} className={clsx("rounded-[10px] border px-4 py-3 text-[12.5px] leading-[1.55]", t[tone])}>{children}</div>;
}
