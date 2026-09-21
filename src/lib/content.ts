import { getProducts } from "@/lib/catalog";
import { priceRangeLabel } from "@/lib/pricing";
import { times } from "@/lib/settings";
import { getPolicy } from "@/lib/settings-db";
import { showDemoContent } from "@/lib/env";

/**
 * Public marketing copy, taken from the Claude Design "Public Site" file.
 * Policy numbers (notice period, refund window, retention...) are interpolated from Settings.
 * Content that in the design is placeholder (mentors, results, testimonials) is DEMO data and is
 * only returned outside production, see docs/DECISIONS.md.
 */

export const steps = async () => {
  const p = await getPolicy();
  return [
    { n: "01", title: "Buy what you need", body: "A single mock or a season package. Pay by UPI or card. No call with a counsellor first." },
    { n: "02", title: "Tell us about your profile", body: "Four short steps: college, work-ex, which calls you have, and what you already know is weak. Your mentor reads this before the session." },
    { n: "03", title: "Pick a slot", body: "Mentors publish hours every Sunday. Sessions are one hour and start on the hour. You'll know who you're with a day or two before." },
    { n: "04", title: "Sit the mock", body: "A real panel-style interview, pushback included. Twenty to thirty minutes of interview, the rest is debrief." },
    { n: "05", title: "Read the feedback, book the next one", body: `Scored feedback lands within ${p.feedbackDueHours} hours. Your progress page shows what's improving and what isn't.` },
  ];
};

export async function getServices() {
  const products = await getProducts();
  const by = (...slugs: string[]) => products.filter((x) => slugs.includes(x.slug));
  return [
    { name: "Mock PI", price: priceRangeLabel(by("mock-pi")), body: "One hour with a mentor who has your profile in front of them. Pick a focus: HR, academics, stress, institute final, current affairs or cross-questioning.", meta: "Written feedback within 24 hours" },
    { name: "Mock GD / GE", price: priceRangeLabel(by("mock-gd")), body: "Eight people, a live topic, a moderator who interrupts like a real panel. You get individual notes, not a group verdict.", meta: "Batches run most evenings" },
    { name: "WAT evaluation", price: priceRangeLabel(by("wat")), body: "Upload your essay. Marked on structure, argument, balance and conclusion, with the paragraph that let you down rewritten.", meta: "24-hour turnaround" },
    { name: "SOP review", price: priceRangeLabel(by("sop-basic", "sop-detailed")), body: "Basic covers structure, tone and red flags. Detailed adds line edits and a rewritten paragraph.", meta: "Detailed includes one revision on Plus" },
    { name: "Strategy call", price: "In packages", body: "Forty-five minutes on sequencing: which calls to prioritise, what to drop, what your profile can and can't carry.", meta: "With Samrudh" },
    { name: "Quick Guidance", price: priceRangeLabel(by("quick-guidance")), body: "For people who aren't sure they need any of the above. One call, honest answer about where you stand.", meta: "45 minutes" },
  ];
}

export const faqs = async () => {
  const p = await getPolicy();
  return [
    { q: "Who takes the mock interviews?", a: "Students and recent graduates who converted the same calls in 2024 or 2025. Everyone is screened and does a trial mock before they take a paying session." },
    { q: "Can I pick my mentor?", a: "Not directly. We assign based on your focus area and who has a free slot. If a session went well, ask and we'll usually put you with the same person again." },
    { q: "How soon can I book after paying?", a: "Immediately. Credits land as soon as payment is confirmed, and slots for the coming week open every Sunday evening." },
    { q: "What if I need to reschedule?", a: `Free up to ${p.cancelNoticeHours} hours before the session, ${times(p.maxReschedules)}. After that the credit is used.` },
    { q: "How long is a mock?", a: "The slot is one hour. The interview usually runs twenty to thirty minutes, and the rest is debrief — that's where the value is." },
    { q: "Do I get a recording?", a: `Yes, available for ${p.recordingRetentionDays} days in your library.` },
    { q: "Is there a refund?", a: `Within ${p.refundWindowHours} hours of purchase, if you haven't used a credit. After that, unused credits can be converted but not refunded.` },
    { q: "Who can see my SOP, marks and feedback?", a: "Your assigned mentor and Samrudh. Files are stored privately and download links expire." },
  ];
};

export const mentorPerks = [
  { title: "Paid per session", body: "Rates are fixed and visible in your portal. Pay accrues the moment you submit feedback, not when the student pays." },
  { title: "Your hours", body: "Publish the hours you're free. Nothing is assigned outside them. Pause any time." },
  { title: "Bonuses at volume", body: "Milestone bonuses through the season on top of per-session pay." },
];

export const legalDocs = async () => {
  const p = await getPolicy();
  return {
    terms: { title: "Terms of use", sections: [
      "What we provide: preparation sessions and written feedback. No guarantee of admission.",
      "Booking, rescheduling and no-show rules, matching the settings in Admin.",
      "Conduct expected of students and mentors during sessions.",
      "Recordings: how long they're kept and who can access them.",
    ] },
    privacy: { title: "Privacy", sections: [
      "What we collect: contact details, academic profile, uploads, session feedback and recordings.",
      "Why: to run sessions, match mentors, and process payments.",
      "Who sees it: your assigned mentor and the admin. Payment data stays with Razorpay.",
      "Your rights under the DPDP Act: access, correction, and deletion, with the request flow in your settings.",
      "Retention: uploads deleted within 30 days of an account deletion request.",
    ] },
    refunds: { title: "Refunds", sections: [
      `Full refund within ${p.refundWindowHours} hours of purchase if no credit has been used.`,
      "After a credit is used, the remainder is not refundable but unused credits may be transferred between session types at the admin's discretion.",
      "Refunds are returned to the original payment method within 5 to 7 working days.",
      "Cancellation by us — if no mentor can be found for a booked slot, the credit is returned in full.",
    ] },
  };
};

export type LegalSlug = "terms" | "privacy" | "refunds";

/* ---------- DEMO content: never shown in production ---------- */

export interface PublicMentor { name: string; college: string; bio: string; demo?: boolean }

const DEMO_MENTORS: PublicMentor[] = [
  { name: "Rohit Kulkarni", college: "IIM Bangalore, 2025", bio: "Mechanical, two years at a power utility. Takes the stress rounds." },
  { name: "Ishita Mehra", college: "IIM Calcutta, 2025", bio: "Economics, fresher convert. Runs most of our GD batches." },
  { name: "Arjun Rao", college: "SPJIMR, 2026", bio: "Ex-consulting. Good on why-MBA and career-switch stories." },
  { name: "Neha Pillai", college: "MDI Gurgaon, 2026", bio: "Commerce background. Handles academics-heavy panels." },
  { name: "Kabir Shah", college: "IIM Indore, 2026", bio: "IPM. Knows the fresher and young-profile interviews." },
  { name: "Samrudh", college: "Founder", bio: "Runs the strategy calls and everything behind the scenes." },
].map((m) => ({ ...m, demo: true }));

/** Phase 1: reads ACTIVE MentorProfile rows and exposes name, photo, college and a short bio only. Never tier. */
export async function getPublicMentors(): Promise<PublicMentor[]> {
  return !showDemoContent() ? [] : DEMO_MENTORS;
}

export interface ResultsContent {
  stats: { value: string; label: string }[];
  testimonials: { quote: string; who: string }[];
}

/** Returns null until real, consented figures exist. */
export async function getResults(): Promise<ResultsContent | null> {
  if (!showDemoContent()) return null;
  return {
    stats: [
      { value: "[ xx ]", label: "students prepared last season" },
      { value: "[ xx ]", label: "converts across IIMs, XLRI, FMS" },
      { value: "[ x.x ]", label: "average session rating out of 5" },
      { value: "[ xxx ]", label: "mocks run between Dec and Mar" },
    ],
    testimonials: [
      { quote: "Placeholder. Use a real student's words, with their permission, naming the institute they converted.", who: "— Name, converted [institute]" },
      { quote: "Placeholder. The most useful testimonials name a specific thing that changed between mock one and the real interview.", who: "— Name, converted [institute]" },
      { quote: "Placeholder. Keep them short. Two sentences beats a paragraph.", who: "— Name, converted [institute]" },
      { quote: "Placeholder. One from someone who bought a single mock, not a package, balances the page.", who: "— Name, converted [institute]" },
    ],
  };
}
