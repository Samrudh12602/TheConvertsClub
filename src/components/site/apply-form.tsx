"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PendingNotice } from "@/components/ui/pending-notice";
import { mentorApplicationSchema, type MentorApplicationInput } from "@/lib/validation/forms";

export function ApplyForm() {
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MentorApplicationInput>({ resolver: zodResolver(mentorApplicationSchema), mode: "onTouched" });

  return (
    <Card className="p-[22px]">
      <h2 className="type-section text-ink">Apply</h2>
      <form noValidate onSubmit={handleSubmit(() => setPending(true))} aria-label="Mentor application">
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <Field label="Name" autoComplete="name" placeholder="Your full name" error={errors.name?.message} {...register("name")} />
          <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <Field label="Phone" type="tel" autoComplete="tel" placeholder="+91" error={errors.phone?.message} {...register("phone")} />
          <Field label="Institute and batch" placeholder="e.g. IIM Lucknow, 2026" error={errors.institute?.message} {...register("institute")} />
          <Field label="Calls you converted" placeholder="Which ones, and in which season" error={errors.callsConverted?.message} {...register("callsConverted")} />
          <Field label="Hours a week you can take" inputMode="numeric" placeholder="Be honest — 4 is fine" error={errors.hoursPerWeek?.message} {...register("hoursPerWeek")} />
        </div>
        <Button type="submit" size="lg" className="mt-[18px] rounded-[9px]">
          Send application
        </Button>
      </form>
      {pending && <PendingNotice>Applications aren&apos;t being stored in this environment yet, so nothing was sent. Your details are valid.</PendingNotice>}
    </Card>
  );
}
