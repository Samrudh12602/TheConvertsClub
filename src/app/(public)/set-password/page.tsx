import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FirstPasswordForm } from "@/components/site/first-password-form";
import { roleHome } from "@/lib/roles";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Choose your password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/set-password");
  if (!user.mustChangePassword) redirect(roleHome(user.role));
  return (
    <div className="mx-auto max-w-[460px] px-5 py-12">
      <Card className="rounded-[14px] p-7">
        <p className="type-eyebrow text-oxblood">First sign-in</p>
        <h1 className="mt-1.5 font-display text-[21px] font-bold leading-[1.25] text-ink">Choose your own password</h1>
        <p className="mt-2 text-[13px] leading-[1.6] text-ink-muted">You signed in with a temporary password. Set a permanent one now to continue. The temporary one stops working as soon as you do, and you can change your password any time from your profile.</p>
        <FirstPasswordForm />
      </Card>
    </div>
  );
}
