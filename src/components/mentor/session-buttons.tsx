"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { noShowAction } from "@/app/mentor/actions";

export function NoShowButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Button variant="quiet" disabled={pending} onClick={() => { if (confirm("Mark this student as a no-show? Their credit is used.")) start(async () => { const r = await noShowAction(sessionId); if (!r.ok) setErr(r.error); else router.refresh(); }); }}>{pending ? "…" : "Mark no-show"}</Button>
      {err && <p role="alert" className="mt-1 text-xs text-oxblood">{err}</p>}
    </div>
  );
}
