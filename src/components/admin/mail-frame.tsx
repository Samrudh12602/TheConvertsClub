"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { framedEmailHtml, textAsHtml } from "@/lib/mailbox";

/**
 * A received message, shown in a sandboxed frame: no scripts, no forms, and (until you choose "Show images") nothing is fetched
 * from the internet, so opening an email cannot run code or tell the sender it was read.
 */
export function MailFrame({ html, text }: { html: string | null; text: string }) {
  const [images, setImages] = useState(false);
  const hasRemote = Boolean(html && /<img[^>]+src=["']?https?:/i.test(html));
  const doc = framedEmailHtml(html ?? textAsHtml(text || "(no text)"), images);
  return (
    <div>
      {hasRemote && !images && (
        <p className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[12px] text-ink-muted">
          <ImageOff className="size-3.5" aria-hidden /> Pictures from the internet are hidden for your privacy.
          <button type="button" onClick={() => setImages(true)} className="font-semibold text-oxblood underline">Show pictures</button>
        </p>
      )}
      <iframe title="Message" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={doc} className="h-[480px] w-full rounded-lg border border-line bg-white" />
    </div>
  );
}
