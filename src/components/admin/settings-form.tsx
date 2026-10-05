"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { saveSettingsAction } from "@/app/admin/actions";
import type { Settings } from "@/lib/settings";

const FOCUSES = ["HR_PROFILE", "ACADEMICS", "STRESS", "INSTITUTE_FINAL", "CURRENT_AFFAIRS", "CROSS_QUESTIONING"];

export function SettingsForm({ initial }: { initial: Settings }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const num = (k: keyof Settings) => ({ value: String(v[k]), onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) } as Settings) });
  const toggleArr = (k: "seniorRequiredFocuses" | "mockCounts", item: string) => setV({ ...v, [k]: v[k].includes(item) ? v[k].filter((x) => x !== item) : [...v[k], item] });

  return (
    <form className="flex max-w-[820px] flex-col gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await saveSettingsAction(v); setBusy(false); setMsg({ ok: r.ok, text: r.ok ? "Saved." : r.error }); }}>
      <fieldset className="rounded-[11px] border border-line bg-card p-4">
        <legend className="type-label px-1 text-ink-faint">Booking</legend>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div><label className="type-label mb-1.5 block text-ink-faint">Booking mode</label><select value={v.bookingMode} onChange={(e) => setV({ ...v, bookingMode: e.target.value as Settings["bookingMode"] })} className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-2.5 text-[13px]"><option value="AUTO_CONFIRM">Auto-confirm</option><option value="ADMIN_APPROVAL">Admin approval</option></select></div>
          <Field label="Hold minutes" type="number" {...num("holdMinutes")} />
          <Field label="Minimum lead time (hours)" type="number" {...num("minLeadHours")} />
          <Field label="Cancel notice (hours)" type="number" {...num("cancelNoticeHours")} />
          <Field label="Max reschedules" type="number" {...num("maxReschedules")} />
          <Field label="GD batch capacity" type="number" {...num("gdCapacity")} />
        </div>
      </fieldset>

      <fieldset className="rounded-[11px] border border-line bg-card p-4">
        <legend className="type-label px-1 text-ink-faint">Assignment</legend>
        <p className="mb-2 text-[11.5px] text-ink-faint">Senior-only PI focuses</p>
        <div className="flex flex-wrap gap-1.5">{FOCUSES.map((f) => <button type="button" key={f} onClick={() => toggleArr("seniorRequiredFocuses", f)} className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium ${v.seniorRequiredFocuses.includes(f) ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2"}`}>{f.replace("_", " ")}</button>)}</div>
        <label className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-2"><input type="checkbox" checked={v.adminAccrues} onChange={(e) => setV({ ...v, adminAccrues: e.target.checked })} />Admin&apos;s own sessions accrue pay</label>
      </fieldset>

      <fieldset className="rounded-[11px] border border-line bg-card p-4">
        <legend className="type-label px-1 text-ink-faint">Pay & referral bonus</legend>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Field label="Feedback due (hours)" type="number" {...num("feedbackDueHours")} />
          <Field label="Referral bonus: every N students" type="number" {...num("referralBonusEvery")} />
          <Field label="Referral bonus: % of their fees" type="number" {...num("referralBonusPercent")} />
          <Field label="Season start" type="date" value={v.seasonStart} onChange={(e) => setV({ ...v, seasonStart: e.target.value })} />
          <Field label="Season end" type="date" value={v.seasonEnd} onChange={(e) => setV({ ...v, seasonEnd: e.target.value })} />
        </div>
        <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">A mentor earns this percent of the fees paid by every complete group of N students who bought with their code. Purchases only count once their refund window has passed. Set the percent to 0 to switch it off.</p>
      </fieldset>

      <fieldset className="rounded-[11px] border border-line bg-card p-4">
        <legend className="type-label px-1 text-ink-faint">Compliance</legend>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Field label="Refund window (hours)" type="number" {...num("refundWindowHours")} />
          <Field label="Recording retention (days)" type="number" {...num("recordingRetentionDays")} />
          <Field label="Credit validity (days, 0 = never expire)" type="number" {...num("creditValidityDays")} />
          <Field label="Warn students (days before)" type="number" {...num("creditExpiryWarnDays")} />
        </div>
        <p className="mt-2 text-[11.5px] text-ink-faint">Leave validity at 0 unless your Terms say credits expire — it removes unused paid credits. Booked sessions are never affected, and students get a warning email first.</p>
        <label className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-2"><input type="checkbox" checked={v.gstEnabled} onChange={(e) => setV({ ...v, gstEnabled: e.target.checked })} />GST enabled (confirm with a CA before turning on)</label>
      </fieldset>

      <fieldset className="rounded-[11px] border border-line bg-card p-4">
        <legend className="type-label px-1 text-ink-faint">Testing</legend>
        <label className="flex items-center gap-2 text-[12.5px] text-ink-2"><input type="checkbox" checked={v.demoEnabled} onChange={(e) => setV({ ...v, demoEnabled: e.target.checked })} />Demo mode (demo logins, demo mentors on the public site, and demo rows in this portal)</label>
        <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">Keep this OFF for real use. The demo data stays stored; this only decides whether anyone can see or sign in to it. Takes up to a minute to apply.</p>
      </fieldset>

      <div className="flex items-center gap-3"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>{msg && <p className={`text-xs ${msg.ok ? "text-green" : "text-oxblood"}`}>{msg.text}</p>}</div>
    </form>
  );
}
