"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { saveBasicsAction } from "@/app/profile/actions";
import { cardCls, gridCls, gridStyle } from "@/components/profile/shared";

/** Name and phone. The email is the login, so it can't be edited here. */
export function BasicsForm({ name, email, phone, nameLocked = false }: { name: string; email: string; phone: string; nameLocked?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ name, phone });
  const [pending, start] = useTransition();
  return (
    <form className={cardCls} onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveBasicsAction(v); if (r.ok) { toast.success(r.message ?? "Saved."); router.refresh(); } else toast.error(r.error); }); }}>
      <div className={gridCls} style={gridStyle}>
        <Field label="Full name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" readOnly={nameLocked} disabled={nameLocked} hint={nameLocked ? "Your name appears on the public mentors page, so Samrudh changes it for you." : undefined} />
        <Field label="Mobile number" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} inputMode="tel" autoComplete="tel" hint="10 digits. Used for session reminders." />
        <Field label="Email (your login)" value={email} readOnly disabled hint="To change your email, message us." />
      </div>
      <div className="mt-3"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>
    </form>
  );
}
