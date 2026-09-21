"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";

const DOCS: Record<string, { title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: "Terms of Service",
    updated: "1 September 2026",
    sections: [
      { heading: "1. Using The Convert Club", body: "By purchasing a package or service, you agree to use the platform solely for GDPI preparation for your own MBA admissions process." },
      { heading: "2. Sessions and credits", body: "Each package grants a fixed number of session credits. Credits expire at the end of the admissions season (31 March) and are non-transferable." },
      { heading: "3. Mentor conduct", body: "Mentors are current students or alumni. Feedback reflects mentor judgement and is not a guarantee of admission outcomes." },
      { heading: "4. Payments", body: "All payments are processed via Razorpay. Prices are in INR and inclusive of applicable taxes unless stated otherwise." },
      { heading: "5. Account suspension", body: "Accounts may be suspended for abusive behaviour toward mentors or platform staff, or for sharing session recordings without consent." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "1 September 2026",
    sections: [
      { heading: "1. What we collect", body: "Your name, contact details, academic background, uploaded documents (resume, SOP) and session feedback." },
      { heading: "2. Who can see it", body: "Your profile and feedback are visible only to you, your assigned mentor, and Admin. We never share it outside the platform." },
      { heading: "3. How we use it", body: "To match you with mentors, personalise your prep materials, and improve session quality." },
      { heading: "4. Data retention", body: "We retain your data for the duration of the season plus 12 months, after which it is anonymised or deleted on request." },
      { heading: "5. Your rights", body: "You may request export or deletion of your data at any time from Profile & Settings or by contacting support." },
    ],
  },
  refund: {
    title: "Refund Policy",
    updated: "1 September 2026",
    sections: [
      { heading: "1. Packages", body: "Unused packages are refundable, minus the value of any completed sessions, within 7 days of purchase." },
      { heading: "2. Individual services", body: "Individual services (Mock PI, GD/GE, WAT, SOP review) are non-refundable once a session is confirmed with a mentor." },
      { heading: "3. Cancellations by mentors", body: "If a mentor cancels or is a no-show, the credit is restored automatically and you may rebook at no extra cost." },
      { heading: "4. How to request", body: "Email support with your order ID. Approved refunds are processed to the original payment method within 5–7 business days." },
    ],
  },
};

export default function LegalDocPage() {
  const params = useParams<{ doc: string }>();
  const doc = DOCS[params.doc as string];
  if (!doc) return notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-ink">{doc.title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {doc.updated}</p>
      <div className="mt-10 space-y-8">
        {doc.sections.map((s) => (
          <div key={s.heading}>
            <h2 className="font-semibold text-ink text-lg">{s.heading}</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
