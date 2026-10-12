"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, Reply } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { markContactHandledAction } from "@/app/admin/actions";

export interface ContactItem { id: string; name: string; email: string; topic: string; message: string; when: string }

const replyHref = (c: ContactItem) => `/admin/mailbox?tab=mail&compose=1&from=support&to=${encodeURIComponent(c.email)}&subject=${encodeURIComponent(`Re: ${c.topic}`)}`;

/** Messages from the Contact page that nobody has answered. Reply opens a ready-to-send email; Mark done clears it. */
export function ContactMessages({ rows }: { rows: ContactItem[] }) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  if (rows.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-oxblood-line bg-gradient-to-br from-oxblood-tint via-white to-white shadow-card" aria-label="Contact messages">
      <header className="flex items-center gap-3 border-b border-oxblood-line/70 px-4 py-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-oxblood text-white shadow-glow"><MessageSquare className="size-[18px]" aria-hidden /></span>
        <div><h2 className="font-display text-[16px] font-bold leading-tight text-ink">{rows.length} message{rows.length === 1 ? "" : "s"} from the Contact page</h2><p className="text-[11.5px] text-ink-muted">Waiting for your reply.</p></div>
      </header>
      <ul>
        {rows.map((c) => (
          <li key={c.id} className="border-b border-oxblood-line/50 px-4 py-3 last:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13.5px] font-semibold text-ink">{c.name} <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-oxblood ring-1 ring-oxblood-line">{c.topic}</span></p>
              <span className="text-[11.5px] text-ink-faint">{c.when}</span>
            </div>
            <p className="mt-0.5 text-[12px] text-ink-muted"><a href={`mailto:${c.email}`} className="text-ink-muted">{c.email}</a></p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-[13px] leading-[1.6] text-ink-2 ring-1 ring-line-soft">{c.message}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Link href={replyHref(c)} prefetch={false} className={buttonClasses({ size: "sm" })}><Reply className="size-4" aria-hidden /> Reply</Link>
              <Button size="sm" variant="secondary" disabled={pending && busy === c.id} onClick={() => { setBusy(c.id); start(async () => { const r = await markContactHandledAction(c.id); if (r.ok) { toast.success(r.message ?? "Done."); router.refresh(); } else toast.error(r.error); setBusy(null); }); }}><Check className="size-4" aria-hidden /> Mark done</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
