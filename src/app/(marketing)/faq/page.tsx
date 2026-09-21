import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { faqs } from "@/lib/data";

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Frequently asked questions</h1>
        <p className="mt-3 text-muted">Everything about packages, rescheduling, refunds and confidentiality.</p>
      </div>
      <div className="mt-10">
        <FaqAccordion items={faqs} />
      </div>
    </div>
  );
}
