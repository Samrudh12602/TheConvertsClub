import { notFound, redirect } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { PortalPage } from "@/components/portal/portal-page";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { gdpiComingSoon } from "@/server/site-mode";
import { LOCKED_FEATURES, studentStage, type LockedKey } from "@/server/student-kind";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Not open yet" };

/** What a student sees where an interview-prep screen would be: what it is, why it isn't open to them, and what to do about it. */
export default async function LockedFeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const user = await requireStudent();
  const { feature } = await params;
  const f = LOCKED_FEATURES[feature as LockedKey];
  if (!f) notFound();
  const [stage, soon] = await Promise.all([studentStage(db, user.id), gdpiComingSoon()]);
  if (stage === "gdpi") redirect(f.path); // they have a plan: the real screen
  return (
    <PortalPage width="max-w-[640px]">
      <section className="rounded-2xl border border-line bg-card p-7 text-center shadow-card">
        <span className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${soon ? "bg-gold-tint text-gold-deep" : "bg-oxblood-tint text-oxblood"}`}>{soon ? <Sparkles className="size-7" aria-hidden /> : <Lock className="size-7" aria-hidden />}</span>
        <p className={`type-eyebrow mt-5 ${soon ? "text-gold-deep" : "text-oxblood"}`}>{soon ? "Coming soon" : "Part of the interview-prep plans"}</p>
        <h2 className="mt-2 font-display text-[24px] font-bold leading-[1.2] text-ink">{f.label}</h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-[14px] leading-[1.7] text-ink-muted">{f.blurb}</p>
        <p className="mx-auto mt-4 max-w-[48ch] text-[13px] leading-[1.65] text-ink-faint">
          {soon
            ? "Interview prep opens after the SNAP mocks. When it does, it unlocks here for anyone with a plan."
            : "This unlocks with an interview-prep plan. Pick one and it opens straight away."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {soon || stage === "new" ? <ButtonLink href="/student/mocks" size="lg">{stage === "new" ? "Start with a SNAP mock" : "Go to my SNAP mocks"}</ButtonLink> : <ButtonLink href="/packages" size="lg">See the plans</ButtonLink>}
          {stage === "mocks" && <ButtonLink href="/student/messages" variant="secondary" size="lg">Ask us about it</ButtonLink>}
        </div>
      </section>
    </PortalPage>
  );
}
