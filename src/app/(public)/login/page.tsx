import type { Metadata } from "next";
import { LoginCard } from "@/components/site/login-card";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[420px] px-5 py-12">
      <LoginCard heading="Log in" sub="Students, mentors and admin all use this page. We'll take you to the right place." />
    </div>
  );
}
