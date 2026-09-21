"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card, DarkPanel } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { formatPaise } from "@/lib/money";
import { guestDetailsSchema, type GuestDetails } from "@/lib/validation/forms";
import { openRazorpay } from "@/lib/razorpay-client";
import { applyCouponAction, startCheckoutAction } from "@/app/(public)/checkout/actions";

export interface CheckoutSummary {
  slug: string;
  name: string;
  items: string[];
  listPricePaise: number | null;
  discountPaise: number;
  discountLabel: string;
  totalPaise: number;
  earlyBirdNote: string | null;
  refundWindowHours: number;
  paymentsEnabled: boolean;
  prefill?: { name: string; email: string; phone: string };
}

/**
 * Guest checkout. Amounts shown here are display-only: the server re-prices from the database when it creates the
 * Razorpay order, and confirms the paid amount again before granting credits.
 */
export function CheckoutView({ summary }: { summary: CheckoutSummary }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponOff, setCouponOff] = useState(0);
  const [paying, setPaying] = useState(false);
  const [, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<GuestDetails>({
    resolver: zodResolver(guestDetailsSchema), mode: "onTouched", defaultValues: summary.prefill,
  });

  const total = summary.totalPaise - couponOff;
  const lines: { label: string; value: string; strong?: boolean; tone?: "discount" }[] = [];
  if (summary.listPricePaise !== null) {
    lines.push({ label: summary.name, value: formatPaise(summary.listPricePaise) });
    lines.push({ label: summary.discountLabel, value: formatPaise(-summary.discountPaise), tone: "discount" });
  }
  if (couponOff > 0) lines.push({ label: "Coupon", value: formatPaise(-couponOff), tone: "discount" });
  lines.push({ label: "Total", value: formatPaise(total), strong: true });

  async function pay(details: GuestDetails) {
    setNotice(null);
    setPaying(true);
    const r = await startCheckoutAction({ slug: summary.slug, ...details, coupon });
    if (!r.ok) { setNotice({ tone: "error", text: r.error }); setPaying(false); return; }
    try {
      await openRazorpay({
        keyId: r.start.keyId, razorpayOrderId: r.start.razorpayOrderId, amountPaise: r.start.amountPaise, name: r.start.name,
        description: r.start.description, prefill: r.start.prefill,
        onDismiss: () => setPaying(false),
        onFailed: (m) => { setNotice({ tone: "error", text: `${m} You haven't been charged. Try again.` }); setPaying(false); },
        onSuccess: async (resp) => {
          setNotice({ tone: "info", text: "Payment received. Confirming…" });
          const res = await fetch("/api/checkout/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...resp, orderId: r.start.orderId }) });
          // Even if the browser callback fails, the webhook fulfils the order; the success page shows the true state.
          startTransition(() => router.push(`/checkout/success?order=${r.start.orderId}${res.ok ? "" : "&pending=1"}`));
        },
      });
    } catch {
      setNotice({ tone: "error", text: "Couldn't open the payment window. Check your connection and try again." });
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-wrap items-start gap-4 px-5 py-[26px]">
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
        <Card className="p-[22px]">
          <h1 className="type-section text-ink">Your details</h1>
          <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-faint">No account needed now. We&apos;ll create one and email you a login link.</p>
          <form id="checkout-form" noValidate className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit(pay)}>
            <Field label="Name" autoComplete="name" placeholder="Your full name" error={errors.name?.message} {...register("name")} />
            <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="Receipts and login link go here" error={errors.email?.message} {...register("email")} />
            <Field label="Phone" type="tel" autoComplete="tel" placeholder="+91 · for session reminders" error={errors.phone?.message} {...register("phone")} />
          </form>
        </Card>

        <Card className="p-[22px]">
          <h2 className="type-section text-ink">Coupon</h2>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!coupon.trim()) { setCouponMsg(null); setCouponOff(0); return; }
              const r = await applyCouponAction(summary.slug, coupon);
              setCouponMsg(r.message);
              setCouponOff(r.discountPaise);
            }}
          >
            <input
              aria-label="Coupon code" value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponOff(0); setCouponMsg(null); }}
              placeholder="Enter code" autoCapitalize="characters"
              className="min-h-11 flex-[1_1_160px] rounded-lg border border-line-strong bg-white px-3 text-base font-medium leading-none tracking-[0.08em] text-ink placeholder:tracking-normal placeholder:text-ink-faint md:text-[13px]"
            />
            <Button type="submit" variant="dark" className="px-[18px] text-[12.5px]">Apply</Button>
          </form>
          {couponMsg && <p role="status" className={clsx("mt-2.5 text-xs font-medium leading-normal", couponOff > 0 ? "text-green" : "text-ink-2")}>{couponMsg}</p>}
          {summary.earlyBirdNote && <p className="mt-2.5 text-xs font-medium leading-normal text-green">{summary.earlyBirdNote}</p>}
        </Card>
      </div>

      <DarkPanel className="w-full min-w-[270px] md:sticky md:top-20 md:w-auto md:flex-[0_1_320px]">
        <p className="type-eyebrow text-dark-muted">Order</p>
        <h2 className="mt-2.5 font-display text-[19px] font-bold leading-[1.25]">{summary.name}</h2>
        <ul className="mt-3.5 flex flex-col gap-[7px]">
          {summary.items.map((o) => <li key={o} className="text-[12.5px] leading-normal text-dark-soft">{o}</li>)}
        </ul>
        <dl className="mt-[18px] flex flex-col gap-[9px] border-t border-dark-line pt-[15px]">
          {lines.map((l) => (
            <div key={l.label} className={clsx("tnum flex justify-between gap-2.5 leading-[1.3]", l.strong ? "text-base font-bold text-surface" : "text-[12.5px]", !l.strong && (l.tone === "discount" ? "text-blush" : "text-dark-soft"))}>
              <dt>{l.label}</dt><dd>{l.value}</dd>
            </div>
          ))}
        </dl>
        <Button type="submit" form="checkout-form" variant="onDark" size="lg" block disabled={paying} className="mt-[18px] min-h-12 rounded-[9px] text-sm">
          {paying ? "Opening payment…" : `Pay ${formatPaise(total)}`}
        </Button>
        {!summary.paymentsEnabled && <p role="status" className="mt-3 rounded-lg bg-dark-line px-3 py-2.5 text-xs leading-[1.5] text-dark-body">Payments aren&apos;t enabled in this environment yet. Nothing will be charged.</p>}
        {notice && <p role={notice.tone === "error" ? "alert" : "status"} className="mt-3 rounded-lg bg-dark-line px-3 py-2.5 text-xs leading-[1.5] text-dark-body">{notice.text}</p>}
        <p className="mt-3 text-[11px] leading-[1.6] text-dark-muted">
          Secured by Razorpay. UPI, cards, netbanking. Refundable within {summary.refundWindowHours} hours if you haven&apos;t used a credit.
        </p>
      </DarkPanel>
    </div>
  );
}
