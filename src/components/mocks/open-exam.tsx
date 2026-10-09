"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button";

/**
 * Opens the exam in its own tab (the exam goes full screen there). The tab keeps a link back to this one, so when the paper is
 * submitted the exam tab closes itself and this tab moves on to the analysis.
 */
export function OpenExamButton({ slug, children, variant = "primary", className }: { slug: string; children: React.ReactNode; variant?: ButtonVariant; className?: string }) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const open = () => {
    // No "noopener": the exam tab needs window.opener to send this tab to the analysis when it closes.
    const w = window.open(`/exam/${slug}`, "_blank");
    if (!w) { router.push(`/exam/${slug}`); return; }
    setOpened(true);
  };
  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <button type="button" onClick={open} className={buttonClasses({ variant, className })}>{children}</button>
      {opened && <span role="status" className="flex items-center gap-1.5 text-[11.5px] font-medium text-teal"><ExternalLink className="size-3.5" aria-hidden />Exam opened in a new tab. Your analysis will appear here when you submit.</span>}
    </span>
  );
}
