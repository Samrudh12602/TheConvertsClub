import type { EmailProps } from "@/emails/transactional";

/**
 * Default copy for every transactional email (from the design handoff). Admin can override subject, heading and
 * body per template in the EmailTemplate table; `{placeholders}` are filled from the variables passed at send time.
 * Tier is never a variable: no student-facing email can mention it.
 */
export type TemplateKey =
  | "magic_link" | "welcome" | "booking_confirmed" | "booking_requested" | "reminder_24h" | "reminder_1h"
  | "session_cancelled" | "session_rescheduled" | "feedback_published" | "review_completed"
  | "mentor_invite" | "mentor_added" | "mentor_assignment" | "mentor_availability_change"
  | "payout_processed" | "refund_processed" | "broadcast";

export interface TemplateDef {
  subject: string;
  head: string;
  body: string;
  cta?: string;
  footer?: string;
}

export const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  magic_link: { subject: "Your Convert Club login link", head: "Log in to The Convert Club", body: "Use the button below to sign in. It works once and expires in 24 hours.", cta: "Log in", footer: "If you didn't ask for this, ignore this email." },
  welcome: { subject: "You're in — set up your Convert Club account", head: "Payment confirmed", body: "Your credits are waiting. Set a login, finish the four onboarding questions, and slots open to you immediately.", cta: "Set up my account", footer: "This link expires in 24 hours. Request a new one any time from the login page." },
  booking_confirmed: { subject: "Your {session} is confirmed — {when}", head: "You're booked", body: "Your mentor has your profile and will have read it before you join. Arrive two minutes early and treat it like the real thing.", cta: "Join link and details", footer: "Need to move it? Free until {deadline}, from your sessions page." },
  booking_requested: { subject: "We've got your request — {session}, {when}", head: "Request received", body: "We'll confirm your slot shortly and email you the moment it's approved. Your credit is held until then.", cta: "See my sessions" },
  reminder_24h: { subject: "Tomorrow: {session} at {time}", head: "Your session is tomorrow", body: "A quick reminder. Have your resume and application form ready.", cta: "Session details", footer: "Need to move it? Free until {deadline}." },
  reminder_1h: { subject: "In an hour: {session}", head: "Starts at {time}", body: "Have your resume and application form open. Somewhere quiet, camera on, laptop not phone.", cta: "Join now", footer: "If something's gone wrong, reply to this email." },
  session_cancelled: { subject: "Cancelled: {session}, {when}", head: "Your session was cancelled", body: "{detail}", cta: "Book another slot" },
  session_rescheduled: { subject: "Moved: {session} is now {when}", head: "Your session has moved", body: "{detail}", cta: "See my sessions" },
  feedback_published: { subject: "Your feedback from {session} is ready", head: "Scored {score} overall", body: "Two things worked, two cost you marks, and there's a rewrite of the answer that went wrong. Read it before you book the next one.", cta: "Read the report", footer: "Rate the session while it's fresh — it's how we decide who takes your next one." },
  review_completed: { subject: "Your {session} review is ready", head: "Your review is ready", body: "Your mentor has marked your submission. Read the notes and, if you have a revision credit, send the next version.", cta: "Read the review" },
  mentor_invite: { subject: "You're invited to mentor at The Convert Club", head: "Join as a mentor", body: "Samrudh has invited you to take mocks on your own hours, paid per session. Accept with the email address this was sent to.", cta: "Accept the invite", footer: "This invite expires in 7 days." },
  mentor_added: { subject: "You're set up as a mentor at The Convert Club", head: "Your mentor account is ready", body: "Samrudh has set up your mentor account. Log in with this email address to set your availability and take your first mock.", cta: "Log in", footer: "This link expires in 24 hours. Request a new one any time from the login page." },
  mentor_assignment: { subject: "Assigned: {student}, {when}", head: "A session has been assigned to you", body: "{detail}", cta: "Open the session", footer: "Can't make it? Tell Samrudh now, not on the day." },
  mentor_availability_change: { subject: "Availability change: {when}", head: "One of your slots changed", body: "{detail}", cta: "Open availability" },
  payout_processed: { subject: "{amount} sent — {period} payout", head: "Your {period} payout is on its way", body: "{detail} The reference below matches your bank statement.", cta: "See the breakdown" },
  refund_processed: { subject: "Your refund of {amount} is on its way", head: "Refund processed", body: "We've refunded {amount} to your original payment method. It usually lands in 5 to 7 working days.", footer: "Questions? Reply to this email." },
  broadcast: { subject: "{subject}", head: "{subject}", body: "{body}" },
};

export function fill(s: string, vars: Record<string, string | number | undefined>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? "" : String(vars[k])));
}

export function buildProps(def: TemplateDef, vars: Record<string, string | number | undefined>, extra: { details?: { k: string; v: string }[]; url?: string }): { subject: string; props: EmailProps } {
  const subject = fill(def.subject, vars);
  const head = fill(def.head, vars);
  return {
    subject,
    props: {
      preview: head,
      head,
      body: fill(def.body, vars),
      details: extra.details,
      cta: def.cta && extra.url ? { label: def.cta, url: extra.url } : undefined,
      footer: def.footer ? fill(def.footer, vars) : undefined,
    },
  };
}
