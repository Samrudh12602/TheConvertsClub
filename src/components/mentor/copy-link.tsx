"use client";

import { useState } from "react";

/** Copies the mentor's /r/CODE link. Falls back to selecting the text where the clipboard API is blocked. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const full = () => `${window.location.origin}${path}`;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <code className="max-w-full truncate rounded-md bg-line-soft px-2.5 py-1.5 text-[12px] text-ink-2">{path}</code>
      <button
        type="button"
        onClick={async () => { try { await navigator.clipboard.writeText(full()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this link", full()); } }}
        className="text-[11px] font-semibold text-oxblood underline"
      >
        {copied ? "Copied" : "Copy full link"}
      </button>
    </div>
  );
}
