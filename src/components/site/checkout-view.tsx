"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, DarkPanel } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { formatPaise } from "@/lib/money";
import { guestDetailsSchema, type GuestDetails } from "@/lib/validation/forms";
import clsx from "clsx";

export interface CheckoutSummary {
  name: string;
  items: string[];
  listPricePaise: number | null;
  discountPaise: number;
  discountLabel: string;
  totalPaise: number;
  earlyBirdNote: string | null;
  refundWindowHours: number;
}

/**
 * Guest checkout. The amount shown here is display-only: the server recomputes the price from the
 * catalog when the Razorpay order is created (Phase 2), so nothing typed or posted here sets a price.
 */
export function CheckoutView({ summary }: { summary: CheckoutSummary }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestDetails>({ resolver: zodResolver(guestDetailsSchema), mode: "onTouched" });

  const lines: { label: string; value: string; strong?: boolean; tone?: "discount" }[] = [];
  if (summary.listPricePaise !== null) {
    lines.push({ label: summary.name, value: formatPaise(summary.listPricePaise) });
    lines.push({ label: summary.discountLabel, value: formatPaise(-summary.discountPaise), tone: "discount" });
  }
  lines.push({ label: "Total", value: formatPaise(summary.totalPaise), strong: true });

  return (
    <div className="mx-auto flex max-w-[900px] flex-wrap items-start gap-4 px-5 py-[26px]">
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
        <Card className="p-[22px]">
          <h1 className="type-section text-ink">Your details</h1>
          <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-faint">No account needed now. We&apos;ll create one and email you a login link.</p>
          <form
            id="checkout-form"
            noValidate
            className="mt-4 flex flex-col gap-3"
            onSubmit={handleSubmit(() =>
              setNotice("Payments aren't connected in this environment yet, so nothing has been charged. Your details are valid."),
            )}
          >
            <Field label="Name" autoComplete="name" placeholder="Your full name" error={errors.name?.message} {...register("name")} />
            <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="Receipts and login link go here" error={errors.email?.message} {...register("email")} />
            <Field label="Phone" type="tel" autoComplete="tel" placeholder="+91 · for session reminders" error={errors.phone?.message} {...register("phone")} />
          </form>
        </Card>

        <Card className="p-[22px]">
          <h2 className="type-section text-ink">Coupon</h2>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCouponMsg(coupon.trim() ? "Coupon codes aren't active yet." : null);
            }}
          >
            <input
              aria-label="Coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Enter code"
              autoCapitalize="characters"
              className="min-h-11 flex-[1_1_160px] rounded-lg border border-line-strong bg-white px-3 text-base font-medium leading-none tracking-[0.08em] text-ink placeholder:tracking-normal placeholder:text-ink-faint md:text-[13px]"
            />
            <Button type="submit" variant="dark" className="px-[18px] text-[12.5px]">
              Apply
            </Button>
          </form>
          {couponMsg && (
            <p role="status" className="mt-2.5 text-xs font-medium leading-normal text-ink-2">
              {couponMsg}
            </p>
          )}
          {summary.earlyBirdNote && <p className="mt-2.5 text-xs font-medium leading-normal text-green">{summary.earlyBirdNote}</p>}
        </Card>
      </div>

      <DarkPanel className="w-full min-w-[270px] md:w-auto md:flex-[0_1_320px] md:sticky md:top-20">
        <p className="type-eyebrow text-dark-muted">Order</p>
        <h2 className="mt-2.5 font-display text-[19px] font-bold leading-[1.25]">{summary.name}</h2>
        <ul className="mt-3.5 flex flex-col gap-[7px]">
          {summary.items.map((o) => (
            <li key={o} className="text-[12.5px] leading-normal text-dark-soft">
              {o}
            </li>
          ))}
        </ul>
        <dl className="mt-[18px] flex flex-col gap-[9px] border-t border-dark-line pt-[15px]">
          {lines.map((l) => (
            <div
              key={l.label}
              className={clsx(
                "tnum flex justify-between gap-2.5 leading-[1.3]",
                l.strong ? "text-base font-bold text-surface" : "text-[12.5px]",
                !l.strong && (l.tone === "discount" ? "text-blush" : "text-dark-soft"),
              )}
            >
              <dt>{l.label}</dt>
              <dd>{l.value}</dd>
            </div>
          ))}
        </dl>
        <Button type="submit" form="checkout-form" variant="onDark" size="lg" block className="mt-[18px] min-h-12 rounded-[9px] text-sm">
          Pay {formatPaise(summary.totalPaise)}
        </Button>
        {notice && (
          <p role="status" className="mt-3 rounded-lg bg-dark-line px-3 py-2.5 text-xs leading-[1.5] text-dark-body">
            {notice}
          </p>
        )}
        <p className="mt-3 text-[11px] leading-[1.6] text-dark-muted">
          Secured by Razorpay. UPI, cards, netbanking. Refundable within {summary.refundWindowHours} hours if you haven&apos;t used a credit.
        </p>
      </DarkPanel>
    </div>
  );
}
