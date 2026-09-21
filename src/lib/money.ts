/** All money is stored as integer paise and displayed as INR with Indian digit grouping. */

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

export function formatPaise(paise: number): string {
  if (!Number.isInteger(paise)) throw new RangeError(`paise must be an integer, got ${paise}`);
  const abs = Math.abs(paise);
  const rupees = abs / 100;
  const body = abs % 100 === 0 ? inr.format(rupees) : inr2.format(rupees);
  return `${paise < 0 ? "−" : ""}₹${body}`;
}
