import type { Metadata } from "next";
import { GuideView } from "@/components/site/guide-view";
import { GUIDE_TITLE } from "@/lib/free-guide";

export const metadata: Metadata = { title: GUIDE_TITLE, description: "A free, practical checklist for the last 48 hours before your MBA personal interview." };

export default function FreeGuidePage() {
  return (
    <div className="mx-auto max-w-[620px] px-5 py-[26px]">
      <p className="type-eyebrow text-oxblood">Free</p>
      <h1 className="type-page mt-1.5 text-ink">{GUIDE_TITLE}</h1>
      <p className="mt-2 mb-5 text-pretty text-sm leading-[1.7] text-ink-muted">Ten things to do before your PI, in the order to do them. Written by people who sat the same panels last season. Leave your email and we&apos;ll send it, no account needed.</p>
      <GuideView />
    </div>
  );
}
