"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setMockStatusAction } from "@/app/admin/actions";

/** One mock's publish controls: a release time (optional) and publish / hide. */
export function MockControls({ id, slug, status, releaseAt }: { id: string; slug: string; status: "DRAFT" | "PUBLISHED"; releaseAt: string | null }) {
  const router = useRouter();
  const toast = useToast();
  // The input shows the time in the browser's own timezone; the saved value is an exact instant.
  const [at, setAt] = useState(() => { if (!releaseAt) return ""; const d = new Date(releaseAt); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); });
  const [pending, start] = useTransition();
  const run = (next: "DRAFT" | "PUBLISHED") => start(async () => {
    const r = await setMockStatusAction({ id, status: next, releaseAt: next === "PUBLISHED" && at ? new Date(at).toISOString() : null });
    if (r.ok) { toast.success(r.message ?? "Saved."); router.refresh(); } else toast.error(r.error);
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="datetime-local" aria-label="Opens at (leave empty to open at once)" value={at} onChange={(e) => setAt(e.target.value)} className="min-h-9 rounded-lg border border-line-strong bg-white px-2 text-xs" suppressHydrationWarning />
      {status === "PUBLISHED" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => run("DRAFT")}>Hide</Button> : null}
      <Button size="sm" disabled={pending} onClick={() => run("PUBLISHED")}>{status === "PUBLISHED" ? "Update time" : "Publish"}</Button>
      <Link href={`/exam/${slug}`} target="_blank" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink no-underline hover:border-oxblood hover:no-underline"><Eye className="size-3.5" aria-hidden />Preview</Link>
    </div>
  );
}
