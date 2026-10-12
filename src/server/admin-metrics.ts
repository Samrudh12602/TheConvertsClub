import type { db as Db } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { appUrl } from "@/lib/env";
import { GATEWAY_FEE_STARTS_AT, gatewayCost, gatewayFeeNotice } from "@/lib/gateway-fee";
import { GUIDANCE_KINDS } from "@/lib/guidance";
import { bucketByDay, lastDays, pctDelta, sum, weekHeat } from "@/lib/metrics";

type Client = typeof Db;

const REVENUE = ["PAID", "PARTIALLY_REFUNDED"] as const;

export interface Delta { value: number; prev: number; pct: number | null; series: number[]; prevSeries: number[] }

const delta = (series: number[], days: number): Delta => {
  const cur = series.slice(-days), prev = series.slice(-2 * days, -days);
  return { value: sum(cur), prev: sum(prev), pct: pctDelta(sum(cur), sum(prev)), series: cur, prevSeries: prev };
};

export interface TrendData { labels: string[]; revenue: number[]; orders: number[]; signups: number[]; attempts: number[] }

/** Everything the dashboard and analytics pages need for a window of `days` days (compared with the `days` before it). */
export async function loadTrends(db: Client, days: number, now: Date = new Date()) {
  const window = lastDays(days * 2, now);
  const since = window[0].start;
  const [orders, students, attempts, googleUsers, emails] = await Promise.all([
    db.order.findMany({ where: { status: { in: [...REVENUE] }, createdAt: { gte: since } }, select: { amountPaise: true, discountPaise: true, createdAt: true, earlyBird: true, product: { select: { name: true, slug: true } }, coupon: { select: { code: true } } } }),
    db.user.findMany({ where: { role: "STUDENT", createdAt: { gte: since } }, select: { id: true, createdAt: true } }),
    db.mockAttempt.findMany({ where: { startedAt: { gte: since } }, select: { startedAt: true, submittedAt: true, score: true, status: true, tabSwitches: true, mockId: true, mock: { select: { title: true, isTest: true } } } }),
    db.account.findMany({ where: { provider: "google", user: { role: "STUDENT", createdAt: { gte: since } } }, select: { user: { select: { createdAt: true } } } }),
    db.emailLog.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true, template: true } }),
  ]);

  const revenue = bucketByDay(orders.map((o) => ({ at: o.createdAt, v: o.amountPaise })), window);
  const orderCount = bucketByDay(orders.map((o) => ({ at: o.createdAt, v: 1 })), window);
  const signups = bucketByDay(students.map((s) => ({ at: s.createdAt, v: 1 })), window);
  const googleSignups = bucketByDay(googleUsers.map((g) => ({ at: g.user.createdAt, v: 1 })), window);
  const attemptsSeries = bucketByDay(attempts.map((a) => ({ at: a.startedAt, v: 1 })), window);
  const submittedSeries = bucketByDay(attempts.filter((a) => a.submittedAt).map((a) => ({ at: a.submittedAt as Date, v: 1 })), window);
  const emailsSent = bucketByDay(emails.filter((e) => e.status === "SENT").map((e) => ({ at: e.createdAt, v: 1 })), window);
  const emailsFailed = bucketByDay(emails.filter((e) => e.status === "FAILED").map((e) => ({ at: e.createdAt, v: 1 })), window);

  const cutoff = window[days].start.getTime();
  const inWindow = <T extends { createdAt: Date }>(rows: T[]) => rows.filter((r) => r.createdAt.getTime() >= cutoff);
  const curOrders = inWindow(orders);
  const curAttempts = attempts.filter((a) => a.startedAt.getTime() >= cutoff);
  const submitted = curAttempts.filter((a) => a.status === "SUBMITTED" && a.score !== null);

  // Sales mix, early-bird use and discounts given in the window.
  const mix = new Map<string, { name: string; paise: number; orders: number; early: number }>();
  for (const o of curOrders) {
    const m = mix.get(o.product.slug) ?? { name: o.product.name, paise: 0, orders: 0, early: 0 };
    m.paise += o.amountPaise; m.orders++; if (o.earlyBird) m.early++;
    mix.set(o.product.slug, m);
  }
  const labels = window.slice(-days).map((d) => d.label);

  return {
    labels,
    revenue: delta(revenue, days), orders: delta(orderCount, days), signups: delta(signups, days), googleSignups: delta(googleSignups, days),
    attempts: delta(attemptsSeries, days), submitted: delta(submittedSeries, days),
    emailsSent: delta(emailsSent, days), emailsFailed: delta(emailsFailed, days),
    salesMix: [...mix.values()].sort((a, b) => b.paise - a.paise),
    discountsPaise: sum(curOrders.map((o) => o.discountPaise)),
    earlyBirdOrders: curOrders.filter((o) => o.earlyBird).length,
    coupons: Object.values(curOrders.reduce<Record<string, { code: string; uses: number; discountPaise: number }>>((acc, o) => {
      if (!o.coupon) return acc;
      const c = acc[o.coupon.code] ?? { code: o.coupon.code, uses: 0, discountPaise: 0 };
      c.uses++; c.discountPaise += o.discountPaise; acc[o.coupon.code] = c; return acc;
    }, {})).sort((a, b) => b.uses - a.uses),
    scores: submitted.map((a) => a.score as number),
    avgScore: submitted.length ? sum(submitted.map((a) => a.score as number)) / submitted.length : null,
    completion: curAttempts.length ? Math.round((curAttempts.filter((a) => a.status === "SUBMITTED").length / curAttempts.length) * 100) : null,
    avgTabSwitches: curAttempts.length ? sum(curAttempts.map((a) => a.tabSwitches)) / curAttempts.length : null,
    heat: weekHeat(curAttempts.map((a) => a.startedAt)),
    emailsByTemplate: Object.entries(emails.filter((e) => e.createdAt.getTime() >= cutoff).reduce<Record<string, number>>((acc, e) => { acc[e.template] = (acc[e.template] ?? 0) + 1; return acc; }, {})).map(([template, n]) => ({ template, n })).sort((a, b) => b.n - a.n),
  };
}

export type Trends = Awaited<ReturnType<typeof loadTrends>>;

/** How many students got how far: signed up, bought, started a mock, finished a mock, bought again. */
export async function loadFunnel(db: Client) {
  const [signedUp, buyers, started, finished, repeat, profiled] = await Promise.all([
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    db.order.groupBy({ by: ["userId"], where: { status: { in: [...REVENUE] }, userId: { not: null } } }),
    db.mockAttempt.groupBy({ by: ["userId"] }),
    db.mockAttempt.groupBy({ by: ["userId"], where: { status: "SUBMITTED" } }),
    db.order.groupBy({ by: ["userId"], where: { status: { in: [...REVENUE] }, userId: { not: null } }, having: { userId: { _count: { gt: 1 } } } }),
    db.studentProfile.count({ where: { OR: [{ dob: { not: null } }, { state: { not: null } }, { examsAppearing: { isEmpty: false } }, { college: { not: null } }] } }),
  ]);
  return { signedUp, profiled, buyers: buyers.length, started: started.length, finished: finished.length, repeat: repeat.length };
}

/** Per-mock performance: how many started, how many finished, the average score. */
export async function loadMockBoard(db: Client) {
  const [mocks, started, finished] = await Promise.all([
    db.mock.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, title: true, isTest: true } }),
    db.mockAttempt.groupBy({ by: ["mockId"], _count: { _all: true } }),
    db.mockAttempt.groupBy({ by: ["mockId"], where: { status: "SUBMITTED" }, _count: { _all: true }, _avg: { score: true } }),
  ]);
  const s = new Map(started.map((x) => [x.mockId, x._count._all]));
  const f = new Map(finished.map((x) => [x.mockId, { n: x._count._all, avg: x._avg.score }]));
  return mocks.map((m) => ({ id: m.id, title: m.title, isTest: m.isTest, started: s.get(m.id) ?? 0, finished: f.get(m.id)?.n ?? 0, avg: f.get(m.id)?.avg ?? null }));
}

/** Where students are from, which exams they are taking and how experienced they are, from the optional profile details. */
export async function loadAudience(db: Client) {
  const rows = await db.studentProfile.findMany({ select: { state: true, examsAppearing: true, workExMonths: true, gradYear: true } });
  const count = (xs: (string | null | undefined)[]) => Object.entries(xs.filter((x): x is string => Boolean(x)).reduce<Record<string, number>>((a, x) => { a[x] = (a[x] ?? 0) + 1; return a; }, {})).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
  const band = (m: number) => (m === 0 ? "Fresher" : m < 12 ? "Under 1 year" : m < 36 ? "1 to 3 years" : m < 72 ? "3 to 6 years" : "6+ years");
  return {
    states: count(rows.map((r) => r.state)).slice(0, 8),
    exams: count(rows.flatMap((r) => r.examsAppearing)).slice(0, 8),
    workEx: count(rows.filter((r) => r.workExMonths !== null).map((r) => band(r.workExMonths as number))),
    gradYears: count(rows.map((r) => (r.gradYear ? String(r.gradYear) : null))).sort((a, b) => Number(a.label) - Number(b.label)).slice(-6),
    withDetails: rows.filter((r) => r.state || r.examsAppearing.length || r.workExMonths !== null || r.gradYear).length,
    total: rows.length,
  };
}

export interface ActivityItem { kind: "order" | "signup" | "mock" | "mail" | "refund" | "contact"; at: string; title: string; sub: string; href: string }

/** The newest things that happened on the site, mixed into one timeline. */
export async function loadActivity(db: Client, take = 12): Promise<ActivityItem[]> {
  const [orders, users, attempts, mails, refunds, contacts] = await Promise.all([
    db.order.findMany({ where: { status: { in: [...REVENUE] } }, orderBy: { createdAt: "desc" }, take: 6, select: { guestName: true, amountPaise: true, createdAt: true, product: { select: { name: true } } } }),
    db.user.findMany({ where: { role: "STUDENT" }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, createdAt: true } }),
    db.mockAttempt.findMany({ where: { status: "SUBMITTED" }, orderBy: { submittedAt: "desc" }, take: 6, select: { submittedAt: true, score: true, user: { select: { name: true } }, mock: { select: { title: true } } } }),
    db.sentMail.findMany({ where: { status: "SENT" }, orderBy: { createdAt: "desc" }, take: 4, select: { createdAt: true, subject: true, toAddress: true } }),
    db.refund.findMany({ orderBy: { createdAt: "desc" }, take: 3, select: { amountPaise: true, createdAt: true } }),
    // Messages sent through the Contact page: they arrive as email in the Mailbox.
    db.emailLog.findMany({ where: { template: "contact_message", status: "SENT" }, orderBy: { createdAt: "desc" }, take: 5, select: { createdAt: true, subject: true } }),
  ]);
  const inr = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;
  const items: ActivityItem[] = [
    ...orders.map((o) => ({ kind: "order" as const, at: o.createdAt.toISOString(), title: `${o.guestName} bought ${o.product.name}`, sub: inr(o.amountPaise), href: "/admin/finance" })),
    ...users.map((u) => ({ kind: "signup" as const, at: u.createdAt.toISOString(), title: `${u.name ?? "A student"} joined`, sub: "New student", href: `/admin/students/${u.id}` })),
    ...attempts.filter((a) => a.submittedAt).map((a) => ({ kind: "mock" as const, at: (a.submittedAt as Date).toISOString(), title: `${a.user.name ?? "A student"} finished ${a.mock.title}`, sub: a.score !== null ? `Scored ${a.score.toFixed(1)}` : "Submitted", href: "/admin/mocks" })),
    ...mails.map((m) => ({ kind: "mail" as const, at: m.createdAt.toISOString(), title: `Email sent: ${m.subject}`, sub: `to ${m.toAddress}`, href: "/admin/mailbox?tab=log" })),
    ...contacts.map((c) => { const m = c.subject.match(/^Contact form: (.*) — (.*)$/); return { kind: "contact" as const, at: c.createdAt.toISOString(), title: `Message from ${m?.[2] ?? "a visitor"}`, sub: m ? `Contact page · ${m[1]}` : "Contact page", href: "/admin/mailbox?tab=mail" }; }),
    ...refunds.map((r) => ({ kind: "refund" as const, at: r.createdAt.toISOString(), title: "Refund issued", sub: inr(r.amountPaise), href: "/admin/finance" })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, take);
}

export interface EarlyBirdRow { name: string; limit: number; left: number; price: string; was: string }

export async function loadEarlyBird(): Promise<EarlyBirdRow[]> {
  const products = await getProducts();
  return products.filter((p) => p.earlyBird).map((p) => ({ name: p.name, limit: p.earlyBird!.limit, left: p.earlyBird!.seatsLeft, price: `₹${Math.round(p.earlyBird!.pricePaise / 100)}`, was: `₹${Math.round(p.pricePaise / 100)}` }));
}

export interface CheckItem { id: string; label: string; ok: boolean; detail: string; href: string; cta: string }

/** The things that must be true before you announce. Every line reads the real state, so it can't drift from reality. */
export async function loadLaunchChecklist(db: Client, extra: { googleOn: boolean; emailOn: boolean; demoOn: boolean }): Promise<CheckItem[]> {
  const [testCoupons, activeProducts, liveMocks, reviewer] = await Promise.all([
    db.coupon.count({ where: { active: true, code: { contains: "TEST", mode: "insensitive" } } }),
    db.product.count({ where: { active: true } }),
    db.mock.count({ where: { status: "PUBLISHED" } }),
    db.user.count({ where: { email: "razorpay.review@example.test" } }),
  ]);
  const live = (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_");
  const notice = gatewayFeeNotice();
  return [
    { id: "razorpay", label: "Razorpay on live keys", ok: live, detail: live ? "Real money is accepted" : "Still on test keys", href: "/admin/settings", cta: "Settings" },
    { id: "webhook", label: "Payment webhook secret set", ok: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET), detail: process.env.RAZORPAY_WEBHOOK_SECRET ? "Razorpay can confirm payments" : "Payments rely on the browser only", href: "/admin/settings", cta: "Settings" },
    { id: "google", label: "Google sign-in on", ok: extra.googleOn, detail: extra.googleOn ? "Students can continue with Google" : "Add the Google client ID and secret", href: "/admin/settings", cta: "Settings" },
    { id: "email", label: "Email from your own domain", ok: extra.emailOn, detail: extra.emailOn ? "Mail goes from support@" : "No email provider set", href: "/admin/mailbox", cta: "Mailbox" },
    { id: "domain", label: "Your own domain", ok: !appUrl().includes("vercel.app") && !appUrl().includes("localhost"), detail: appUrl().replace(/^https?:\/\//, ""), href: "/admin/settings", cta: "Settings" },
    { id: "mocks", label: "Mocks published", ok: liveMocks > 0, detail: `${liveMocks} live`, href: "/admin/mocks", cta: "Mocks" },
    { id: "products", label: "Products on sale", ok: activeProducts > 0, detail: `${activeProducts} active`, href: "/admin/products", cta: "Products" },
    { id: "coupon", label: "Test coupons switched off", ok: testCoupons === 0, detail: testCoupons ? `${testCoupons} test coupon${testCoupons === 1 ? "" : "s"} still active (e.g. TEST90 gives 90% off)` : "No test coupons active", href: "/admin/products", cta: "Coupons" },
    { id: "demo", label: "Demo mode off", ok: !extra.demoOn, detail: extra.demoOn ? "Demo data is visible" : "Only real data is shown", href: "/admin/settings", cta: "Settings" },
    { id: "reviewer", label: "Razorpay reviewer account removed", ok: reviewer === 0, detail: reviewer ? "Delete it once Razorpay approves you" : "Not present", href: "/admin/students", cta: "Students" },
    { id: "fee", label: "Razorpay fee holiday", ok: true, detail: notice.freeNow ? `No fee until ${notice.lastFreeDayLabel} (${notice.daysLeft} days left)` : "Fee is now counted at 2.36%", href: "/admin/finance", cta: "Finance" },
  ];
}

/** Money for the headline strip: lifetime revenue, what the gateway keeps (nothing during the fee holiday), what mentors are owed. */
export async function loadMoney(db: Client, now: Date = new Date()) {
  const [lifetime, sinceFee, payable, refunds] = await Promise.all([
    db.order.aggregate({ where: { status: { in: [...REVENUE] } }, _sum: { amountPaise: true } }),
    now.getTime() < GATEWAY_FEE_STARTS_AT.getTime() ? Promise.resolve(0) : db.order.aggregate({ where: { status: { in: [...REVENUE] }, createdAt: { gte: GATEWAY_FEE_STARTS_AT } }, _sum: { amountPaise: true } }).then((r) => r._sum.amountPaise ?? 0),
    db.payoutAccrual.aggregate({ where: { status: { in: ["ACCRUED", "APPROVED"] } }, _sum: { amountPaise: true }, _count: true }),
    db.refund.aggregate({ _sum: { amountPaise: true }, _count: true }),
  ]);
  const gross = lifetime._sum.amountPaise ?? 0;
  const gateway = gatewayCost(sinceFee).totalPaise;
  const owed = payable._sum.amountPaise ?? 0;
  const refunded = refunds._sum.amountPaise ?? 0;
  return { gross, gateway, owed, owedCount: payable._count, refunded, refundCount: refunds._count, kept: gross - gateway - owed - refunded };
}


export interface GuidanceRequest { key: string; userId: string; kind: (typeof GUIDANCE_KINDS)[number]; name: string; email: string; phone: string; product: string; paidAt: string }

const SLUG_FOR_KIND = { TRIAL_GUIDANCE: "guidance-call", STRATEGY_DIRECT: "strategy-call" } as const;

/** One-to-one guidance calls that are paid for and not yet marked as called, newest first, with the number to ring. */
export async function loadGuidanceRequests(db: Client): Promise<GuidanceRequest[]> {
  const rows = await db.creditLedger.groupBy({ by: ["userId", "kind"], _sum: { delta: true }, where: { kind: { in: [...GUIDANCE_KINDS] } } });
  const pending = rows.filter((r) => (r._sum.delta ?? 0) > 0) as { userId: string; kind: (typeof GUIDANCE_KINDS)[number]; _sum: { delta: number | null } }[];
  const out: GuidanceRequest[] = [];
  for (const r of pending) {
    const orders = await db.order.findMany({ where: { userId: r.userId, status: { in: [...REVENUE] }, product: { slug: SLUG_FOR_KIND[r.kind] } }, orderBy: { createdAt: "desc" }, take: r._sum.delta ?? 1, select: { id: true, guestName: true, guestEmail: true, guestPhone: true, createdAt: true, product: { select: { name: true } } } });
    for (const o of orders) out.push({ key: o.id, userId: r.userId, kind: r.kind, name: o.guestName, email: o.guestEmail, phone: o.guestPhone, product: o.product.name, paidAt: o.createdAt.toISOString() });
  }
  return out.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}
