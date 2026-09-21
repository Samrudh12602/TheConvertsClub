import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ApplyForm } from "@/components/site/apply-form";
import { mentorPerks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Become a mentor",
  description: "Take mocks on your own hours, paid per session, with no minimum commitment.",
};

export default function BecomeAMentorPage() {
  return (
    <div className="mx-auto flex max-w-[780px] flex-col gap-4 px-5 py-[26px]">
      <section className="rounded-xl bg-ink p-8">
        <h1 className="text-pretty font-display text-[clamp(24px,3.4vw,34px)] font-bold leading-[1.15] text-surface">
          You converted. Someone a year behind you is about to freeze in the same room.
        </h1>
        <p className="mt-3.5 max-w-[54ch] text-sm leading-[1.7] text-dark-soft">
          Take mocks on your own hours, paid per session, no minimum commitment. Most mentors do four to eight a week through February.
        </p>
      </section>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {mentorPerks.map((p) => (
          <li key={p.title}>
            <Card className="h-full">
              <h2 className="font-display text-[15px] font-bold leading-[1.3] text-ink">{p.title}</h2>
              <p className="mt-2 text-[12.5px] leading-[1.6] text-ink-muted">{p.body}</p>
            </Card>
          </li>
        ))}
      </ul>
      <ApplyForm />
    </div>
  );
}
