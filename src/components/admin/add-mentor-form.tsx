"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { addMentorDirectAction } from "@/app/admin/actions";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Admin creates a mentor account immediately — no invite email round-trip. Photo is optional
 * (upload a file, or paste an external URL instead); the mentor logs in normally once set up. */
export function AddMentorForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [tier, setTier] = useState("JUNIOR");
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, action, pending] = useActionState<Result | null, FormData>(async (_prev, fd) => {
    const r = await addMentorDirectAction(null, fd);
    if (r.ok) {
      formRef.current?.reset();
      setFileName(null);
      router.refresh();
    }
    return r;
  }, null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-[11px] border border-line bg-card p-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Field label="Name" name="name" required placeholder="Full name" />
        <Field label="Email" name="email" type="email" required placeholder="mentor@example.com" />
        <div>
          <label className="type-label mb-1.5 block text-ink-faint">Tier</label>
          <select name="tier" value={tier} onChange={(e) => setTier(e.target.value)} className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-2.5 text-[13px]">
            <option value="JUNIOR">Junior</option>
            <option value="SENIOR">Senior</option>
          </select>
        </div>
        <Field label="College and batch" name="college" placeholder="e.g. IIM Bangalore" />
        <Field label="Batch year" name="batchYear" type="number" placeholder="2025" />
        <Field label="Meeting link" name="meetingUrl" type="url" placeholder="https://meet.google.com/…" />
        <Field label="LinkedIn (admin reference only)" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/…" />
      </div>
      <div>
        <label className="type-label mb-1.5 block text-ink-faint">Bio (two lines, shown on the public mentors page)</label>
        <textarea name="bio" maxLength={300} rows={2} className="w-full rounded-lg border border-line-strong bg-white p-2.5 text-[13px] leading-normal" />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <label className="type-label mb-1.5 block text-ink-faint">Professional photo</label>
          <input name="photo" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} className="block w-full text-[12.5px] text-ink-2 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:text-[11.5px] file:font-semibold file:text-white" />
          {fileName && <p className="mt-1 text-[11px] text-ink-faint">{fileName}</p>}
        </div>
        <Field label="…or paste a photo URL instead" name="photoUrl" type="url" placeholder="https://…" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Setting up…" : "Add mentor"}</Button>
        {state && <p role={state.ok ? "status" : "alert"} className={`text-xs ${state.ok ? "text-green" : "text-oxblood"}`}>{state.ok ? state.message : state.error}</p>}
      </div>
    </form>
  );
}
