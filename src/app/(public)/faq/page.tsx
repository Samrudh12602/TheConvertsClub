import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { faqs as getFaqs } from "@/lib/content";

export const metadata: Metadata = { title: "FAQ", description: "Mentors, booking, rescheduling, recordings, refunds and privacy." };

export default async function FaqPage() {
  const faqs = await getFaqs();
  return (
    <div className="mx-auto flex max-w-[780px] flex-col gap-2.5 px-5 py-[26px]">
      <h1 className="type-page mb-1.5 text-ink">Questions</h1>
      {faqs.map((f) => (
        <Card key={f.q} className="rounded-[10px] p-[18px]">
          <h2 className="text-sm font-semibold leading-[1.4] text-ink">{f.q}</h2>
          <p className="mt-2 text-pretty text-[13.5px] leading-[1.7] text-ink-muted">{f.a}</p>
        </Card>
      ))}
    </div>
  );
}
