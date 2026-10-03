import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AcceptTermsForm } from "@/components/site/accept-terms-form";
import { DOC_LABEL, LEGAL_VERSION } from "@/lib/legal";
import { roleHome } from "@/lib/roles";
import { outstandingDocs } from "@/server/legal-acceptance";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Agree to our terms", robots: { index: false } };
export const dynamic = "force-dynamic";

const BLURB: Record<string, string> = {
  terms: "What we provide, how booking and credits work, how we expect everyone to behave, and the limits of our responsibility.",
  privacy: "What personal data we collect, who sees it, how long we keep it, and your rights under the DPDP Act.",
  refunds: "When you can get your money back and how long it takes.",
  "mentor-agreement": "Your role as an independent mentor: expectations, pay and tax, student confidentiality, and ending the arrangement.",
};

export default async function AcceptTermsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/accept-terms");
  const todo = await outstandingDocs(user);
  if (todo.length === 0) redirect(roleHome(user.role));
  const mentor = user.role === "MENTOR";
  return (
    <div className="mx-auto max-w-[560px] px-5 py-12">
      <Card className="rounded-[14px] p-7">
        <p className="type-eyebrow text-oxblood">One last step</p>
        <h1 className="mt-1.5 font-display text-[21px] font-bold leading-[1.25] text-ink">{mentor ? "Review and accept your mentor terms" : "Review and accept our terms"}</h1>
        <p className="mt-2 text-[13px] leading-[1.6] text-ink-muted">
          Before you continue we need your agreement to the documents below (version {LEGAL_VERSION}). Open each one to read it. We keep a record of when you agreed.
        </p>
        <AcceptTermsForm docs={todo.map((k) => ({ key: k, label: DOC_LABEL[k], blurb: BLURB[k] }))} mentor={mentor} />
      </Card>
    </div>
  );
}
