"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { saveStudentBackgroundAction } from "@/app/profile/actions";
import { BOARDS, EXAMS, STATES } from "@/lib/profile";
import { areaCls, cardCls, gridCls, gridStyle, labelCls, selectCls } from "@/components/profile/shared";

export interface StudentBackgroundValues {
  dob: string; state: string; city: string; examsAppearing: string[];
  tenthBoard: string; tenthPercent: string; tenthYear: string; twelfthBoard: string; twelfthStream: string; twelfthPercent: string; twelfthYear: string;
  college: string; degree: string; gradYear: string; gradScore: string; workExMonths: string; company: string; jobRole: string; industry: string; about: string;
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className={cardCls}><h3 className="text-[13.5px] font-bold text-ink">{title}</h3>{hint && <p className="mt-0.5 text-[11.5px] leading-[1.5] text-ink-faint">{hint}</p>}<div className="mt-3">{children}</div></section>;
}

/** Everything a student can tell us about themselves. All of it is optional, and only they and the admin team can see it. */
export function StudentBackgroundForm({ initial }: { initial: StudentBackgroundValues }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const set = (k: keyof StudentBackgroundValues, val: string) => setV((x) => ({ ...x, [k]: val }));
  const toggleExam = (e: string) => setV((x) => ({ ...x, examsAppearing: x.examsAppearing.includes(e) ? x.examsAppearing.filter((y) => y !== e) : [...x.examsAppearing, e] }));
  const save = () => start(async () => { const r = await saveStudentBackgroundAction(v); if (r.ok) { toast.success(r.message ?? "Saved."); router.refresh(); } else toast.error(r.error); });
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <Block title="About you">
        <div className={gridCls} style={gridStyle}>
          <Field label="Date of birth" type="date" value={v.dob} onChange={(e) => set("dob", e.target.value)} />
          <div><label htmlFor="pf-state" className={labelCls}>State</label><select id="pf-state" className={selectCls} value={v.state} onChange={(e) => set("state", e.target.value)}><option value="">Select</option>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <Field label="City" value={v.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
        </div>
        <div className="mt-3"><label htmlFor="pf-about" className={labelCls}>A few lines about you (optional)</label><textarea id="pf-about" rows={3} maxLength={600} className={areaCls} value={v.about} onChange={(e) => set("about", e.target.value)} placeholder="What you're aiming for, what you're good at, what worries you." /></div>
      </Block>

      <Block title="Exams you're giving" hint="Pick all that apply.">
        <div className="flex flex-wrap gap-2">
          {EXAMS.map((e) => { const on = v.examsAppearing.includes(e); return <button key={e} type="button" aria-pressed={on} onClick={() => toggleExam(e)} className={clsx("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition", on ? "border-oxblood bg-oxblood text-white" : "border-line-strong bg-white text-ink-2 hover:border-oxblood")}>{e}</button>; })}
        </div>
      </Block>

      <Block title="School" hint="10th and 12th, the way they appear on your marksheet.">
        <div className={gridCls} style={gridStyle}>
          <div><label htmlFor="pf-10b" className={labelCls}>10th board</label><select id="pf-10b" className={selectCls} value={v.tenthBoard} onChange={(e) => set("tenthBoard", e.target.value)}><option value="">Select</option>{BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
          <Field label="10th percentage" inputMode="decimal" value={v.tenthPercent} onChange={(e) => set("tenthPercent", e.target.value)} />
          <Field label="10th year" inputMode="numeric" value={v.tenthYear} onChange={(e) => set("tenthYear", e.target.value)} placeholder="e.g. 2018" />
          <div><label htmlFor="pf-12b" className={labelCls}>12th board</label><select id="pf-12b" className={selectCls} value={v.twelfthBoard} onChange={(e) => set("twelfthBoard", e.target.value)}><option value="">Select</option>{BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
          <Field label="12th stream" value={v.twelfthStream} onChange={(e) => set("twelfthStream", e.target.value)} placeholder="Science, Commerce, Arts…" />
          <Field label="12th percentage" inputMode="decimal" value={v.twelfthPercent} onChange={(e) => set("twelfthPercent", e.target.value)} />
          <Field label="12th year" inputMode="numeric" value={v.twelfthYear} onChange={(e) => set("twelfthYear", e.target.value)} placeholder="e.g. 2020" />
        </div>
      </Block>

      <Block title="Graduation">
        <div className={gridCls} style={gridStyle}>
          <Field label="College" value={v.college} onChange={(e) => set("college", e.target.value)} />
          <Field label="Degree and branch" value={v.degree} onChange={(e) => set("degree", e.target.value)} placeholder="B.Tech, Mechanical" />
          <Field label="Graduation year" inputMode="numeric" value={v.gradYear} onChange={(e) => set("gradYear", e.target.value)} />
          <Field label="CGPA or percentage" value={v.gradScore} onChange={(e) => set("gradScore", e.target.value)} placeholder="8.1 CGPA" />
        </div>
      </Block>

      <Block title="Work experience" hint="A fresher? Put 0 months and leave the rest blank.">
        <div className={gridCls} style={gridStyle}>
          <Field label="Total experience (months)" inputMode="numeric" value={v.workExMonths} onChange={(e) => set("workExMonths", e.target.value)} />
          <Field label="Company" value={v.company} onChange={(e) => set("company", e.target.value)} />
          <Field label="Role" value={v.jobRole} onChange={(e) => set("jobRole", e.target.value)} />
          <Field label="Industry" value={v.industry} onChange={(e) => set("industry", e.target.value)} placeholder="IT services, Banking…" />
        </div>
      </Block>

      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button><p className="text-[11.5px] text-ink-faint">Only you and the admin team can see this.</p></div>
    </form>
  );
}
