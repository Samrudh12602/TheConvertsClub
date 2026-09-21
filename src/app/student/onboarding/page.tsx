import { PortalPage } from "@/components/portal/portal-page";
import { OnboardingWizard } from "@/components/student/onboarding-wizard";
import { requireStudent } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await requireStudent();
  const p = user.studentProfile;
  return (
    <PortalPage>
      <OnboardingWizard initial={{ college: p?.college ?? "", degree: p?.degree ?? "", workExMonths: p?.workExMonths?.toString() ?? "", phone: user.phone ?? "", targetInstitutes: p?.targetInstitutes ?? [], weakAreas: p?.weakAreas ?? [], step: p?.onboardedAt ? 0 : p?.onboardingStep ?? 0 }} />
    </PortalPage>
  );
}
