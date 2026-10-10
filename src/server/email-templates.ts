import type { EmailProps } from "@/emails/transactional";

/**
 * Default copy for every transactional email (from the design handoff). Admin can override subject, heading and
 * body per template in the EmailTemplate table; `{placeholders}` are filled from the variables passed at send time.
 * Tier is never a variable: no student-facing email can mention it.
 */
export type TemplateKey =
  | "magic_link" | "welcome" | "welcome_account" | "verify_email" | "booking_confirmed" | "booking_requested" | "reminder_24h" | "reminder_1h"
  | "session_cancelled" | "session_rescheduled" | "feedback_published" | "review_completed"
  | "mentor_invite" | "mentor_added" | "mentor_assignment" | "mentor_availability_change"
  | "application_received" | "application_admin_alert"
  | "payout_processed" | "refund_processed" | "broadcast" | "contact_message" | "contact_received" | "credits_expiring" | "credits_expired" | "nudge_mentor_hours" | "nudge_credits" | "nudge_onboarding" | "free_guide" | "direct_request"
  | "mentor_reminder_24h" | "mentor_reminder_1h" | "mentor_feedback_reminder" | "mentor_feedback_overdue" | "mentor_feedback_escalated" | "admin_escalation" | "trial_followup" | "abandoned_checkout" | "admin_digest" | "panel_invite" | "panel_response" | "panel_confirmed" | "welcome_snap";

export interface TemplateDef {
  subject: string;
  head: string;
  body: string;
  cta?: string;
  footer?: string;
}

export const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  magic_link: { subject: "Your Converts Club login link", head: "Log in to The Converts Club", body: "Use the button below to sign in. It works once and expires in 24 hours.", cta: "Log in", footer: "If you didn't ask for this, ignore this email." },
  welcome: { subject: "You're in — set up your Converts Club account", head: "Payment confirmed", body: "Your credits are waiting. Set a login, finish the four onboarding questions, and slots open to you immediately.", cta: "Set up my account", footer: "This link expires in 24 hours. Request a new one any time from the login page." },
  welcome_account: { subject: "Welcome to The Converts Club, {name}", head: "Your account is ready", body: "You can log in any time with your email and password. Buy a package or a single session whenever you're ready to book your first mock.", cta: "See packages" },
  verify_email: { subject: "Confirm your email for The Converts Club", head: "One quick thing", body: "Click below to confirm this is your email address. It takes one click and the link expires in 48 hours.", cta: "Confirm my email" },
  application_received: { subject: "We've got your mentor application", head: "Application received", body: "Samrudh reviews every application personally. If it's a fit, you'll hear back with next steps — otherwise, thanks for your time.", footer: "Reply to this email if you'd like to add anything." },
  application_admin_alert: { subject: "New mentor application: {name}", head: "New mentor application", body: "{name} ({institute}) just applied. LinkedIn and a photo are on file.", cta: "Review the application" },
  booking_confirmed: { subject: "Your {session} is confirmed — {when}", head: "You're booked", body: "Your mentor has your profile and will have read it before you join. Arrive two minutes early and treat it like the real thing.", cta: "Join link and details", footer: "Need to move it? Free until {deadline}, from your sessions page." },
  booking_requested: { subject: "We've got your request — {session}, {when}", head: "Request received", body: "We'll confirm your slot shortly and email you the moment it's approved. Your credit is held until then.", cta: "See my sessions" },
  reminder_24h: { subject: "Tomorrow: {session} at {time}", head: "Your session is tomorrow", body: "A quick reminder. Have your resume and application form ready.", cta: "Session details", footer: "Need to move it? Free until {deadline}." },
  reminder_1h: { subject: "In an hour: {session}", head: "Starts at {time}", body: "Have your resume and application form open. Somewhere quiet, camera on, laptop not phone.", cta: "Join now", footer: "If something's gone wrong, reply to this email." },
  session_cancelled: { subject: "Cancelled: {session}, {when}", head: "Your session was cancelled", body: "{detail}", cta: "Book another slot" },
  session_rescheduled: { subject: "Moved: {session} is now {when}", head: "Your session has moved", body: "{detail}", cta: "See my sessions" },
  feedback_published: { subject: "Your feedback from {session} is ready", head: "Scored {score} overall", body: "Two things worked, two cost you marks, and there's a rewrite of the answer that went wrong. Read it before you book the next one.", cta: "Read the report", footer: "Rate the session while it's fresh — it's how we decide who takes your next one." },
  review_completed: { subject: "Your {session} review is ready", head: "Your review is ready", body: "Your mentor has marked your submission. Read the notes and, if you have a revision credit, send the next version.", cta: "Read the review" },
  mentor_invite: { subject: "You're invited to mentor at The Converts Club", head: "Join as a mentor", body: "Samrudh has invited you to take mocks on your own hours, paid per session. Accept with the email address this was sent to.", cta: "Accept the invite", footer: "This invite expires in 7 days." },
  mentor_added: { subject: "Your mentor account at The Converts Club — login details inside", head: "Your mentor account is ready", body: "You've been set up as a mentor. Log in with the email and temporary password below. The first time you sign in you'll be asked to choose your own password, and this temporary one stops working then.", cta: "Log in", footer: "The temporary password expires in 7 days. If it has, or you never received it, ask Samrudh to send a new one. If this landed in spam, please mark it \"Not spam\" so later emails reach you." },
  mentor_assignment: { subject: "Assigned: {student}, {when}", head: "A session has been assigned to you", body: "{detail}", cta: "Open the session", footer: "Can't make it? Tell Samrudh now, not on the day." },
  mentor_availability_change: { subject: "Availability change: {when}", head: "One of your slots changed", body: "{detail}", cta: "Open availability" },
  payout_processed: { subject: "{amount} sent — {period} payout", head: "Your {period} payout is on its way", body: "{detail} The reference below matches your bank statement.", cta: "See the breakdown" },
  refund_processed: { subject: "Your refund of {amount} is on its way", head: "Refund processed", body: "We've refunded {amount} to your original payment method. It usually lands in 5 to 7 working days.", footer: "Questions? Reply to this email." },
  broadcast: { subject: "{subject}", head: "{subject}", body: "{body}" },
  contact_message: { subject: "Contact form: {topic} — {name}", head: "New message from {name}", body: "{message}", footer: "Reply to this email to answer them directly." },
  credits_expiring: { subject: "Your unused credits expire on {date}", head: "{credits} expire on {date}", body: "Hi {name}, you still have unspent credits that will expire on {date}. Book a session before then and they're yours to use.", cta: "Book a session", footer: "Credits already attached to a booked session are never affected." },
  credits_expired: { subject: "Some of your credits have expired", head: "{credits} expired", body: "Hi {name}, these credits went unused for over {days} days and have now expired. Sessions you've already booked are unaffected. If you think this is a mistake, write to us and we'll look at it.", cta: "Contact us" },
  nudge_mentor_hours: { subject: "Students can't book you yet", head: "Publish your hours, {name}", body: "You don't have any open slots, so students can't book you. It takes two minutes: add the hours you're free this week and sessions will start coming in.", cta: "Add my hours", footer: "You'll only get this reminder once a week, and only while you have no open hours." },
  nudge_credits: { subject: "You have credits waiting", head: "{credits} ready to use, {name}", body: "You've got unspent credits and nothing booked. Mocks work best when they're spread out before your calls, so pick a slot while good ones are open.", cta: "Book a session", footer: "We'll only remind you once every couple of weeks." },
  nudge_onboarding: { subject: "Two minutes to finish your profile", head: "Finish your profile, {name}", body: "Your mentor reads your profile before every session, so the sharper it is, the better your mock. It takes about two minutes.", cta: "Finish my profile", footer: "We'll only remind you once a week." },
  free_guide: { subject: "Your free 48-hour interview checklist", head: "The 48-hour interview checklist", body: "Ten things to do before your personal interview, in the order to do them. Written by people who sat the same panels last season.", cta: "See how our mocks work", footer: "You asked for this on our website. We won't send you anything else unless you ticked the box for tips." },
  direct_request: { subject: "{student} asked for: {product}", head: "{student} wants a session with you", body: "They've paid for {product}, to be taken directly with you. They'll pick a time from your open slots next. Reply to this email to reach them, or open their page to book a slot for them.", cta: "Open their page", footer: "Make sure you have open hours published (Mentor mode > Availability), or they won't find a slot." },
  mentor_reminder_24h: { subject: "Tomorrow: {session} with {student} at {time}", head: "You have a session tomorrow", body: "{student} is booked with you tomorrow at {time}. Their profile is below, so you can read it before you join.", cta: "Open the session", footer: "Can't make it? Tell Samrudh now, not on the day." },
  mentor_reminder_1h: { subject: "In an hour: {session} with {student}", head: "Starts at {time}", body: "Your session with {student} starts at {time}. The meeting link is behind the button.", cta: "Join the meeting", footer: "Running late or can't make it? Message Samrudh right away." },
  mentor_feedback_reminder: { subject: "Feedback pending: {student}, {session}", head: "Quick one: feedback for {student}", body: "Your session with {student} ended earlier today. Students read feedback the same day, so now is the best time to write it. It's due {due}, and your pay for the session is added the moment you submit.", cta: "Write the feedback" },
  mentor_feedback_overdue: { subject: "Overdue: feedback for {student}", head: "Feedback for {student} is overdue", body: "The feedback window for {session} has passed. Please submit it today. Pay accrues only after you submit, and Samrudh is told if it stays late.", cta: "Submit feedback now" },
  mentor_feedback_escalated: { subject: "Final reminder: feedback for {student}", head: "Final reminder", body: "Feedback for {student} ({session}) is still outstanding, so Samrudh has been told. Please submit it now.", cta: "Submit feedback now" },
  admin_escalation: { subject: "{count} mentor feedback item(s) still late", head: "Still late after reminders", body: "These mentors were reminded twice and still haven't submitted. You may want to follow up:", cta: "Open the inbox" },
  trial_followup: { subject: "How was your trial, {name}? Here's what to do next", head: "Thanks for trying us, {name}", body: "You tried a {trial}. If it helped, the fastest way to move forward is a full plan: more mocks across more focus areas, written feedback every time, and a clear plan for your calls.", cta: "See Call Convert", footer: "Reply to this email if you'd like help picking. It reaches Samrudh directly." },
  abandoned_checkout: { subject: "You left {product} in your cart", head: "Still want {product}?", body: "You started checking out but didn't finish, so nothing was charged. Your cart is saved: pick up where you left off in a few seconds.", cta: "Finish checkout", footer: "If something went wrong at payment, reply to this email and we'll sort it out." },
  admin_digest: { subject: "Weekly digest: {revenue} this week", head: "Your week at The Converts Club", body: "Here's how the last 7 days went and what needs you.", cta: "Open the inbox" },
  welcome_snap: { subject: "Your SNAP mock is ready, {package}", head: "Payment confirmed", body: "Your {package} is in your account. Log in with the button below and start whenever you're ready. Sit it in one go on a laptop or desktop; your score, what went wrong and a solution for every question appear the moment you submit.", cta: "Open my mocks", footer: "Each mock can be taken once, and the clock starts when you press begin." },
  panel_invite: { subject: "Panel invite: {student}, {when}", head: "You're invited onto a panel", body: "{lead} has invited you to sit on the panel for a Panel PI with {student} on {when}. It's one hour in total, the interview and a live debrief. The hour is already held on your calendar; please accept or decline in your portal so the student's panel can be confirmed.", cta: "Accept or decline", footer: "Can't make it? Decline so another panelist can be picked." },
  panel_response: { subject: "{mentor} {answer}: Panel PI for {student}, {when}", head: "{mentor} {answer} the panel invite", body: "{mentor} {answer} the invite to the Panel PI with {student} on {when}.", cta: "Open the schedule" },
  panel_confirmed: { subject: "Your panel is confirmed for {when}", head: "Your panel is set", body: "All three panelists have confirmed for your Panel PI on {when}. It's one hour in total, the interview and a live debrief. Come with your resume and application form ready.", cta: "Session details" },
  contact_received: { subject: "We got your message", head: "Thanks, {name} — we've got it", body: "We read every message and usually reply within a day. If it's about a session that's about to start, email us again with the session time in the subject.", footer: "You don't need to do anything else." },
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
