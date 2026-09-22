import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupCard } from "@/components/site/signup-card";
import { roleHome, safeNext } from "@/lib/roles";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user) redirect(safeNext(sp.next) ?? roleHome(session.user.role));

  return (
    <div className="mx-auto max-w-[420px] px-5 py-12">
      <SignupCard next={safeNext(sp.next) ?? undefined} />
    </div>
  );
}
