"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestDeletionAction } from "@/app/student/actions";

export function DeletionRequest() {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <span className="text-xs font-medium text-green">Requested. We&apos;ll confirm by email.</span>;
  return <Button size="sm" variant="quiet" disabled={pending} onClick={() => { if (confirm("Request deletion of your account and data? Uploads are removed within 30 days.")) start(async () => { const r = await requestDeletionAction(); if (r.ok) setDone(true); }); }}>{pending ? "…" : "Request"}</Button>;
}
