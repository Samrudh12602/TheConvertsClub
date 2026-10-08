"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setPanelistsAction } from "@/app/admin/actions";

export interface PanelOption { id: string; label: string; note: string; busy: boolean }
export interface PanelSeatView { mentorId: string; name: string; status: "INVITED" | "ACCEPTED" | "DECLINED" }

const CHIP = { ACCEPTED: "bg-teal-tint text-teal", INVITED: "bg-gold-tint text-gold-deep", DECLINED: "bg-oxblood-tint text-oxblood" } as const;
const WORD = { ACCEPTED: "accepted", INVITED: "invited", DECLINED: "declined" } as const;

/** The owner picks the two other panelists. Their hour is held and they're invited the moment this is sent. */
export function PanelPicker({ sessionId, options, seats }: { sessionId: string; options: PanelOption[]; seats: PanelSeatView[] }) {
  const router = useRouter();
  const toast = useToast();
  const live = seats.filter((s) => s.status !== "DECLINED");
  const [pick, setPick] = useState<string[]>(live.map((s) => s.mentorId));
  const [pending, start] = useTransition();
  const toggle = (id: string) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id]));
  const same = pick.length === live.length && pick.every((id) => live.some((s) => s.mentorId === id));
  const accepted = live.filter((s) => s.status === "ACCEPTED").length;
  return (
    <div className="basis-full rounded-xl border border-line bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Users aria-hidden className="size-4 text-oxblood" />
        <p className="text-[12.5px] font-semibold text-ink">Panel: you plus two</p>
        <span className={clsx("rounded-full px-2.5 py-1 text-[10.5px] font-semibold", accepted === 2 ? "bg-teal-tint text-teal" : "bg-gold-tint text-gold-deep")}>{accepted === 2 ? "Panel complete" : `${accepted} of 2 accepted`}</span>
        {seats.map((s) => <span key={s.mentorId} className={clsx("rounded-full px-2.5 py-1 text-[10.5px] font-semibold", CHIP[s.status])}>{s.name} · {WORD[s.status]}</span>)}
      </div>
      <p className="mt-2 text-[11.5px] text-ink-faint">Pick two mentors. Their hour is held automatically and they get an invite to accept.</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Choose two panelists">
        {options.map((o) => {
          const on = pick.includes(o.id);
          return (
            <button key={o.id} type="button" aria-pressed={on} disabled={o.busy} onClick={() => toggle(o.id)} title={o.note}
              className={clsx("rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "border-oxblood bg-oxblood-tint text-oxblood" : "border-line-strong bg-white text-ink-2 hover:border-oxblood", o.busy && "cursor-not-allowed opacity-45")}>
              {o.label}<span className="ml-1.5 font-normal text-ink-faint">{o.note}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3"><Button size="sm" disabled={pending || pick.length !== 2 || same} onClick={() => start(async () => { const r = await setPanelistsAction(sessionId, pick); if (r.ok) { toast.success(r.message ?? "Sent."); router.refresh(); } else toast.error(r.error); })}>{pending ? "Sending…" : live.length ? "Update panel" : "Send invites"}</Button></div>
    </div>
  );
}
