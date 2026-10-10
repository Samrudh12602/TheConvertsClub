"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { saveMentorAboutAction } from "@/app/profile/actions";
import { cardCls, gridCls, gridStyle, labelCls, areaCls } from "@/components/profile/shared";

/** What a mentor tells us about their own background: where they converted, their scores, where they work now. */
export function MentorAboutForm({ initial }: { initial: { convertedInstitutes: string; examScores: string; company: string; jobRole: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    const list = v.convertedInstitutes.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const r = await saveMentorAboutAction({ convertedInstitutes: list, examScores: v.examScores, company: v.company, jobRole: v.jobRole });
    if (r.ok) { toast.success(r.message ?? "Saved."); router.refresh(); } else toast.error(r.error);
  });
  return (
    <form className={cardCls} onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div><label htmlFor="mp-conv" className={labelCls}>Institutes you converted</label><textarea id="mp-conv" rows={2} className={areaCls} value={v.convertedInstitutes} onChange={(e) => setV({ ...v, convertedInstitutes: e.target.value })} placeholder="IIM Calcutta, XLRI Jamshedpur, FMS Delhi" /><p className="mt-1.5 text-xs text-ink-faint">Separate with commas. Shown to the admin team, not on the public page.</p></div>
      <div className={`${gridCls} mt-3`} style={gridStyle}>
        <Field label="Your entrance-exam scores" value={v.examScores} onChange={(e) => setV({ ...v, examScores: e.target.value })} placeholder="CAT 99.2 percentile, XAT 98" />
        <Field label="Company" value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} />
        <Field label="Role" value={v.jobRole} onChange={(e) => setV({ ...v, jobRole: e.target.value })} />
      </div>
      <div className="mt-3"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>
    </form>
  );
}
