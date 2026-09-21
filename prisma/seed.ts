import { PrismaClient, type MentorProfile, type MentorTier, type PiFocus, type SessionType, type User } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PRODUCTS, SINGLES_ORDER } from "./seed-data";
import { purgeDemo } from "./demo";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { grantCredit, reserveCredit, consumeCredit, type Tx } from "../src/server/credits";
import { HOUR, istDateString, istToUtc, splitIntoSlots } from "../src/server/scheduling";
import { accrualFor, bonusesDue, overallScore, serviceForReview, serviceForSession, type BonusRuleLite, type RateTable } from "../src/server/payroll";

for (const f of [".env.local", ".env.development.local"]) {
  try { process.loadEnvFile(f); } catch { /* optional */ }
}
neonConfig.webSocketConstructor = ws;
const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const WITH_DEMO = process.argv.includes("--no-demo") ? false : true;

// ───────────── reference data (real, editable in Admin) ─────────────
async function seedReference() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value: value as never } });
  }
  PRODUCTS.forEach(() => undefined);
  for (const [i, p] of PRODUCTS.entries()) {
    const singleOrder = SINGLES_ORDER.indexOf(p.slug);
    const data = {
      name: p.name, kind: p.kind, pricePaise: p.pricePaise, mrpPaise: p.mrpPaise, earlyBirdEndsAt: p.earlyBirdEndsAt,
      enrolledOnly: p.enrolledOnly, summary: p.summary, includes: p.includes, badge: p.badge ?? null,
      sortOrder: i, singleOrder: singleOrder >= 0 ? singleOrder : null,
    };
    const prod = await db.product.upsert({ where: { slug: p.slug }, update: {}, create: { slug: p.slug, ...data } });
    for (const c of p.credits) {
      await db.productCredit.upsert({ where: { productId_kind: { productId: prod.id, kind: c.kind } }, update: {}, create: { productId: prod.id, kind: c.kind, quantity: c.quantity } });
    }
  }
  const rates: [MentorTier, "PI" | "GD" | "WAT" | "GUIDANCE" | "SOP", number][] = [
    ["JUNIOR", "PI", 25000], ["JUNIOR", "GD", 12500], ["JUNIOR", "WAT", 10000], ["JUNIOR", "GUIDANCE", 15000],
    ["SENIOR", "PI", 40000], ["SENIOR", "GD", 20000], ["SENIOR", "WAT", 15000], ["SENIOR", "GUIDANCE", 25000], ["SENIOR", "SOP", 30000],
  ];
  for (const [tier, service, amountPaise] of rates) {
    await db.payRate.upsert({ where: { tier_service: { tier, service } }, update: {}, create: { tier, service, amountPaise } });
  }
  const bonus: [MentorTier, number, number][] = [["JUNIOR", 20, 50000], ["JUNIOR", 40, 150000], ["JUNIOR", 60, 300000], ["SENIOR", 15, 100000], ["SENIOR", 30, 250000], ["SENIOR", 50, 500000]];
  for (const [tier, threshold, amountPaise] of bonus) {
    await db.bonusRule.upsert({ where: { tier_period_threshold: { tier, period: "SEASON", threshold } }, update: {}, create: { tier, period: "SEASON", threshold, amountPaise } });
  }
  await db.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", type: "PERCENT", value: 10, maxUses: 500 } });
  if ((await db.resource.count()) === 0) {
    await db.resource.createMany({ data: [
      { audience: "STUDENT", kind: "Booklet", title: "Your personalised prep booklet", meta: "Built from your form", sortOrder: 1 },
      { audience: "STUDENT", kind: "Checklist", title: "48 hours before the interview", meta: "What to revise, what to drop", sortOrder: 2 },
      { audience: "STUDENT", kind: "Sheet", title: "Answer frames for the 20 usual questions", meta: "Structure only — write your own content", sortOrder: 3 },
      { audience: "STUDENT", kind: "Current affairs", title: "Monthly digest", meta: "Budget, RBI policy, regulation", sortOrder: 4 },
      { audience: "MENTOR", kind: "Playbook", title: "How we run a mock PI", meta: "Timing, pushback, how to close · 6 min read", sortOrder: 1 },
      { audience: "MENTOR", kind: "Rubric", title: "What each score means", meta: "Calibration examples for 4, 6 and 8", sortOrder: 2 },
      { audience: "MENTOR", kind: "Playbook", title: "Running a GD batch of 8", meta: "Entry rules, timekeeping, per-student notes", sortOrder: 3 },
      { audience: "MENTOR", kind: "Template", title: "Writing feedback students act on", meta: "Two good examples, two bad ones", sortOrder: 4 },
      { audience: "MENTOR", kind: "Policy", title: "No-shows, late cancels, reschedules", meta: "What counts, what you get paid for", sortOrder: 5 },
    ] });
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    await db.user.upsert({ where: { email: adminEmail }, update: { role: "ADMIN" }, create: { email: adminEmail, name: "Samrudh", role: "ADMIN" } });
    console.log("admin ensured:", adminEmail);
  } else console.log("ADMIN_EMAIL not set: no real admin created (demo admin only).");
}

// ───────────── demo data (everything flagged isDemo) ─────────────
let seedN = 42;
const rnd = () => { seedN = (seedN + 0x6d2b79f5) | 0; let t = Math.imul(seedN ^ (seedN >>> 15), 1 | seedN); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const NOW = new Date();
const dayAt = (offset: number, time: string) => istToUtc(istDateString(new Date(NOW.getTime() + offset * 24 * HOUR)), time);
const D = "demo.convertclub.test";

const RUBRIC = ["Content depth", "Clarity", "Structure", "Body language", "Stress handling", "Current affairs"];
const STRENGTHS = ["Your why-MBA was specific and tied to the plant-floor story. Keep it.", "You corrected a wrong number mid-answer instead of bluffing. Panels notice that.", "Clear structure and a confident close on the career-goal answer."];
const WEAKNESSES = ["Work-ex answers are memorised. You paused for the next line twice.", "You look down when challenged. Hold eye contact through the pushback.", "Answers ran past two minutes. Land the point, then stop."];
const FRAMING = ["For 'why not continue in core': lead with what you built, then what you couldn't influence.", "Cap every answer at 90 seconds."];
const PREP = ["Two failures with what you changed afterwards.", "Your lowest semester marks. Own it in one line.", "Thermal power vs renewables — expect pushback on your sector."];

async function seedDemo() {
  await purgeDemo(db);
  const rates: RateTable = {};
  for (const r of await db.payRate.findMany()) rates[`${r.tier}:${r.service}`] = r.amountPaise;
  const products = Object.fromEntries((await db.product.findMany({ include: { credits: true } })).map((p) => [p.slug, p]));

  const mkUser = (email: string, name: string, role: "STUDENT" | "MENTOR" | "ADMIN") =>
    db.user.create({ data: { email, name, role, isDemo: true, emailVerified: NOW } });

  // ── mentors
  type M = MentorProfile & { user: User };
  const mentorDefs: [string, string, MentorTier, string, number, string][] = [
    ["mentor", "Rohit Kulkarni (demo)", "SENIOR", "IIM Bangalore", 2025, "Mechanical, two years at a power utility. Takes the stress rounds."],
    ["ishita", "Ishita Mehra (demo)", "SENIOR", "IIM Calcutta", 2025, "Economics, fresher convert. Runs most of our GD batches."],
    ["arjun", "Arjun Rao (demo)", "JUNIOR", "SPJIMR", 2026, "Ex-consulting. Good on why-MBA and career-switch stories."],
    ["neha", "Neha Pillai (demo)", "JUNIOR", "MDI Gurgaon", 2026, "Commerce background. Handles academics-heavy panels."],
    ["kabir", "Kabir Shah (demo)", "JUNIOR", "IIM Indore", 2026, "IPM. Knows the fresher and young-profile interviews."],
  ];
  const mentors: M[] = [];
  for (const [slug, name, tier, college, batchYear, bio] of mentorDefs) {
    const user = await mkUser(`${slug}@${D}`, name, "MENTOR");
    const mp = await db.mentorProfile.create({ data: { userId: user.id, tier, college, batchYear, bio, meetingUrl: `https://meet.example.com/${slug}-demo` } });
    mentors.push({ ...mp, user });
  }
  const adminUser = await mkUser(`admin@${D}`, "Samrudh (demo admin)", "ADMIN");
  const adminMentor = { ...(await db.mentorProfile.create({ data: { userId: adminUser.id, tier: "SENIOR", isAdminMentor: true, publicVisible: false, college: "Founder", bio: "Runs the strategy calls.", meetingUrl: "https://meet.example.com/samrudh-demo" } })), user: adminUser } as M;
  const [rohit, ishita, arjun, neha, kabir] = mentors;

  // ── students
  const studentNames = ["Ananya Nair", "Vikram Singh", "Priya Desai", "Karan Bhatia", "Meera Raghav", "Dev Malhotra", "Aisha Khan", "Tanvi Ghosh", "Ritika Sen", "Yash Kapoor"];
  const students: User[] = [];
  for (const [i, n] of studentNames.entries()) {
    const email = i === 0 ? `student@${D}` : `${n.split(" ")[0].toLowerCase()}@${D}`;
    const u = await mkUser(email, i === 0 ? `${n} (demo)` : `${n} (demo)`, "STUDENT");
    await db.studentProfile.create({ data: { userId: u.id, college: pick(["NIT Trichy", "VJTI Mumbai", "SRCC Delhi", "BITS Pilani", "St. Xavier's Kolkata"]), degree: pick(["B.Tech Mech", "B.Com", "B.A. Economics", "B.Tech CSE"]), workExMonths: pick([0, 12, 22, 30, 40]), targetInstitutes: ["IIM Ahmedabad", "IIM Bangalore", "XLRI"], weakAreas: ["Stress handling"], onboardingStep: 4, onboardedAt: NOW } });
    students.push(u);
  }
  const ananya = students[0];

  // ── money: orders, payments, enrollments, credit grants
  let payN = 0;
  async function enroll(student: User, slug: keyof typeof products | string, daysAgo: number) {
    const p = products[slug as string];
    const at = new Date(NOW.getTime() - daysAgo * 24 * HOUR);
    const order = await db.order.create({ data: { userId: student.id, productId: p.id, listPricePaise: p.mrpPaise ?? p.pricePaise, discountPaise: (p.mrpPaise ?? p.pricePaise) - p.pricePaise, amountPaise: p.pricePaise, status: "PAID", razorpayOrderId: `demo_order_${++payN}`, guestName: student.name ?? "", guestEmail: student.email, guestPhone: "9800000000", createdAt: at } });
    const fee = Math.round(p.pricePaise * 0.02);
    await db.payment.create({ data: { orderId: order.id, razorpayPaymentId: `demo_pay_${payN}`, status: "CAPTURED", amountPaise: p.pricePaise, feePaise: fee, taxPaise: Math.round(fee * 0.18), method: pick(["upi", "card", "netbanking"]), capturedAt: at, createdAt: at } });
    const en = await db.enrollment.create({ data: { userId: student.id, productId: p.id, orderId: order.id, createdAt: at } });
    for (const c of p.credits) await grantCredit(db, { userId: student.id, kind: c.kind, quantity: c.quantity, enrollmentId: en.id, reason: `Purchase: ${p.name}` });
  }

  await enroll(ananya, "call-convert-plus", 24);
  await enroll(ananya, "additional-pi", 9);
  const bundles = ["call-convert", "call-convert", "call-convert-plus", "call-convert"];
  for (const [i, s] of students.slice(1, 5).entries()) await enroll(s, bundles[i], 30 - i * 5);
  const singles = ["mock-pi", "mock-gd", "wat", "quick-guidance", "sop-detailed"];
  for (const [i, s] of students.slice(5).entries()) await enroll(s, singles[i % singles.length], 14 - i * 2);

  // ── slots for the next 14 days
  const allMentors = [...mentors, adminMentor];
  const windowFor = (m: M, offset: number): [string, string] | null => {
    const dow = new Date(NOW.getTime() + offset * 24 * HOUR).getUTCDay();
    if (m.isAdminMentor) return offset % 4 === 1 ? ["19:00", "21:00"] : null;
    if (dow === 0 || dow === 6) return ["10:00", "14:00"];
    return m.user.email.startsWith("kabir") || m.user.email.startsWith("neha") ? ["18:00", "21:00"] : ["17:00", "21:00"];
  };
  for (const m of allMentors) {
    for (let d = 1; d <= 14; d++) {
      const w = windowFor(m, d);
      if (!w) continue;
      const start = dayAt(d, w[0]), end = dayAt(d, w[1]);
      await db.availabilityWindow.create({ data: { mentorId: m.id, startsAt: start, endsAt: end } });
      await db.slot.createMany({ data: splitIntoSlots(start, end).map((s) => ({ mentorId: m.id, ...s })), skipDuplicates: true });
    }
  }

  // ── session helpers
  async function feedbackFor(sessionId: string | null, reviewId: string | null, mentorId: string, when: Date, bias = 0) {
    const scores = Object.fromEntries(RUBRIC.map((r) => [r, Math.max(3, Math.min(9.5, Math.round((6.4 + bias + (rnd() - 0.5) * 3) * 2) / 2))]));
    const overall = overallScore(scores);
    return db.feedback.create({ data: { sessionId, reviewId, mentorId, scores, overall, strengths: pick(STRENGTHS), weaknesses: pick(WEAKNESSES), redFlags: rnd() > 0.7 ? "A 22-month gap that wasn't explained until asked." : null, answerFraming: pick(FRAMING), questionsToPrepare: pick(PREP), recommendation: overall >= 7.5 ? "READY" : overall >= 6.5 ? "NEARLY_THERE" : overall >= 5.5 ? "NEEDS_MORE_MOCKS" : "REWORK_BASICS", privateNote: rnd() > 0.8 ? "Attitude was fine, just nervous." : null, submittedAt: new Date(when.getTime() + 1.5 * HOUR) } });
  }

  async function accrue(m: M, o: { sessionId?: string; reviewId?: string; service: "PI" | "GD" | "WAT" | "GUIDANCE" | "SOP"; at: Date }) {
    if (m.isAdminMentor) return; // Admin's own sessions accrue no pay (default setting)
    const a = accrualFor(m.tier, o.service, rates);
    if (!a) return;
    const ageDays = (NOW.getTime() - o.at.getTime()) / (24 * HOUR);
    await db.payoutAccrual.create({ data: { mentorId: m.id, sessionId: o.sessionId, reviewId: o.reviewId, service: o.service, tierSnapshot: m.tier, status: ageDays > 30 ? "PAID" : ageDays > 10 ? "APPROVED" : "ACCRUED", ...a, createdAt: new Date(o.at.getTime() + 2 * HOUR) } });
  }

  // completed session with the full lifecycle (credits, feedback, accrual)
  async function completed(student: User, m: M, type: SessionType, focus: PiFocus | null, at: Date, o: { rate?: number; backfill?: boolean } = {}) {
    const s = await db.session.create({ data: { type, focus, status: "COMPLETED", studentId: student.id, mentorId: m.id, startsAt: at, endsAt: new Date(at.getTime() + HOUR), meetingUrl: m.meetingUrl, createdAt: new Date(at.getTime() - 3 * 24 * HOUR) } });
    const kind = type === "MOCK_PI" ? "PI" : type === "GD_BATCH" ? "GD" : type === "GUIDANCE" ? "GUIDANCE" : "STRATEGY";
    if (o.backfill) await grantCredit(db, { userId: student.id, kind, quantity: 1, reason: "Season history (demo)" });
    await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: student.id, kind, sessionId: s.id });
    await consumeCredit(db as Tx, { userId: student.id, kind, sessionId: s.id });
    await feedbackFor(s.id, null, m.id, at, m.tier === "SENIOR" ? 0.2 : 0);
    const svc = serviceForSession(type);
    if (svc) await accrue(m, { sessionId: s.id, service: svc, at });
    if (rnd() > 0.35) await db.sessionRating.create({ data: { sessionId: s.id, studentId: student.id, rating: rnd() > 0.15 ? pick([4, 5, 5]) : 3 } });
    return s;
  }

  // Ananya's curated history
  const F: PiFocus[] = ["HR_PROFILE", "ACADEMICS", "STRESS", "INSTITUTE_FINAL", "CURRENT_AFFAIRS", "CROSS_QUESTIONING"];
  await completed(ananya, arjun, "MOCK_PI", "HR_PROFILE", dayAt(-15, "18:00"));
  await completed(ananya, ishita, "MOCK_PI", "ACADEMICS", dayAt(-9, "19:00"));
  await completed(ananya, rohit, "MOCK_PI", "HR_PROFILE", dayAt(-2, "10:00"));
  const gdDone = await db.gdBatch.create({ data: { topic: "Abstract · \"The last mile\"", startsAt: dayAt(-6, "17:00"), endsAt: dayAt(-6, "18:00"), capacity: 8, moderatorId: ishita.id, status: "COMPLETED", meetingUrl: ishita.meetingUrl } });
  await db.gdParticipant.create({ data: { batchId: gdDone.id, studentId: ananya.id } });
  const gdSess = await db.session.create({ data: { type: "GD_BATCH", status: "COMPLETED", studentId: ananya.id, mentorId: ishita.id, startsAt: gdDone.startsAt, endsAt: gdDone.endsAt, gdBatchId: gdDone.id } });
  await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: ananya.id, kind: "GD", sessionId: gdSess.id });
  await consumeCredit(db as Tx, { userId: ananya.id, kind: "GD", sessionId: gdSess.id });
  await feedbackFor(gdSess.id, null, ishita.id, gdDone.startsAt, -0.4);
  await accrue(ishita, { sessionId: gdSess.id, service: "GD", at: gdDone.startsAt });

  // Ananya's WAT (completed) and SOP (in review)
  const wat = await db.review.create({ data: { studentId: ananya.id, kind: "WAT", title: "WAT · Ethics in AI", fileName: "wat_ethics.pdf", status: "COMPLETED", assignedMentorId: arjun.id, dueAt: dayAt(-11, "12:00"), submittedAt: dayAt(-12, "12:00"), completedAt: dayAt(-11, "09:00") } });
  await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: ananya.id, kind: "WAT", reviewId: wat.id });
  await consumeCredit(db as Tx, { userId: ananya.id, kind: "WAT", reviewId: wat.id });
  await feedbackFor(null, wat.id, arjun.id, dayAt(-11, "07:00"));
  await accrue(arjun, { reviewId: wat.id, service: serviceForReview("WAT"), at: dayAt(-11, "09:00") });
  const sop = await db.review.create({ data: { studentId: ananya.id, kind: "SOP_DETAILED", title: "Detailed SOP review", fileName: "sop_v2.pdf", status: "ASSIGNED", assignedMentorId: ishita.id, dueAt: new Date(NOW.getTime() + 6 * HOUR), submittedAt: new Date(NOW.getTime() - 18 * HOUR) } });
  await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: ananya.id, kind: "SOP_DETAILED", reviewId: sop.id });

  // Ananya's upcoming bookings (each holds a real slot)
  async function upcoming(student: User, m: M, type: SessionType, focus: PiFocus | null, offset: number, time: string, status: "CONFIRMED" | "REQUESTED" = "CONFIRMED") {
    const at = dayAt(offset, time);
    const slot = await db.slot.findUnique({ where: { mentorId_startsAt: { mentorId: m.id, startsAt: at } } });
    if (!slot || slot.status !== "OPEN") return null;
    const s = await db.session.create({ data: { type, focus, status, studentId: student.id, mentorId: m.id, slotId: slot.id, startsAt: at, endsAt: new Date(at.getTime() + HOUR), meetingUrl: m.meetingUrl } });
    await db.slot.update({ where: { id: slot.id }, data: { status: "BOOKED" } });
    const kind = type === "MOCK_PI" ? "PI" : type === "STRATEGY_CALL" ? "STRATEGY" : type === "GUIDANCE" ? "GUIDANCE" : "GD";
    await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: student.id, kind, sessionId: s.id });
    return s;
  }
  await upcoming(ananya, rohit, "MOCK_PI", "STRESS", 1, "18:00");
  await upcoming(ananya, arjun, "MOCK_PI", "CROSS_QUESTIONING", 6, "19:00");
  await upcoming(ananya, adminMentor, "STRATEGY_CALL", null, 5, "19:00");
  const offsets: [User, M, PiFocus, number, string][] = [[students[1], rohit, "INSTITUTE_FINAL", 1, "19:00"], [students[2], arjun, "HR_PROFILE", 2, "18:00"], [students[3], ishita, "STRESS", 2, "19:00"], [students[4], neha, "ACADEMICS", 3, "18:00"], [students[5], kabir, "CURRENT_AFFAIRS", 3, "19:00"], [students[6], rohit, "STRESS", 4, "18:00"]];
  for (const [s, m, f, o, t] of offsets) await upcoming(s, m, "MOCK_PI", f, o, t);
  await upcoming(students[7], ishita, "MOCK_PI", "HR_PROFILE", 5, "18:00", "REQUESTED");

  // upcoming GD batches
  async function gd(topic: string, m: M, offset: number, time: string, joined: User[], waitlisted: User[] = []) {
    const at = dayAt(offset, time);
    const b = await db.gdBatch.create({ data: { topic, startsAt: at, endsAt: new Date(at.getTime() + HOUR), capacity: 8, moderatorId: m.id, meetingUrl: m.meetingUrl } });
    await db.slot.updateMany({ where: { mentorId: m.id, startsAt: at, status: "OPEN" }, data: { status: "BOOKED" } });
    for (const s of joined) await db.gdParticipant.create({ data: { batchId: b.id, studentId: s.id, status: "JOINED" } });
    for (const s of waitlisted) await db.gdParticipant.create({ data: { batchId: b.id, studentId: s.id, status: "WAITLISTED" } });
    return b;
  }
  const others = students.slice(1);
  const gdA = await gd("Abstract · \"A closed door\"", ishita, 2, "17:00", others.slice(0, 6));
  await gd("Case · Ola vs Uber unit economics", arjun, 3, "17:00", students.slice(0, 1).length ? others.slice(0, 8).concat([]).slice(0, 8) : []);
  await gd("Current affairs · AI and jobs", neha, 4, "19:00", others.slice(0, 3));
  const gdMine = await gd("Abstract · \"The next mile\"", kabir, 5, "18:00", [ananya, ...others.slice(0, 4)]);
  await gd("Case · Tata vs Reliance retail", ishita, 6, "18:00", []);
  void gdA; void gdMine;
  await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: ananya.id, kind: "GD" });

  // ── a season of history for the other students (backfilled credits so the ledger stays consistent)
  const plan: [M, number][] = [[rohit, 22], [ishita, 16], [arjun, 24], [neha, 9], [kabir, 6]];
  const types: [SessionType, PiFocus | null][] = F.map((f) => ["MOCK_PI", f] as [SessionType, PiFocus | null]).concat([["GUIDANCE", null]]);
  for (const [m, n] of plan) {
    for (let i = 0; i < n; i++) {
      const [t, f] = m.tier === "SENIOR" ? pick(types.filter((x) => x[1] === "STRESS" || x[1] === "INSTITUTE_FINAL" || x[0] === "GUIDANCE").concat(types.slice(0, 2))) : pick(types.filter((x) => x[1] !== "STRESS" && x[1] !== "INSTITUTE_FINAL"));
      await completed(pick(others), m, t, f, dayAt(-2 - Math.floor(rnd() * 44), pick(["10:00", "11:00", "17:00", "18:00", "19:00", "20:00"])), { backfill: true });
    }
  }
  const gdHist = await db.gdBatch.create({ data: { topic: "Case · EV subsidies", startsAt: dayAt(-20, "17:00"), endsAt: dayAt(-20, "18:00"), capacity: 8, moderatorId: ishita.id, status: "COMPLETED" } });
  let first = true;
  for (const s of others.slice(0, 6)) {
    await db.gdParticipant.create({ data: { batchId: gdHist.id, studentId: s.id } });
    const sess = await db.session.create({ data: { type: "GD_BATCH", status: "COMPLETED", studentId: s.id, mentorId: ishita.id, startsAt: gdHist.startsAt, endsAt: gdHist.endsAt, gdBatchId: gdHist.id } });
    await grantCredit(db, { userId: s.id, kind: "GD", quantity: 1, reason: "Season history (demo)" });
    await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: s.id, kind: "GD", sessionId: sess.id });
    await consumeCredit(db as Tx, { userId: s.id, kind: "GD", sessionId: sess.id });
    await feedbackFor(sess.id, null, ishita.id, gdHist.startsAt);
    if (first) { await accrue(ishita, { sessionId: sess.id, service: "GD", at: gdHist.startsAt }); first = false; } // GD pays once per batch
  }

  // ── review queue for mentors
  const queue: [User, "WAT" | "SOP_DETAILED", M, number][] = [[students[3], "WAT", arjun, 22], [students[5], "WAT", neha, 19], [students[8], "SOP_DETAILED", rohit, 30], [students[2], "SOP_DETAILED", ishita, 9]];
  for (const [s, kind, m, hrs] of queue) {
    const r = await db.review.create({ data: { studentId: s.id, kind, title: kind === "WAT" ? "WAT · Indian economy" : "Detailed SOP review", fileName: kind === "WAT" ? "wat_economy.pdf" : "sop_final.pdf", status: "ASSIGNED", assignedMentorId: m.id, dueAt: new Date(NOW.getTime() + hrs * HOUR), submittedAt: new Date(NOW.getTime() - (24 - Math.min(hrs, 23)) * HOUR) } });
    await grantCredit(db, { userId: s.id, kind: kind === "WAT" ? "WAT" : "SOP_DETAILED", quantity: 1, reason: "Season history (demo)" });
    await reserveCredit(db as unknown as Parameters<typeof reserveCredit>[0], { userId: s.id, kind: kind === "WAT" ? "WAT" : "SOP_DETAILED", reviewId: r.id });
  }
  await db.review.create({ data: { studentId: students[6].id, kind: "SOP_BASIC", title: "Basic SOP review", fileName: "sop_draft.pdf", status: "SUBMITTED", dueAt: new Date(NOW.getTime() + 20 * HOUR) } });

  // ── calls tracker
  await db.callTracker.createMany({ data: [
    { studentId: ananya.id, institute: "IIM Ahmedabad", interviewDate: dayAt(37, "09:00"), stage: "AWT + PI, Mumbai", outcome: "SCHEDULED" },
    { studentId: ananya.id, institute: "IIM Bangalore", interviewDate: dayAt(45, "09:00"), stage: "WAT + PI, Bengaluru", outcome: "SCHEDULED" },
    { studentId: ananya.id, institute: "XLRI Jamshedpur", interviewDate: dayAt(31, "09:00"), stage: "GD + PI, Mumbai", outcome: "CONVERTED" },
    { studentId: ananya.id, institute: "FMS Delhi", stage: "Shortlist expected mid-Jan", outcome: "WAITING" },
  ] });

  // ── payouts: pay everything older than 30 days in one run, then compute bonuses
  const run = await db.payoutRun.create({ data: { label: "[demo] Last month's payout", status: "PAID", paidAt: dayAt(-12, "12:00") } });
  for (const m of mentors) {
    const paid = await db.payoutAccrual.findMany({ where: { mentorId: m.id, status: "PAID", payoutId: null } });
    if (!paid.length) continue;
    const p = await db.payout.create({ data: { runId: run.id, mentorId: m.id, amountPaise: paid.reduce((n, a) => n + a.amountPaise, 0), reference: `DEMO-UTR-${m.id.slice(-6).toUpperCase()}`, paidAt: dayAt(-12, "12:00") } });
    await db.payoutAccrual.updateMany({ where: { id: { in: paid.map((a) => a.id) } }, data: { payoutId: p.id } });
  }
  const rules = await db.bonusRule.findMany();
  const ruleLite: BonusRuleLite[] = rules.map((r) => ({ id: r.id, tier: r.tier, threshold: r.threshold, amountPaise: r.amountPaise, active: r.active }));
  for (const m of mentors) {
    const count = (await db.session.count({ where: { mentorId: m.id, status: "COMPLETED", type: { in: ["MOCK_PI", "GD_BATCH"] } } })) + (await db.review.count({ where: { assignedMentorId: m.id, status: "COMPLETED", kind: "WAT" } }));
    for (const r of bonusesDue(m.tier, count, ruleLite, new Set())) await db.bonusAward.create({ data: { mentorId: m.id, ruleId: r.id, periodKey: "season", amountPaise: r.amountPaise, status: "APPROVED" } });
  }

  // ── admin-side furniture
  await db.message.createMany({ data: [
    { fromUserId: adminUser.id, toUserId: rohit.userId, body: "Ananya's stress PI is coming up — push hard on the 22-month gap. She freezes and we need her to stop apologising for it.", createdAt: new Date(NOW.getTime() - 2 * HOUR) },
    { fromUserId: adminUser.id, toUserId: rohit.userId, body: "Please close out any feedback older than a day; several students have calls next week.", createdAt: new Date(NOW.getTime() - 26 * HOUR) },
    { fromUserId: adminUser.id, toUserId: rohit.userId, body: "Payout runs go out on the 10th. Anything submitted before the 9th is in it.", createdAt: new Date(NOW.getTime() - 5 * 24 * HOUR) },
    { fromUserId: adminUser.id, toUserId: rohit.userId, body: "Two extra Saturday evening slots would help — we're turning away institute-final requests.", createdAt: new Date(NOW.getTime() - 9 * 24 * HOUR) },
  ] });
  await db.notification.createMany({ data: [
    { userId: ananya.id, title: "Feedback ready: Mock PI · HR profile", href: "/student/sessions", createdAt: new Date(NOW.getTime() - 3 * HOUR) },
    { userId: ananya.id, title: "Your stress PI is booked for tomorrow at 6:00 PM", href: "/student/sessions" },
    { userId: rohit.userId, title: "New session assigned: Ananya Nair, tomorrow 6 PM", href: "/mentor/sessions" },
  ] });
  await db.expense.createMany({ data: [
    { category: "Tools", amountPaise: 199900, incurredOn: dayAt(-20, "12:00"), note: "[demo] Video meeting licences" },
    { category: "Marketing", amountPaise: 450000, incurredOn: dayAt(-14, "12:00"), note: "[demo] Instagram campaign" },
    { category: "Design", amountPaise: 120000, incurredOn: dayAt(-8, "12:00"), note: "[demo] Booklet layout" },
  ] });
  const apps: [string, string, "NEW" | "SCREENING" | "TRIAL_MOCK" | "OFFER" | "REJECTED", string][] = [
    ["Aditi Verma", "IIM Lucknow, 2026", "NEW", "IIM A, XLRI"], ["Nikhil Joshi", "IIM Kozhikode, 2026", "NEW", "IIM C, FMS"], ["Sana Qureshi", "MDI Gurgaon, 2026", "SCREENING", "IIM B"],
    ["Harsh Vora", "IIM Indore, 2025", "TRIAL_MOCK", "IIM A, IIM L"], ["Pooja Iyer", "SPJIMR, 2026", "OFFER", "XLRI, SPJIMR"], ["Manav Arora", "IIM Shillong, 2026", "REJECTED", "IIM S"],
  ];
  for (const [name, inst, stage, calls] of apps) {
    await db.mentorApplication.create({ data: { name, email: `${name.split(" ")[0].toLowerCase()}@${D}`, phone: "9800000001", institute: inst, callsConverted: calls, hoursPerWeek: pick([4, 6, 8]), stage, recommendedTier: stage === "OFFER" ? "JUNIOR" : null, notes: "[demo] seeded application" } });
  }
  await db.auditLog.createMany({ data: [
    { actorId: adminUser.id, action: "session.assign", entity: "Session", after: { note: "demo" } },
    { actorId: adminUser.id, action: "payout.run_paid", entity: "PayoutRun", entityId: run.id },
    { actorId: adminUser.id, action: "settings.update", entity: "Setting", after: { key: "cancelNoticeHours", value: 12 } },
  ] });
  console.log("demo data seeded");
}

async function main() {
  await seedReference();
  if (WITH_DEMO) await seedDemo();
  const counts = { products: await db.product.count(), users: await db.user.count(), sessions: await db.session.count(), slots: await db.slot.count(), accruals: await db.payoutAccrual.count() };
  console.log("done", counts);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
