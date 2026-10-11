import { BUSINESS } from "@/lib/business";
import { formatPaise } from "@/lib/money";
import { priceView, type CatalogProduct } from "@/lib/pricing";
import type { SenderKey } from "@/lib/mailbox";

/** Ready-to-send emails for the Mailbox composer. The message uses the composer's formatting (see plainFromMarkup) and {{first_name}}. */
export interface MailTemplate {
  id: string;
  name: string;
  /** One line shown under the template name. */
  blurb: string;
  /** Who it is written for: typed addresses of people outside the site, or everyone in a group on the site. */
  audience: "SPECIFIC" | "ALL_STUDENTS" | "ALL_MENTORS";
  from: SenderKey;
  subject: string;
  body: string;
}

/** What the buyer pays now, what it was, and how many early-bird seats are left (null when there is no early-bird offer running). */
export interface PriceNote { now: string; was: string | null; seatsLeft: number | null }

export function priceNote(p: CatalogProduct | null): PriceNote | null {
  if (!p) return null;
  const v = priceView(p);
  return { now: formatPaise(v.payablePaise), was: v.strikePaise !== null ? formatPaise(v.strikePaise) : null, seatsLeft: p.earlyBird && p.earlyBird.seatsLeft > 0 ? p.earlyBird.seatsLeft : null };
}

export interface TemplatePrices { test: PriceNote | null; five: PriceNote | null; ten: PriceNote | null; upgrade: PriceNote | null }

const MOCKS = `https://${BUSINESS.domain}/mocks`;
const MENTOR = `https://${BUSINESS.domain}/become-a-mentor`;
const PORTAL = `https://${BUSINESS.domain}/student`;

const priceLine = (name: string, n: PriceNote | null) => (n ? `**${name}** ${n.now}${n.was ? ` (was ${n.was})` : ""}${n.seatsLeft ? ` · only ${n.seatsLeft} early-bird seat${n.seatsLeft === 1 ? "" : "s"} left` : ""}` : null);

export function buildMailTemplates(p: TemplatePrices): MailTemplate[] {
  const test = p.test?.now ?? "₹50";
  const five = p.five?.now ?? "₹499";
  const ten = p.ten?.now ?? "₹899";
  const upgrade = p.upgrade?.now ?? "₹499";
  const offers = [priceLine("SNAP 2026 test mock", p.test), priceLine("5 mocks", p.five), priceLine("10 mocks", p.ten)].filter((x): x is string => x !== null).map((l) => `> ${l}`).join("\n");
  const seatsOpen = [p.test, p.five, p.ten].some((n) => n?.seatsLeft);

  return [
    {
      id: "snap-launch",
      name: "SNAP mocks: introduce the product",
      blurb: "For people who haven't bought yet. Explains what makes the mocks different and starts them on the test mock.",
      audience: "SPECIFIC",
      from: "samrudh",
      subject: "Take SNAP 2026 on the real exam screen, then see what went wrong",
      body: `# Your SNAP 2026 mock, on the real exam screen

Hi {{first_name}},

Most mocks tell you your score. Ours tell you **why** you got it.

Every Converts Club mock is a full-length SNAP paper: 60 questions, 60 minutes, three sections and negative marking, on a screen that looks and behaves like the real exam. The question palette, mark-for-review and the server clock are all there.

The moment you submit, you get:

- Your score, accuracy and attempt rate
- Section-wise and topic-wise results
- What went wrong on each question: careless, concept gap, time lost, or never reached
- A worked solution for all 60 questions
- A detailed PDF analysis with your name on it

[button: Take the SNAP test mock for ${test} | ${MOCKS}]

> Start with one. The test mock is one full paper with the complete analysis, so you can judge the quality before you commit to anything more.

## Want more practice?

- **5 mocks** for ${five}
- **10 mocks** for ${ten}: the best price for the full run up to the exam

Built by people who converted.

Good luck with your preparation,`,
    },
    {
      id: "early-bird",
      name: "Early-bird offer with seats left",
      blurb: "Creates real urgency from your own numbers. The prices and seats left are filled in live from your Products page.",
      audience: "SPECIFIC",
      from: "samrudh",
      subject: seatsOpen ? "Early-bird SNAP mock prices, while the seats last" : "SNAP 2026 mock packs, open now",
      body: seatsOpen
        ? `# Early-bird prices, while the seats last

Hi {{first_name}},

We have opened SNAP 2026 mocks at early-bird prices for the first buyers of each pack. When the seats are gone, the price goes back up.

${offers}

All of them are full-length SNAP papers on the real exam screen, each with a complete analysis, a solution for every question and a PDF to revise from.

[button: Claim an early-bird seat | ${MOCKS}]

If you have been thinking about it, these are the lowest prices on the packs right now.

Good luck with your preparation,`
        : `# SNAP 2026 mock packs are open

Hi {{first_name}},

Full-length SNAP papers on the real exam screen, each with a complete analysis, a worked solution for every question and a PDF to revise from.

${offers}

[button: See the packs | ${MOCKS}]

Good luck with your preparation,`,
    },
    {
      id: "mentor-invite",
      name: "Invite converts to become mentors",
      blurb: "For people who recently converted a call. Sends them to the Become a mentor application.",
      audience: "SPECIFIC",
      from: "samrudh",
      subject: "You converted. Help the next batch do the same.",
      body: `# You converted. Help the next batch do the same.

Hi {{first_name}},

Congratulations on your conversion. Someone a year behind you is about to freeze in the same interview room, and you know exactly how to help them.

The Converts Club is looking for mentors who recently converted calls to take mock interviews and give honest, specific feedback.

- **Paid per session.** Rates are fixed and visible in your portal. Pay accrues the moment you submit feedback, not when the student pays.
- **Your hours.** Publish the hours you are free. Nothing is assigned outside them, and you can pause any time.
- **No minimum commitment.** Most mentors take four to eight sessions a week through February.
- **Referral bonus.** Every 10 students who join with your code earn you 5% of the fees they paid, on top of your per-session pay.

[button: Apply to mentor | ${MENTOR}]

Have a question first? Just reply to this email and I will answer it myself.

Congratulations again, and thank you for considering it,`,
    },
    {
      id: "pack-followup",
      name: "Follow-up to students: packs and the +5 upgrade",
      blurb: "For people already on the site. Points test-mock students to a pack and 5-pack students to the 10-pack upgrade.",
      audience: "ALL_STUDENTS",
      from: "support",
      subject: "Your next SNAP mocks, at a better price",
      body: `# Keep the momentum going

Hi {{first_name}},

Thank you for practising with The Converts Club. The way to get the most out of a mock is to study the analysis, fix what went wrong, and then sit the next one.

**Took the test mock?** A pack costs less per mock, and every mock comes with the same full analysis and worked solutions:

- **5 mocks** for ${five}
- **10 mocks** for ${ten}

**Already have the 5-pack?** You can add 5 more mocks for just ${upgrade} from your dashboard.

[button: Open my dashboard | ${PORTAL}]

Questions about a mock or your analysis? Reply to this email and our team will help.

Keep going,`,
    },
  ];
}
