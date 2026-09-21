"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function BecomeAMentorPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success animate-gold-check">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">Application received</h1>
        <p className="mt-2 text-muted">
          We&apos;ll review your profile and email you within 3–4 days to schedule a short screening mock. Keep an eye on your inbox.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => setSubmitted(false)}>
          Submit another application
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Become a mentor</h1>
        <p className="mt-3 text-muted">Mentor MBA aspirants through GDPI season — paid per session, flexible hours.</p>
      </div>

      <Card padding="lg" className="mt-10">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Input label="Full name" placeholder="Your name" required />
            <Input label="Email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Input label="College / B-school" placeholder="e.g. IIM Ahmedabad" required />
            <Input label="Batch year" placeholder="e.g. 2025" required />
          </div>
          <Textarea
            label="GDPI experience"
            placeholder="Tell us about your own GDPI journey, any mentoring experience, debate/case-comp background…"
            required
          />
          <Input label="LinkedIn profile" placeholder="linkedin.com/in/you" required />
          <Select label="Availability, Jan–Mar" defaultValue="">
            <option value="" disabled>
              Select your typical availability
            </option>
            <option>Weekday evenings</option>
            <option>Weekends only</option>
            <option>Flexible, most days</option>
          </Select>
          <Textarea label="Why do you want to mentor?" placeholder="A few honest lines are enough." required />
          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Submit application
          </Button>
        </form>
      </Card>
    </div>
  );
}
