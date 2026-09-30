"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateMyCouponCodeAction } from "@/app/mentor/actions";

export function CouponCodeForm({ code }: { code: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(code);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!editing) {
    return <button type="button" onClick={() => { setValue(code); setEditing(true); setMsg(null); }} className="mt-2 text-[11px] font-semibold text-oxblood underline">Change code</button>;
  }
  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await updateMyCouponCodeAction({ code: value });
        setBusy(false);
        setMsg({ ok: r.ok, text: r.ok ? "Saved." : r.error });
        if (r.ok) { setEditing(false); router.refresh(); }
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        maxLength={16}
        autoCapitalize="characters"
        className="min-h-9 w-40 rounded-lg border border-line-strong bg-white px-2.5 text-[13px] font-semibold tracking-[0.06em]"
      />
      <Button type="submit" size="sm" disabled={busy}>{busy ? "…" : "Save"}</Button>
      <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-medium text-ink-faint underline">Cancel</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`w-full text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}
    </form>
  );
}
