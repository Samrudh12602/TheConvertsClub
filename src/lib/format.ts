export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactINR(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
}

// Deterministic date formatting — avoids Intl/toLocaleDateString, whose output
// can differ between the server's ICU build and the browser and breaks hydration.
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDate(
  date: Date | string,
  opts: { weekday?: "short" | "long"; day?: boolean; month?: "short" | "long"; year?: boolean } = {}
) {
  const d = typeof date === "string" ? new Date(date) : date;
  const { weekday, day = true, month, year } = opts;
  const parts: string[] = [];

  if (weekday) {
    const label = weekday === "long" ? WEEKDAY_LONG[d.getDay()] : WEEKDAY_SHORT[d.getDay()];
    parts.push(day || month ? `${label},` : label);
  }

  const dayMonth: string[] = [];
  if (day) dayMonth.push(String(d.getDate()));
  if (month) dayMonth.push(month === "long" ? MONTH_LONG[d.getMonth()] : MONTH_SHORT[d.getMonth()]);
  if (dayMonth.length) parts.push(dayMonth.join(" "));

  if (year) parts.push(String(d.getFullYear()));

  return parts.join(" ");
}
