// Sample / placeholder data for The Convert Club prototype.
// All names, amounts and stats are illustrative and swappable.

export interface Service {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  description: string;
  duration: string;
}

export const services: Service[] = [
  { id: "quick-guidance", name: "Quick Guidance", price: 299, description: "15–20 min call plus a personalised prep checklist.", duration: "20 min" },
  { id: "mock-pi", name: "Mock PI", price: 599, description: "One personalised mock interview with detailed feedback.", duration: "60 min" },
  { id: "additional-pi", name: "Additional PI", price: 449, description: "Only for enrolled students — an extra mock interview.", duration: "60 min" },
  { id: "mock-gdge", name: "Mock GD/GE", price: 199, description: "Group discussion or group exercise with peers, evaluated live.", duration: "60 min" },
  { id: "wat", name: "WAT Evaluation", price: 199, description: "Written ability test with structured, line-by-line feedback.", duration: "async" },
  { id: "sop-basic", name: "Basic SOP Review", price: 99, description: "A quick pass on structure, clarity and red flags.", duration: "async" },
  { id: "sop-detailed", name: "Detailed SOP Review", price: 399, description: "Line-edits, framing suggestions and a revision round.", duration: "async" },
];

export interface Package {
  id: string;
  name: string;
  price: number;
  mrp: number;
  badge?: string;
  inclusions: string[];
  credits: { pi: number; gdge: number; wat: number; sop: number; strategyCalls: number };
}

export const packages: Package[] = [
  {
    id: "call-convert",
    name: "Call Convert",
    price: 2199,
    mrp: 2999,
    badge: "Most Popular",
    inclusions: [
      "4 Mock PIs",
      "2 Mock GD/GE",
      "1 WAT evaluation",
      "1 Detailed SOP review",
      "Profile review",
      "Personalised PI booklet",
      "Application form guidance",
      "1 strategy call",
      "WhatsApp support",
    ],
    credits: { pi: 4, gdge: 2, wat: 1, sop: 1, strategyCalls: 1 },
  },
  {
    id: "call-convert-plus",
    name: "Call Convert Plus",
    price: 2999,
    mrp: 4999,
    inclusions: [
      "6 Mock PIs",
      "3 Mock GD/GE",
      "2 WAT evaluations",
      "Detailed SOP + 1 revision",
      "Deep dossier",
      "Multi-college prep",
      "2 strategy calls",
      "WhatsApp support",
    ],
    credits: { pi: 6, gdge: 3, wat: 2, sop: 1, strategyCalls: 2 },
  },
];

export const earlyBirdEndDate = new Date("2026-10-15T23:59:59+05:30");

export interface PublicMentor {
  id: string;
  name: string;
  college: string;
  batch: string;
  bio: string;
  focus: string[];
}

// Note: Senior/Junior tier is internal only and intentionally absent here.
export const publicMentors: PublicMentor[] = [
  { id: "m1", name: "Ishaan Kapoor", college: "IIM Ahmedabad", batch: "2025", bio: "Ex-consultant turned MBA1. Loves stress-testing Why MBA answers.", focus: ["PI", "Cross-questioning"] },
  { id: "m2", name: "Meera Nair", college: "XLRI Jamshedpur", batch: "2024", bio: "HR major, runs sharp GD sessions on current affairs.", focus: ["GD/GE", "HR fit"] },
  { id: "m3", name: "Rohan Bhatia", college: "SPJIMR Mumbai", batch: "2025", bio: "Finance background, strong on case-based PI rounds.", focus: ["PI", "Academics"] },
  { id: "m4", name: "Ananya Iyer", college: "MDI Gurgaon", batch: "2024", bio: "Marketing major, meticulous SOP and WAT reviewer.", focus: ["SOP", "WAT"] },
  { id: "m5", name: "Kabir Malhotra", college: "NMIMS Mumbai", batch: "2025", bio: "Runs institute-specific final round simulations.", focus: ["PI", "Institute fit"] },
  { id: "m6", name: "Divya Krishnan", college: "SIBM Pune", batch: "2024", bio: "Engineer-turned-MBA, calm under stress questioning.", focus: ["PI", "Stress interviews"] },
];

export interface Testimonial {
  id: string;
  name: string;
  institute: string;
  quote: string;
}

export const testimonials: Testimonial[] = [
  { id: "t1", name: "Aarav Mehta", institute: "Converted to SIBM Pune", quote: "The mock PIs felt harder than my actual interview. I walked in calm because nothing surprised me." },
  { id: "t2", name: "Sanya Kapoor", institute: "Converted to SPJIMR Mumbai", quote: "My mentor caught three answers I was over-explaining. Fixed them before it mattered." },
  { id: "t3", name: "Vikram Suresh", institute: "Converted to NMIMS Mumbai", quote: "No fluff, no lectures — just people who'd been in the same chair months earlier." },
];

export const faqs = [
  { q: "What exactly is included in a package?", a: "Each package bundles a fixed number of Mock PIs, GD/GE sessions, WAT evaluations and SOP reviews, plus strategy calls and WhatsApp support. Exact counts are listed on the pricing page and also shown as credits inside your dashboard." },
  { q: "Can I reschedule a session?", a: "Yes — reschedule up to 4 hours before your slot from My Sessions with no penalty. Late reschedules within the window use one of your session credits." },
  { q: "What's the refund policy?", a: "Unused packages are refundable minus the value of any completed sessions, within 7 days of purchase. Individual services are non-refundable once the session is confirmed." },
  { q: "Is my information confidential?", a: "Yes. Your documents, call details and feedback are visible only to you, your assigned mentor and Admin. We never share your profile outside the platform." },
  { q: "What are the WhatsApp support hours?", a: "10 AM – 9 PM IST, all days during the January–March season, for reasonable-use queries about bookings, prep and feedback." },
  { q: "Do you offer CAT coaching or classes?", a: "No. The Convert Club is GDPI-only — no CAT coaching, no lectures, no theory classes. Just personalised mock practice and review." },
];

// ---------------------------------------------------------------------------
// Mentor pay (sample — configurable in Admin > Payouts)
// ---------------------------------------------------------------------------

export type MentorTier = "Senior" | "Junior";

export const payRates: Record<MentorTier, Record<string, number | null>> = {
  Junior: { "Mock PI": 250, "Mock GD/GE": 125, WAT: 100, "Guidance call": 150, "SOP review": null },
  Senior: { "Mock PI": 400, "Mock GD/GE": 200, WAT: 150, "Guidance call": 250, "SOP review": 300 },
};

export const bonusTiers: Record<MentorTier, { mocks: number; bonus: number }[]> = {
  Junior: [
    { mocks: 20, bonus: 500 },
    { mocks: 40, bonus: 1500 },
    { mocks: 60, bonus: 3000 },
  ],
  Senior: [
    { mocks: 15, bonus: 1000 },
    { mocks: 30, bonus: 2500 },
    { mocks: 50, bonus: 5000 },
  ],
};

// ---------------------------------------------------------------------------
// Mentors (internal — includes tier, visible only to mentor + Admin)
// ---------------------------------------------------------------------------

export interface Mentor {
  id: string;
  name: string;
  college: string;
  batch: string;
  tier: MentorTier;
  status: "active" | "paused" | "applied";
  rating: number;
  mocksThisSeason: number;
  workloadThisWeek: number;
  earningsAccrued: number;
  earningsPaid: number;
  email: string;
  linkedin: string;
  bio: string;
}

export const mentors: Mentor[] = [
  { id: "m1", name: "Ishaan Kapoor", college: "IIM Ahmedabad", batch: "2025", tier: "Senior", status: "active", rating: 4.9, mocksThisSeason: 34, workloadThisWeek: 6, earningsAccrued: 4200, earningsPaid: 9600, email: "ishaan.kapoor@example.com", linkedin: "linkedin.com/in/ishaankapoor", bio: "Ex-consultant turned MBA1. Loves stress-testing Why MBA answers." },
  { id: "m2", name: "Meera Nair", college: "XLRI Jamshedpur", batch: "2024", tier: "Senior", status: "active", rating: 4.8, mocksThisSeason: 29, workloadThisWeek: 4, earningsAccrued: 3100, earningsPaid: 7800, email: "meera.nair@example.com", linkedin: "linkedin.com/in/meeranair", bio: "HR major, runs sharp GD sessions on current affairs." },
  { id: "m3", name: "Rohan Bhatia", college: "SPJIMR Mumbai", batch: "2025", tier: "Junior", status: "active", rating: 4.7, mocksThisSeason: 18, workloadThisWeek: 3, earningsAccrued: 1850, earningsPaid: 3200, email: "rohan.bhatia@example.com", linkedin: "linkedin.com/in/rohanbhatia", bio: "Finance background, strong on case-based PI rounds." },
  { id: "m4", name: "Ananya Iyer", college: "MDI Gurgaon", batch: "2024", tier: "Junior", status: "active", rating: 4.9, mocksThisSeason: 22, workloadThisWeek: 5, earningsAccrued: 2400, earningsPaid: 4100, email: "ananya.iyer@example.com", linkedin: "linkedin.com/in/ananyaiyer", bio: "Marketing major, meticulous SOP and WAT reviewer." },
  { id: "m5", name: "Kabir Malhotra", college: "NMIMS Mumbai", batch: "2025", tier: "Senior", status: "active", rating: 4.6, mocksThisSeason: 26, workloadThisWeek: 2, earningsAccrued: 2900, earningsPaid: 6500, email: "kabir.malhotra@example.com", linkedin: "linkedin.com/in/kabirmalhotra", bio: "Runs institute-specific final round simulations." },
  { id: "m6", name: "Divya Krishnan", college: "SIBM Pune", batch: "2024", tier: "Junior", status: "paused", rating: 4.5, mocksThisSeason: 9, workloadThisWeek: 0, earningsAccrued: 600, earningsPaid: 1400, email: "divya.krishnan@example.com", linkedin: "linkedin.com/in/divyakrishnan", bio: "Engineer-turned-MBA, calm under stress questioning." },
];

export const currentMentor = mentors[0]; // Ishaan Kapoor — used across the Mentor portal demo

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export type CallStage = "Awaiting" | "GD scheduled" | "PI scheduled" | "Converted" | "Waitlisted" | "Not converted";

export interface CollegeCall {
  institute: string;
  interviewDate: string;
  stage: CallStage;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  degree: string;
  workEx: string;
  package: "Call Convert" | "Call Convert Plus" | "À la carte" | null;
  credits: { pi: { used: number; total: number }; gdge: { used: number; total: number }; wat: { used: number; total: number }; sop: { used: number; total: number }; strategyCalls: { used: number; total: number } };
  readiness: { communication: number; content: number; profileKnowledge: number; crossQuestioning: number; confidence: number; instituteFit: number };
  calls: CollegeCall[];
  weakAreas: string[];
  joinedOn: string;
  assignedMentor: string;
}

export const students: Student[] = [
  {
    id: "s1",
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    phone: "+91 98765 43210",
    college: "NIT Trichy",
    degree: "B.Tech Mechanical",
    workEx: "2 years, product analytics",
    package: "Call Convert",
    credits: { pi: { used: 2, total: 4 }, gdge: { used: 1, total: 2 }, wat: { used: 0, total: 1 }, sop: { used: 1, total: 1 }, strategyCalls: { used: 1, total: 1 } },
    readiness: { communication: 4, content: 3, profileKnowledge: 4, crossQuestioning: 2, confidence: 3, instituteFit: 4 },
    calls: [
      { institute: "XLRI Jamshedpur", interviewDate: "2026-02-14", stage: "PI scheduled" },
      { institute: "SPJIMR Mumbai", interviewDate: "2026-02-08", stage: "Converted" },
      { institute: "SIBM Pune", interviewDate: "2026-01-30", stage: "Awaiting" },
    ],
    weakAreas: ["Cross-questioning", "Confidence"],
    joinedOn: "2026-01-05",
    assignedMentor: "Ishaan Kapoor",
  },
  {
    id: "s2",
    name: "Ananya Iyer",
    email: "ananya.iyer.student@example.com",
    phone: "+91 98123 45678",
    college: "Delhi University",
    degree: "B.Com Honours",
    workEx: "Fresher",
    package: "Call Convert Plus",
    credits: { pi: { used: 4, total: 6 }, gdge: { used: 2, total: 3 }, wat: { used: 1, total: 2 }, sop: { used: 1, total: 1 }, strategyCalls: { used: 1, total: 2 } },
    readiness: { communication: 4, content: 4, profileKnowledge: 3, crossQuestioning: 3, confidence: 4, instituteFit: 3 },
    calls: [
      { institute: "MDI Gurgaon", interviewDate: "2026-02-11", stage: "PI scheduled" },
      { institute: "NMIMS Mumbai", interviewDate: "2026-02-03", stage: "Waitlisted" },
    ],
    weakAreas: ["Institute fit", "Profile knowledge"],
    joinedOn: "2025-12-28",
    assignedMentor: "Meera Nair",
  },
  {
    id: "s3",
    name: "Vikram Suresh",
    email: "vikram.suresh@example.com",
    phone: "+91 90000 11122",
    college: "BITS Pilani",
    degree: "B.E. Computer Science",
    workEx: "3 years, software engineer",
    package: "Call Convert",
    credits: { pi: { used: 4, total: 4 }, gdge: { used: 2, total: 2 }, wat: { used: 1, total: 1 }, sop: { used: 1, total: 1 }, strategyCalls: { used: 1, total: 1 } },
    readiness: { communication: 5, content: 4, profileKnowledge: 5, crossQuestioning: 4, confidence: 5, instituteFit: 4 },
    calls: [{ institute: "NMIMS Mumbai", interviewDate: "2026-01-25", stage: "Converted" }],
    weakAreas: [],
    joinedOn: "2025-12-10",
    assignedMentor: "Kabir Malhotra",
  },
  {
    id: "s4",
    name: "Sanya Kapoor",
    email: "sanya.kapoor@example.com",
    phone: "+91 99887 76655",
    college: "Christ University",
    degree: "BBA",
    workEx: "1 year, marketing intern",
    package: null,
    credits: { pi: { used: 0, total: 1 }, gdge: { used: 0, total: 0 }, wat: { used: 0, total: 0 }, sop: { used: 0, total: 0 }, strategyCalls: { used: 0, total: 0 } },
    readiness: { communication: 3, content: 2, profileKnowledge: 2, crossQuestioning: 2, confidence: 3, instituteFit: 2 },
    calls: [{ institute: "SPJIMR Mumbai", interviewDate: "2026-02-20", stage: "Awaiting" }],
    weakAreas: ["Content", "Profile knowledge"],
    joinedOn: "2026-02-01",
    assignedMentor: "Unassigned",
  },
];

export const currentStudent = students[0]; // Aarav Mehta — used across the Student portal demo

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type SessionType = "Mock PI" | "Mock GD/GE" | "WAT" | "Strategy Call" | "SOP Review" | "Quick Guidance";

export interface Session {
  id: string;
  type: SessionType;
  focus?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "requested" | "confirmed" | "in-progress" | "completed" | "feedback-pending" | "cancelled" | "no-show" | "rescheduled";
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  meetingLink?: string;
  note?: string;
  feedback?: SessionFeedback;
}

export interface SessionFeedback {
  rubric: { communication: number; content: number; profileKnowledge: number; crossQuestioning: number; confidence: number; instituteFit: number };
  strengths: string;
  weaknesses: string;
  redFlags: string;
  answerFraming: string;
  questionsToPrepare: string;
  recommendation: "Ready" | "Needs another round" | "Strong convert";
  privateNoteToAdmin?: string;
}

export const sessions: Session[] = [
  {
    id: "sess-1",
    type: "Mock PI",
    focus: "HR + Profile",
    date: "2026-09-23",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    status: "confirmed",
    studentId: "s1",
    studentName: "Aarav Mehta",
    mentorId: "m1",
    mentorName: "Ishaan Kapoor",
    meetingLink: "meet.convertsclub.in/av-ik-2309",
    note: "Preparing for XLRI final, weak on Why MBA.",
  },
  {
    id: "sess-2",
    type: "Mock GD/GE",
    date: "2026-09-24",
    startTime: "6:00 PM",
    endTime: "7:00 PM",
    status: "requested",
    studentId: "s1",
    studentName: "Aarav Mehta",
    mentorId: "m2",
    mentorName: "Meera Nair",
  },
  {
    id: "sess-3",
    type: "Mock PI",
    focus: "Cross-questioning",
    date: "2026-09-15",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    status: "completed",
    studentId: "s1",
    studentName: "Aarav Mehta",
    mentorId: "m1",
    mentorName: "Ishaan Kapoor",
    feedback: {
      rubric: { communication: 4, content: 3, profileKnowledge: 4, crossQuestioning: 2, confidence: 3, instituteFit: 4 },
      strengths: "Clear structure on Why MBA and Why now. Good recall of resume projects.",
      weaknesses: "Loses composure under rapid cross-questioning on the same point.",
      redFlags: "Vague on post-MBA goal specifics when pushed twice.",
      answerFraming: "Use the Situation-Action-Result frame for resume questions, keep answers under 60 seconds.",
      questionsToPrepare: "Why not a general management role right now? Defend your CAT percentile vs profile.",
      recommendation: "Needs another round",
    },
  },
  {
    id: "sess-4",
    type: "WAT",
    date: "2026-09-12",
    startTime: "—",
    endTime: "—",
    status: "feedback-pending",
    studentId: "s2",
    studentName: "Ananya Iyer",
    mentorId: "m4",
    mentorName: "Ananya Iyer",
  },
  {
    id: "sess-5",
    type: "Mock PI",
    focus: "Institute-specific final",
    date: "2026-09-10",
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    status: "no-show",
    studentId: "s2",
    studentName: "Ananya Iyer",
    mentorId: "m5",
    mentorName: "Kabir Malhotra",
  },
  {
    id: "sess-6",
    type: "Strategy Call",
    date: "2026-09-25",
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    status: "confirmed",
    studentId: "s3",
    studentName: "Vikram Suresh",
    mentorId: "m5",
    mentorName: "Kabir Malhotra",
    meetingLink: "meet.convertsclub.in/vs-km-2509",
  },
  {
    id: "sess-7",
    type: "Mock PI",
    focus: "Academics",
    date: "2026-09-21",
    startTime: "7:00 PM",
    endTime: "8:00 PM",
    status: "requested",
    studentId: "s4",
    studentName: "Sanya Kapoor",
    mentorId: "m3",
    mentorName: "Rohan Bhatia",
  },
];

export const sessionsForCurrentMentor = sessions.filter((s) => s.mentorId === currentMentor.id);
export const sessionsForCurrentStudent = sessions.filter((s) => s.studentId === currentStudent.id);

// ---------------------------------------------------------------------------
// Admin: applications, payouts, finance
// ---------------------------------------------------------------------------

export interface MentorApplication {
  id: string;
  name: string;
  college: string;
  batch: string;
  gdpiExperience: string;
  linkedin: string;
  stage: "Applied" | "Screening scheduled" | "Scored" | "Onboarded" | "Rejected";
  recommendedTier?: MentorTier;
  scorecard?: { communication: number; questionQuality: number; crossQuestioning: number; feedbackQuality: number; professionalism: number; weaknessSpotting: number };
}

export const mentorApplications: MentorApplication[] = [
  { id: "app-1", name: "Tanvi Rao", college: "IIM Bangalore", batch: "2025", gdpiExperience: "Converted 4 B-school calls last season", linkedin: "linkedin.com/in/tanvirao", stage: "Applied" },
  { id: "app-2", name: "Devansh Oberoi", college: "XIMB Bhubaneswar", batch: "2024", gdpiExperience: "Peer-mentored juniors informally", linkedin: "linkedin.com/in/devanshoberoi", stage: "Screening scheduled" },
  { id: "app-3", name: "Riya Chatterjee", college: "IIM Lucknow", batch: "2025", gdpiExperience: "Debate society president, 2 years", linkedin: "linkedin.com/in/riyachatterjee", stage: "Scored", recommendedTier: "Senior", scorecard: { communication: 5, questionQuality: 4, crossQuestioning: 5, feedbackQuality: 4, professionalism: 5, weaknessSpotting: 4 } },
  { id: "app-4", name: "Arjun Nambiar", college: "SIBM Pune", batch: "2024", gdpiExperience: "First season applying", linkedin: "linkedin.com/in/arjunnambiar", stage: "Onboarded", recommendedTier: "Junior" },
  { id: "app-5", name: "Priya Deshmukh", college: "NMIMS Mumbai", batch: "2025", gdpiExperience: "Limited GDPI exposure", linkedin: "linkedin.com/in/priyadeshmukh", stage: "Rejected" },
];

export interface PayoutRecord {
  id: string;
  mentorId: string;
  mentorName: string;
  amount: number;
  status: "Accrued" | "Approved" | "Paid";
  date: string;
  reference?: string;
}

export const payoutRecords: PayoutRecord[] = [
  { id: "po-1", mentorId: "m1", mentorName: "Ishaan Kapoor", amount: 4200, status: "Accrued", date: "2026-09-20" },
  { id: "po-2", mentorId: "m2", mentorName: "Meera Nair", amount: 3100, status: "Approved", date: "2026-09-18" },
  { id: "po-3", mentorId: "m3", mentorName: "Rohan Bhatia", amount: 1850, status: "Accrued", date: "2026-09-19" },
  { id: "po-4", mentorId: "m1", mentorName: "Ishaan Kapoor", amount: 9600, status: "Paid", date: "2026-08-31", reference: "UTR2608XN451" },
  { id: "po-5", mentorId: "m4", mentorName: "Ananya Iyer", amount: 2400, status: "Approved", date: "2026-09-17" },
];

export const adminKPIs = {
  seasonRevenue: 64300,
  seasonGoal: 150000,
  netAfterPayouts: 48750,
  activeStudents: 38,
  sessionsThisWeek: 27,
  unassignedSessions: 9,
  feedbackOverdue: 4,
  payoutsDue: 6,
};

export const revenueByProduct = [
  { label: "Call Convert", value: 31600 },
  { label: "Call Convert+", value: 21400 },
  { label: "Mock PI", value: 6800 },
  { label: "Guidance", value: 2900 },
  { label: "Other", value: 1600 },
];

export const sessionsPerWeek = [
  { label: "W1", value: 14 },
  { label: "W2", value: 19 },
  { label: "W3", value: 22 },
  { label: "W4", value: 27 },
];

export const conversionFunnel = [
  { label: "Quick Guidance", value: 210 },
  { label: "Mock PI (1st)", value: 118 },
  { label: "Package purchase", value: 64 },
];

export const notifications = {
  student: [
    { id: "n1", title: "Session confirmed", description: "Mock PI with Ishaan Kapoor, 23 Sep, 4:00 PM IST.", time: "2h ago", unread: true },
    { id: "n2", title: "Feedback published", description: "Your Mock PI feedback from 15 Sep is ready.", time: "1d ago", unread: true },
    { id: "n3", title: "Reminder", description: "Your Mock GD/GE starts in 24 hours.", time: "2d ago" },
  ],
  mentor: [
    { id: "n1", title: "New session assigned", description: "Mock PI with Aarav Mehta, 23 Sep, 4:00 PM IST.", time: "3h ago", unread: true },
    { id: "n2", title: "Payout processed", description: "₹9,600 credited to your UPI.", time: "3w ago" },
    { id: "n3", title: "Feedback due soon", description: "WAT review for Ananya Iyer due in 6h.", time: "5h ago", unread: true },
  ],
  admin: [
    { id: "n1", title: "New mentor application", description: "Tanvi Rao applied — IIM Bangalore.", time: "1h ago", unread: true },
    { id: "n2", title: "Payment failed", description: "Sanya Kapoor's Call Convert payment failed.", time: "4h ago", unread: true },
    { id: "n3", title: "Payout run completed", description: "₹18,200 paid across 5 mentors.", time: "2d ago" },
  ],
};
