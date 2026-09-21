"use client";

import { useState } from "react";
import { KeyRound, Mail, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "request" | "sent" | "expired";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");

  if (step === "sent") {
    return (
      <Card padding="lg" className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-info-bg text-info">
          <Mail size={22} />
        </div>
        <h1 className="font-display mt-4 text-xl font-semibold text-ink">Reset link sent</h1>
        <p className="mt-1.5 text-sm text-muted">We&apos;ve sent password reset instructions to {email || "your email"}.</p>
        <Button variant="outline" fullWidth className="mt-6" onClick={() => setStep("expired")}>
          Simulate: link expired
        </Button>
      </Card>
    );
  }

  if (step === "expired") {
    return (
      <Card padding="lg" className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
          <AlertTriangle size={22} />
        </div>
        <h1 className="font-display mt-4 text-xl font-semibold text-ink">This link has expired</h1>
        <p className="mt-1.5 text-sm text-muted">Reset links are valid for 30 minutes. Request a new one below.</p>
        <Button fullWidth className="mt-6" onClick={() => setStep("request")}>
          Send a new link
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="w-full max-w-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink mb-4">
        <KeyRound size={20} />
      </div>
      <h1 className="font-display text-xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted">Enter your email and we&apos;ll send you a link to reset it.</p>
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setStep("sent");
        }}
      >
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" fullWidth size="lg">
          Send reset link
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted">
        <a href="/login" className="font-semibold text-brand">
          Back to log in
        </a>
      </p>
    </Card>
  );
}
