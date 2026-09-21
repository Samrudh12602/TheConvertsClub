"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinGdAction, leaveGdAction } from "@/app/student/actions";

export function GdButton({ batchId, mode, label }: { batchId: string; mode: "join" | "leave" | "waitlist"; label: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant={mode === "join" ? "dark" : "secondary"} disabled={pending}
        className={mode === "leave" ? "text-oxblood" : ""}
        onClick={() => start(async () => {
          setErr(null);
          if (mode === "leave" && !confirm("Leave this batch? Under the notice period your credit is used.")) return;
          const r = mode === "leave" ? await leaveGdAction(batchId) : await joinGdAction(batchId);
          if (!r.ok) setErr(r.error); else router.refresh();
        })}>{pending ? "…" : label}</Button>
      {err && <p role="alert" className="max-w-[200px] text-right text-[11px] leading-[1.3] text-oxblood">{err}</p>}
    </div>
  );
}
