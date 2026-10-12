/**
 * What Razorpay keeps from each payment: a flat 2% fee plus 18% GST on that fee, so 2.36% in all
 * (Rs 2,360 on Rs 1,00,000). Used for every "after gateway" figure in the admin portal so they all follow one rule.
 */
export const GATEWAY_FEE_RATE = 0.02;
export const GATEWAY_GST_RATE = 0.18;

export interface GatewayCost { feePaise: number; gstPaise: number; totalPaise: number }

export function gatewayCost(amountPaise: number): GatewayCost {
  const feePaise = Math.round(Math.max(0, amountPaise) * GATEWAY_FEE_RATE);
  const gstPaise = Math.round(feePaise * GATEWAY_GST_RATE);
  return { feePaise, gstPaise, totalPaise: feePaise + gstPaise };
}

/** The same rule as one percentage, for labels: 2.36. */
export const GATEWAY_EFFECTIVE_PERCENT = (GATEWAY_FEE_RATE * (1 + GATEWAY_GST_RATE) * 100);

/**
 * Razorpay's fee holiday: no processing fee on payments until the end of this day (IST), 90 days after the new Razorpay account was set up on 12 Oct 2026.
 * Until then every "gateway cost" in the admin portal counts as Rs 0; from the next day it is counted at 2.36% on each payment.
 * Change this one date if Razorpay changes the offer.
 */
export const GATEWAY_FEE_FREE_LAST_DAY = "2027-01-10";
/** The moment the fee starts to count: midnight (IST) at the start of the day after the last free day. */
export const GATEWAY_FEE_STARTS_AT = new Date("2027-01-10T18:30:00.000Z");

const IST_OFFSET_MS = 5.5 * 3_600_000;
const istDay = (d: Date) => Math.floor((d.getTime() + IST_OFFSET_MS) / 86_400_000);

export interface GatewayFeeNotice {
  /** True while Razorpay is not charging a fee. */
  freeNow: boolean;
  /** Whole days from today (IST) to the last free day: 90 on 12 Oct 2026, 0 on the last free day, negative afterwards. */
  daysLeft: number;
  lastFreeDayLabel: string;
  startsLabel: string;
}

export function gatewayFeeNotice(now: Date = new Date()): GatewayFeeNotice {
  const last = new Date(`${GATEWAY_FEE_FREE_LAST_DAY}T00:00:00.000Z`);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return {
    freeNow: now.getTime() < GATEWAY_FEE_STARTS_AT.getTime(),
    daysLeft: Math.floor(last.getTime() / 86_400_000) - istDay(now),
    lastFreeDayLabel: fmt(last),
    startsLabel: fmt(new Date(last.getTime() + 86_400_000)),
  };
}
