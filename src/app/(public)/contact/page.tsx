import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/site/contact-form";
import { currentUser } from "@/server/session";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Contact", description: "Questions about payments, booking or mentoring? Message the team." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await currentUser();
  return (
    <div className="mx-auto max-w-[620px] px-5 py-[26px]">
      <h1 className="type-page text-ink">Talk to us</h1>
      <p className="mt-2 text-pretty text-sm leading-[1.7] text-ink-muted">A real person reads every message. Payment or booking trouble? Include your order number or the session time and we&apos;ll sort it out.</p>
      <dl className="mt-4 grid gap-2.5 text-[13.5px] sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-card px-4 py-3 shadow-card">
          <dt className="type-label text-ink-faint">Email</dt>
          <dd className="mt-1 font-semibold"><a href={`mailto:${BUSINESS.supportEmail}`} className="text-ink no-underline hover:underline">{BUSINESS.supportEmail}</a></dd>
        </div>
        <div className="rounded-xl border border-line bg-card px-4 py-3 shadow-card">
          <dt className="type-label text-ink-faint">Phone</dt>
          <dd className="mt-1 font-semibold"><a href={BUSINESS.phoneHref} className="text-ink no-underline hover:underline">{BUSINESS.phone}</a></dd>
        </div>
      </dl>
      <Card className="mt-5 rounded-[14px] p-6">
        <ContactForm defaultName={user?.name?.replace(/\s*\(demo.*?\)/, "") ?? ""} defaultEmail={user && !user.isDemo ? user.email : ""} />
      </Card>
    </div>
  );
}
