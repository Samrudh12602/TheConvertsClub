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
