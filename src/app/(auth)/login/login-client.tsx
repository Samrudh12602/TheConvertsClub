"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, Loader2, GraduationCap, Users, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { currentStudent, currentMentor } from "@/lib/data";

type DemoRole = "student" | "mentor" | "admin";
type Step = "form" | "sent" | "transition" | "2fa";

const DEMO_ACCOUNTS: { role: DemoRole; name: string; email: string; icon: typeof GraduationCap; dest: string }[] = [
  { role: "student", name: currentStudent.name, email: currentStudent.email, icon: GraduationCap, dest: "/student/dashboard" },
  { role: "mentor", name: currentMentor.name, email: currentMentor.email, icon: Users, dest: "/mentor/dashboard" },
  { role: "admin", name: "Samrudh", email: "samrudh@convertsclub.in", icon: LayoutGrid, dest: "/admin" },
];

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [active, setActive] = useState<typeof DEMO_ACCOUNTS[number] | null>(null);
  const [code, setCode] = useState("");

  const startDemo = (account: typeof DEMO_ACCOUNTS[number]) => {
    setActive(account);
    setEmail(account.email);
    setStep("transition");
    if (account.role === "admin") {
      setTimeout(() => setStep("2fa"), 1400);
    } else {
      setTimeout(() => router.push(account.dest as never), 1400);
    }
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("sent");
  };

  const simulateMagicLinkClick = () => {
    const match = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? DEMO_ACCOUNTS[0];
    startDemo(match);
  };

  const submit2fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (active) router.push(active.dest as never);
  };

  if (step === "transition" && active) {
    return (
      <Card padding="lg" className="w-full max-w-sm text-center">
        <Loader2 size={26} className="mx-auto animate-spin text-brand" />
        <p className="mt-4 font-display text-lg font-semibold text-ink">Welcome back, {active.name.split(" ")[0]}.</p>
        <p className="mt-1 text-sm text-muted">Taking you to your {active.role} dashboard…</p>
      </Card>
    );
  }

  if (step === "2fa" && active) {
    return (
      <Card padding="lg" className="w-full max-w-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning-bg text-warning mb-4">
          <ShieldCheck size={20} />
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">Verify it&apos;s you</h1>
        <p className="mt-1.5 text-sm text-muted">Admin accounts require two-factor verification. Enter the 6-digit code sent to your device.</p>
        <form onSubmit={submit2fa} className="mt-5 space-y-4">
          <Input
            label="Verification code"
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Button type="submit" fullWidth size="lg">
            Verify and continue
          </Button>
          <p className="text-center text-xs text-muted">
            Didn&apos;t get a code? <button type="button" className="font-semibold text-brand">Resend</button>
          </p>
        </form>
      </Card>
    );
  }

  if (step === "sent") {
    return (
      <Card padding="lg" className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-info-bg text-info">
          <Mail size={22} />
        </div>
        <h1 className="font-display mt-4 text-xl font-semibold text-ink">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted">We sent a sign-in link to {email || "your email"}. Click it to continue.</p>
        <Button variant="outline" fullWidth className="mt-6" onClick={simulateMagicLinkClick}>
          Simulate: I clicked the link
        </Button>
        <button onClick={() => setStep("form")} className="mt-3 text-xs font-semibold text-muted hover:text-ink">
          Use a different email
        </button>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Card padding="lg">
        <h1 className="font-display text-2xl font-semibold text-ink text-center">Log in</h1>
        <p className="mt-1.5 text-sm text-muted text-center">One account, routed to your Student, Mentor or Admin portal.</p>

        <button className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-border-strong h-11 text-sm font-semibold text-ink hover:bg-sunken">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-muted">or continue with email</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <form onSubmit={submitEmail} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" fullWidth size="lg">
            Send magic link
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          Prefer a password?{" "}
          <a href="/forgot-password" className="font-semibold text-brand">
            Use password instead
          </a>
        </p>
      </Card>

      <div className="mt-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted mb-3">Demo accounts — prototype only</p>
        <div className="grid grid-cols-3 gap-2.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.role}
              onClick={() => startDemo(a)}
              className="flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border border-hairline bg-surface py-3.5 text-xs font-semibold text-ink hover:border-brand"
            >
              <a.icon size={18} className="text-brand" />
              <span className="capitalize">{a.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.6-6.6C35.3 2.6 30 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.7 6C12.1 13 17.5 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 2.9-2.2 5.4-4.7 7l7.4 5.8c4.3-4 6.8-9.9 6.8-17.3z" />
      <path fill="#FBBC05" d="M10.2 19.2A14.5 14.5 0 0 0 9.5 24c0 1.7.3 3.3.7 4.8l-7.7 6A24 24 0 0 1 0 24c0-3.9.9-7.6 2.5-10.8l7.7 6z" />
      <path fill="#34A853" d="M24 48c6 0 11.3-2 15-5.3l-7.4-5.8c-2 1.4-4.7 2.3-7.6 2.3-6.5 0-11.9-3.5-13.8-8.7l-7.7 6C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
