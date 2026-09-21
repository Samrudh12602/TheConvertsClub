"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-start justify-center gap-3 px-5">
      <h1 className="type-page text-ink">Something went wrong</h1>
      <p className="text-sm leading-[1.6] text-ink-muted">Nothing you did caused this. Try again, and if it keeps happening, email us.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
