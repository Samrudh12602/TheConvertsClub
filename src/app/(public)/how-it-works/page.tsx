import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { steps as getSteps } from "@/lib/content";

export const metadata: Metadata = {
  title: "How it works",
  description: "Buy, tell us about your profile, pick a slot, sit the mock, read the feedback.",
};

export default async function HowItWorksPage() {
  const steps = await getSteps();
  return (
    <div className="mx-auto flex max-w-[840px] flex-col gap-3.5 px-5 py-[26px]">
      <h1 className="type-page text-ink">How it works</h1>
      <ol className="flex flex-col gap-3.5">
        {steps.map((s) => (
          <li key={s.n}>
            <Card className="flex flex-wrap gap-[18px] p-[22px]">
              <span aria-hidden className="w-11 flex-none font-display text-[30px] font-bold leading-none text-oxblood-pale">
                {s.n}
              </span>
              <div className="min-w-0 flex-[1_1_240px]">
                <h2 className="font-display text-[16.5px] font-bold leading-[1.3] text-ink">
                  <span className="sr-only">Step {Number(s.n)}: </span>
                  {s.title}
                </h2>
                <p className="mt-2 text-pretty text-[13.5px] leading-[1.65] text-ink-muted">{s.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
