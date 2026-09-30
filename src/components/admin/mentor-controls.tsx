"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMentorPublicVisibleAction, setMentorStatusAction, setMentorTierAction } from "@/app/admin/actions";

export function TierSelect({ mentorId, tier }: { mentorId: string; tier: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select disabled={pending} defaultValue={tier} onChange={(e) => start(async () => { await setMentorTierAction(mentorId, e.target.value); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold">
      <option value="JUNIOR">Junior</option><option value="SENIOR">Senior</option>
    </select>
  );
}

export function StatusSelect({ mentorId, status }: { mentorId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select disabled={pending} defaultValue={status} onChange={(e) => start(async () => { await setMentorStatusAction(mentorId, e.target.value); router.refresh(); })} className="min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-[12.5px] font-semibold">
      <option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="OFFBOARDED">Offboarded</option>
    </select>
  );
}

/** Independent of status: a mentor can keep working and taking sessions while hidden from /mentors. */
export function PublicVisibleToggle({ mentorId, publicVisible }: { mentorId: string; publicVisible: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setMentorPublicVisibleAction(mentorId, !publicVisible); router.refresh(); })}
      className={`min-h-10 rounded-lg border px-2.5 text-[12.5px] font-semibold ${publicVisible ? "border-line-strong bg-white text-ink-2" : "border-oxblood-line bg-oxblood-tint text-oxblood"}`}
    >
      {pending ? "…" : publicVisible ? "Visible on /mentors" : "Hidden from /mentors"}
    </button>
  );
}
