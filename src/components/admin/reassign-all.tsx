"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { reassignMentorSessionsAction } from "@/app/admin/actions";

/** For when a mentor goes on leave: move all their upcoming sessions to one other mentor in a single step. */
export function ReassignAll({ fromMentorId, upcoming, options }: { fromMentorId: string; upcoming: number; options: { id: string; label: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [to, setTo] = useState(options[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const target = options.find((o) => o.id === to)?.label ?? "that mentor";
  if (upcoming === 0) return <p className="text-[12.5px] text-ink-faint">No upcoming sessions to move.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Move sessions to" className="min-h-10 rounded-xl border border-line-strong bg-white px-3 text-[13px] text-ink shadow-xs">{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
      <Button variant="secondary" disabled={pending || !to} onClick={() => setOpen(true)}><Repeat className="size-4" aria-hidden />Move {upcoming} upcoming session{upcoming === 1 ? "" : "s"}</Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} danger title={`Move ${upcoming} session${upcoming === 1 ? "" : "s"} to ${target}?`} confirmLabel="Move them" busy={pending}
        body="Each student and both mentors are emailed, exactly as with a single reassignment. Sessions that can't move (a clash, or a different kind of hour) stay where they are, and you'll be told which."
        onConfirm={() => start(async () => { const r = await reassignMentorSessionsAction(fromMentorId, to); setOpen(false); if (r.ok) { toast.success(r.message ?? "Moved."); router.refresh(); } else toast.error(r.error); })} />
    </div>
  );
}

/** Download buttons for the admin exports. */
export function ExportLinks({ types }: { types: { type: "students" | "payments"; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((t) => <a key={t.type} href={`/api/admin/export?type=${t.type}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3.5 text-[12.5px] font-semibold text-ink no-underline shadow-xs transition hover:border-oxblood hover:no-underline">↓ {t.label}</a>)}
    </div>
  );
}
