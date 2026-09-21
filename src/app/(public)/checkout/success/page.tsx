import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AutoRefresh } from "@/components/site/auto-refresh";
import { db } from "@/lib/db";
import { describeCredit } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const mask = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1•••$2");

/** Reads the real order. Shows "confirming" until the payment is captured (browser callback or webhook, whichever lands first). */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/packages");
  const order = await db.order.findUnique({ where: { id: orderId }, include: { product: { include: { credits: true } } } });
  if (!order) redirect("/packages");

  if (order.status !== "PAID") {
    const failed = order.status === "FAILED";
    return (
      <div className="mx-auto max-w-[640px] px-5 py-10">
        <Card className="rounded-[14px] p-8 text-center">
          <h1 className="font-display text-2xl font-bold leading-[1.25] text-ink">{failed ? "That payment didn't go through" : "Confirming your payment…"}</h1>
          <p className="mt-2.5 text-pretty text-sm leading-[1.7] text-ink-muted">
            {failed ? "You haven't been charged. You can try again." : "This usually takes a few seconds. This page updates on its own. If you were charged and nothing changes in a couple of minutes, email us with your order number."}
          </p>
          <p className="mt-3 text-xs text-ink-faint">Order {order.id}</p>
          {failed ? <ButtonLink href={`/checkout?product=${order.product.slug}`} size="lg" className="mt-5 rounded-[9px]">Try again</ButtonLink> : <AutoRefresh />}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-5 py-10">
      <Card className="rounded-[14px] p-8 text-center">
        <div aria-hidden className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-tint font-display text-xl font-bold leading-none text-green">✓</div>
        <h1 className="mt-[18px] font-display text-2xl font-bold leading-[1.25] text-ink">You&apos;re in</h1>
        <p className="mt-2.5 text-pretty text-sm leading-[1.7] text-ink-muted">
          Payment of {formatPaise(order.amountPaise)} confirmed. We&apos;ve emailed {mask(order.guestEmail)} a link to set up your account — the credits are already waiting.
        </p>
        <div className="mt-5 rounded-[10px] border border-line-soft bg-surface p-4 text-left">
          <h2 className="type-label text-ink-faint">Credits added</h2>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {order.product.credits.map((c) => (
              <li key={c.kind} className="rounded-md bg-line-soft px-2.5 py-[7px] text-xs font-semibold leading-none text-ink-2">{describeCredit({ kind: c.kind, quantity: c.quantity }, "short")}</li>
            ))}
          </ul>
        </div>
        <ButtonLink href="/login" size="lg" className="mt-5 rounded-[9px] px-[22px]">Log in</ButtonLink>
        <p className="mt-4 text-xs text-ink-faint">Didn&apos;t get the email? Check spam, then use “Email me a login link” on the login page with the same address.</p>
      </Card>
    </div>
  );
}
