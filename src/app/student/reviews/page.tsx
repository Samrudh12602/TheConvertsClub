"use client";

import { useState } from "react";
import { FileText, UploadCloud, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";

type ReviewStatus = "Not submitted" | "Submitted" | "In review" | "Feedback ready";

interface WatItem {
  id: string;
  prompt: string;
  status: ReviewStatus;
  feedback?: string;
}

const WAT_ITEMS: WatItem[] = [
  { id: "w1", prompt: "Should social media platforms be regulated like utilities?", status: "Feedback ready", feedback: "Strong opening hook. Your third paragraph drifts off-topic — cut it and expand the conclusion instead. Watch run-on sentences under time pressure." },
  { id: "w2", prompt: "Is remote work the future of Indian IT services?", status: "In review" },
];

export default function ReviewsPage() {
  const [tab, setTab] = useState("wat");
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sopUploaded, setSopUploaded] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink">WAT & SOP reviews</h1>
      <Tabs tabs={[{ key: "wat", label: "WAT" }, { key: "sop", label: "SOP" }]} active={tab} onChange={setTab} />

      {tab === "wat" && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="New WAT prompt" subtitle="You have 20 minutes once you start writing." />
            {submitted ? (
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-success/25 bg-success-bg p-4">
                <CheckCircle2 size={18} className="text-success" />
                <p className="text-sm text-ink">Submitted. A mentor will evaluate it within 24 hours.</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-ink mb-3">
                  &ldquo;Should India&apos;s gig economy workers get the same benefits as full-time employees?&rdquo;
                </p>
                <Textarea rows={8} placeholder="Write your response here…" value={response} onChange={(e) => setResponse(e.target.value)} />
                <Button className="mt-3" disabled={!response.trim()} onClick={() => setSubmitted(true)}>
                  Submit response
                </Button>
              </>
            )}
          </Card>

          {WAT_ITEMS.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink flex-1">{item.prompt}</p>
                <StatusBadge status={item.status} />
              </div>
              {item.feedback && (
                <div className="mt-3 rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-3.5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Feedback</p>
                  <p className="text-sm text-ink">{item.feedback}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "sop" && (
        <Card>
          <CardHeader title="Upload your SOP" subtitle="PDF or DOCX, up to 5 MB." />
          {sopUploaded ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-hairline bg-sunken/40 p-4">
                <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                  <FileText size={16} className="text-brand" /> SOP_Aarav_XLRI.pdf
                </span>
                <StatusBadge status="In review" />
              </div>
              <p className="text-sm text-muted">Your reviewer typically responds within 48 hours with inline comments and an overall rewrite suggestion.</p>
            </div>
          ) : (
            <button
              onClick={() => setSopUploaded(true)}
              className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border-strong px-4 py-10 text-sm text-muted hover:border-brand hover:text-brand"
            >
              <UploadCloud size={24} />
              Click to upload your SOP
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const variant = status === "Feedback ready" ? "success" : status === "In review" ? "warning" : status === "Submitted" ? "info" : "neutral";
  return (
    <Badge variant={variant as never} className="shrink-0">
      {status}
    </Badge>
  );
}
