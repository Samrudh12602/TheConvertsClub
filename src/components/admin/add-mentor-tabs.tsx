"use client";

import { useState } from "react";
import { AddMentorForm } from "@/components/admin/add-mentor-form";
import { InviteMentorForm } from "@/components/admin/invite-mentor-form";

/** Two ways to bring on a mentor: invite by email (they set up their own profile), or add them
 * directly with a photo now and let them log in whenever they're ready. */
export function AddMentorTabs() {
  const [tab, setTab] = useState<"invite" | "direct">("direct");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2" role="tablist" aria-label="How to add a mentor">
        <button type="button" role="tab" aria-selected={tab === "direct"} onClick={() => setTab("direct")} className={`rounded-full border px-3.5 py-2 text-xs font-medium ${tab === "direct" ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2"}`}>Add directly</button>
        <button type="button" role="tab" aria-selected={tab === "invite"} onClick={() => setTab("invite")} className={`rounded-full border px-3.5 py-2 text-xs font-medium ${tab === "invite" ? "border-ink bg-ink text-surface" : "border-line-strong bg-white text-ink-2"}`}>Invite by email</button>
      </div>
      {tab === "direct" ? <AddMentorForm /> : <InviteMentorForm />}
    </div>
  );
}
