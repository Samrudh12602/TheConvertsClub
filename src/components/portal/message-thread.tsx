"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { relative } from "@/lib/format";
import { MAX_MESSAGE_LENGTH } from "@/lib/message-limits";
import { sendMessageAction, type MessageResult } from "@/app/actions/messages";

export type ThreadMessage = { id: string; body: string; createdAt: string; mine: boolean };

/** Chat-style thread. `mine` bubbles sit on the right; the other side is labelled `otherLabel`. */
export function MessageThread({ messages, otherLabel, empty }: { messages: ThreadMessage[]; otherLabel: string; empty: string }) {
  if (messages.length === 0) return <p className="rounded-[10px] border border-dashed border-line-strong bg-card px-4 py-8 text-center text-[13px] leading-normal text-ink-faint">{empty}</p>;
  return (
    <ol className="flex flex-col gap-2.5">
      {messages.map((m) => (
        <li key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
          <div className={`max-w-[85%] rounded-[11px] px-3.5 py-2.5 ${m.mine ? "bg-ink text-dark-text" : "border border-line border-l-[3px] border-l-oxblood bg-card text-ink-body"}`}>
            {!m.mine && <p className="mb-1 text-[11px] font-semibold leading-none text-oxblood">{otherLabel}</p>}
            <p className="whitespace-pre-wrap text-pretty text-[13px] leading-[1.6]">{m.body}</p>
          </div>
          <p className="mt-1 text-[10.5px] leading-none text-ink-faint">{relative(new Date(m.createdAt))}</p>
        </li>
      ))}
    </ol>
  );
}

export function MessageComposer({ toUserId, placeholder, cta = "Send" }: { toUserId?: string; placeholder: string; cta?: string }) {
  const [state, action, pending] = useActionState<MessageResult | null, FormData>(sendMessageAction, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  return (
    <form ref={form} action={action} className="flex flex-col gap-2">
      {toUserId && <input type="hidden" name="toUserId" value={toUserId} />}
      <label className="sr-only" htmlFor="msg-body">Message</label>
      <textarea id="msg-body" name="body" required maxLength={MAX_MESSAGE_LENGTH} rows={3} placeholder={placeholder} className="w-full resize-y rounded-lg border border-line-strong bg-white px-3 py-2.5 text-base leading-[1.5] text-ink md:text-[13px]" />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : cta}</Button>
        {state && !state.ok && <p role="alert" className="text-xs text-oxblood">{state.error}</p>}
        {state?.ok && <p role="status" className="text-xs text-green">Sent.</p>}
      </div>
    </form>
  );
}
