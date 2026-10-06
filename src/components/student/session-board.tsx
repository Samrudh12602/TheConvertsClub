"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CalendarPlus, CheckCircle2, Clock3, Inbox } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export interface BoardRow {
  id: string; title: string; day: string; mon: string; time: string; mentor: string | null;
  group: "upcoming" | "feedback" | "past"; label: string; tone: "amber" | "green" | "indigo" | "stone" | "oxblood"; score: number | null; when: string | null;
}

const TABS = [["upcoming", "Upcoming", Clock3], ["feedback", "Feedback ready", CheckCircle2], ["past", "History", Inbox]] as const;
const EDGE = { amber: "bg-gold", green: "bg-teal", indigo: "bg-indigo", stone: "bg-line-strong", oxblood: "bg-oxblood" } as const;

/** Tabbed session list: what's coming, what has feedback waiting, and everything before. */
export function SessionBoard({ rows }: { rows: BoardRow[] }) {
  const counts = { upcoming: rows.filter((r) => r.group === "upcoming").length, feedback: rows.filter((r) => r.group === "feedback").length, past: rows.filter((r) => r.group !== "upcoming").length };
  const first = (counts.upcoming ? "upcoming" : counts.feedback ? "feedback" : "past") as (typeof TABS)[number][0];
  const [tab, setTab] = useState<(typeof TABS)[number][0]>(first);
  const shown = rows.filter((r) => (tab === "past" ? r.group !== "upcoming" : r.group === tab));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-line-soft p-1" role="tablist">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={clsx("flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12.5px] font-semibold transition-all", tab === id ? "bg-white text-ink shadow-card" : "text-ink-muted hover:text-ink")}>
            <Icon aria-hidden className="size-4" />{label}<span className={clsx("tnum rounded-full px-1.5 py-0.5 text-[10.5px] leading-none", tab === id ? "bg-oxblood-tint text-oxblood" : "bg-white/60 text-ink-faint")}>{counts[id]}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-card px-5 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-oxblood-tint text-oxblood"><CalendarPlus className="size-5" /></span>
          <p className="text-[14px] font-semibold text-ink">{tab === "upcoming" ? "Nothing booked" : tab === "feedback" ? "No feedback waiting" : "No past sessions yet"}</p>
          <p className="max-w-[40ch] text-[12.5px] leading-normal text-ink-muted">{tab === "upcoming" ? "Pick a time that suits you. Slots open every Sunday." : "It shows up here after your mentor submits it."}</p>
          {tab === "upcoming" && <Link href="/student/book" className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white no-underline shadow-glow hover:text-white hover:no-underline">Book a session <ArrowRight className="size-4" /></Link>}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((r) => (
            <Link key={r.id} href={`/student/sessions/${r.id}`} className="group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-xl border border-line bg-card py-3.5 pl-5 pr-4 text-inherit no-underline shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-oxblood hover:shadow-lift hover:no-underline">
              <span aria-hidden className={clsx("absolute inset-y-0 left-0 w-1", EDGE[r.tone])} />
              <div className="w-[46px] flex-none text-center"><p className="font-display text-[20px] font-bold leading-none text-ink">{r.day}</p><p className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-ink-faint">{r.mon}</p></div>
              <div className="min-w-0 flex-[1_1_200px]">
                <p className="text-[14px] font-semibold leading-[1.3] text-ink">{r.title}</p>
                <p className="mt-[3px] text-xs leading-[1.4] text-ink-faint">{r.time}{r.mentor ? ` · ${r.mentor}` : ""}{r.when ? ` · ${r.when}` : ""}</p>
              </div>
              {r.score !== null && <span className="tnum rounded-lg bg-surface px-2.5 py-1.5 font-display text-[15px] font-bold text-ink">{r.score.toFixed(1)}</span>}
              <Pill tone={r.tone} className="flex-none whitespace-nowrap">{r.label}</Pill>
              <ArrowRight aria-hidden className="size-4 flex-none text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-oxblood" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
