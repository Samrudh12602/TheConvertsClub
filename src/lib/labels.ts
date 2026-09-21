import type { PiFocus, SessionStatus, SessionType, ReviewKind, ReviewStatus, CreditKind, CallOutcome, AccrualStatus } from "@/generated/prisma/client";

export const FOCUS_LABEL: Record<PiFocus, string> = {
  HR_PROFILE: "HR / profile",
  ACADEMICS: "Academics",
  STRESS: "Stress",
  INSTITUTE_FINAL: "Institute final",
  CURRENT_AFFAIRS: "Current affairs",
  CROSS_QUESTIONING: "Cross-questioning",
};

export const TYPE_LABEL: Record<SessionType, string> = {
  MOCK_PI: "Mock PI",
  STRATEGY_CALL: "Strategy call",
  GUIDANCE: "Guidance call",
  GD_BATCH: "GD/GE",
};

export const sessionTitle = (type: SessionType, focus?: PiFocus | null) =>
  focus ? `${TYPE_LABEL[type]} · ${FOCUS_LABEL[focus]}` : TYPE_LABEL[type];

export const REVIEW_LABEL: Record<ReviewKind, string> = { WAT: "WAT evaluation", SOP_BASIC: "Basic SOP review", SOP_DETAILED: "Detailed SOP review" };

export const CREDIT_LABEL: Record<CreditKind, string> = {
  PI: "PI", GD: "GD", WAT: "WAT", SOP_BASIC: "SOP basic", SOP_DETAILED: "SOP", SOP_REVISION: "SOP rev", STRATEGY: "strategy", GUIDANCE: "guidance",
};

export type Tone = "green" | "amber" | "oxblood" | "indigo" | "stone";

export const SESSION_STATUS: Record<SessionStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: "Awaiting confirmation", tone: "amber" },
  CONFIRMED: { label: "Confirmed", tone: "green" },
  IN_PROGRESS: { label: "In progress", tone: "indigo" },
  COMPLETED: { label: "Completed", tone: "stone" },
  CANCELLED: { label: "Cancelled", tone: "stone" },
  NO_SHOW: { label: "No-show", tone: "oxblood" },
  RESCHEDULED: { label: "Rescheduled", tone: "amber" },
};

export const REVIEW_STATUS: Record<ReviewStatus, { label: string; tone: Tone }> = {
  SUBMITTED: { label: "Waiting for a mentor", tone: "amber" },
  ASSIGNED: { label: "In review", tone: "amber" },
  COMPLETED: { label: "Feedback ready", tone: "indigo" },
};

export const CALL_OUTCOME: Record<CallOutcome, { label: string; tone: Tone }> = {
  SCHEDULED: { label: "Scheduled", tone: "indigo" },
  WAITING: { label: "Waiting", tone: "stone" },
  CONVERTED: { label: "Converted", tone: "green" },
  REJECTED: { label: "Not converted", tone: "oxblood" },
};

export const ACCRUAL_STATUS: Record<AccrualStatus, { label: string; tone: Tone }> = {
  ACCRUED: { label: "Accrued", tone: "amber" },
  APPROVED: { label: "Approved", tone: "indigo" },
  PAID: { label: "Paid", tone: "green" },
};

export const RUBRIC = ["Content depth", "Clarity", "Structure", "Body language", "Stress handling", "Current affairs"] as const;

/** Score tone: >=7 green, >=6 amber, else oxblood (matches the design's rubric bars). */
export const scoreTone = (n: number): "green" | "amber" | "oxblood" => (n >= 7 ? "green" : n >= 6 ? "amber" : "oxblood");

/** Full class names so Tailwind can see them at build time (never build `text-${x}` dynamically). */
export const SCORE_TEXT = { green: "text-green", amber: "text-amber", oxblood: "text-oxblood" } as const;
