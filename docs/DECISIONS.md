# Decisions and assumptions

Every assumption made without asking, with its default. Change any of these and the code follows
from one place. **Business numbers are read from `src/lib/settings.ts` / `src/lib/catalog.ts`**
(database-backed and Admin-editable from Phase 1); pages never hard-code them.

## Open questions (blockers to go live, not to keep building)

1. **GitHub repo**: none created yet. Needs your account (private repo).
2. **Vercel**: project not created; CLI not installed. Needs `vercel login` from you.
3. **Domain DNS** for convertsclub.in: needed only at go-live.
4. **Razorpay** test keys + webhook secret: needed to finish Phase 2 payments.
5. **Resend** account + verified sending domain: needed for magic links and emails.
6. **Google OAuth** client id/secret: needed for Google sign-in.
7. **Neon Postgres**: provisioned via the Vercel Marketplace once the project exists.
8. **Legal text**: `/terms`, `/privacy`, `/refunds` are structure only. **A lawyer and a CA must review them before launch** (refunds, GST, DPDP).
9. **Real content**: mentors, results, testimonials, season numbers.

## Assumptions

| # | Topic | Default | Where |
| --- | --- | --- | --- |
| 1 | Project location | `~/convert-club` | n/a |
| 2 | Package manager | npm (Node 22) | `package.json` |
| 3 | Component primitives | Hand-built to the design (Button, Card, Field, Pill, Notice). shadcn/ui/Radix added when a portal needs Dialog/Select/Popover, not before. | `src/components/ui` |
| 4 | Catalog source until DB exists | Typed constants in `catalog.ts`, read only through async functions, so Prisma replaces one file. | `src/lib/catalog.ts` |
| 5 | Early-bird rule | `price` applies while `now < earlyBirdEndsAt`; after that the price **reverts to MRP**. Call Convert and Plus end **31 Jan 2027, 11:59 PM IST** (design says "until 31 January"). Confirm the year and whether MRP is really the post-deadline price. | `catalog.ts` `priceView` |
| 6 | Additional PI on the public site | Shown as in the design (₹449, struck ₹599) but its button says "Log in to buy" and `/checkout?product=additional-pi` redirects to `/login`. The spec says enrolled students only. The ₹599 MRP is from the design; the spec table lists none. | `catalog.ts`, `price.tsx`, `checkout/page.tsx` |
| 7 | Public price pages | Revalidate hourly so the early-bird deadline flips without a redeploy. | `revalidate = 3600` |
| 8 | Booking policy defaults | Cancel/reschedule notice 12h, max 2 reschedules, refund window 48h, recording retention 90 days, hold 10 min, GD capacity 8, feedback due 24h, booking mode `AUTO_CONFIRM`. Marketing copy interpolates these. | `src/lib/settings.ts` |
| 9 | "Demo" environment | `APP_ENV` \> `VERCEL_ENV` \> `NODE_ENV`. Demo content shows unless the environment is `production`. Vercel *preview* deployments count as non-production. | `src/lib/env.ts` |
| 10 | Unwired forms | Login, checkout and mentor application validate fully, then say plainly that nothing was sent or charged. They never fake success. | `PendingNotice` |
| 11 | `/checkout/success` | Redirects to `/packages` unless non-production with `?demo=1`. Phase 2 reads the paid order. | `checkout/success/page.tsx` |
| 12 | Phone validation | Indian mobile: 10 digits starting 6-9, optional `+91`/`91`/`0` prefix. International numbers are not accepted yet. | `lib/validation/forms.ts` |
| 13 | Mentor "hours a week" | Whole number 1 to 40 (the design showed free text). | `forms.ts` |
| 14 | Mentors page contents | Photo, name, college, two-line bio only. Never tier. | `getPublicMentors` |
| 15 | GST | Off by default (`gstEnabled: false`). Needs a CA decision before it is switched on. | `settings.ts` |
| 16 | `middleware.ts` | Next.js 16 renamed it `proxy.ts`. Route guards will use `proxy.ts`. | Phase 1 |
| 17 | Recording / refund claims in copy | Copied from the design ("recording available 90 days", "refundable within 48 hours if no credit used"). Recordings are not in the build spec; confirm you offer them. | `content.ts` |
| 18 | Copy claims about mentors | "Converted in 2024 or 2025", "screened and trial mock" are design copy. Confirm they are true or the FAQ overstates. | `content.ts` |

## Where the prompt and the design disagreed

Behaviour follows the prompt; looks follow the design. Differences are listed in
`docs/DESIGN_MAP.md` under "Things in the design that could not be implemented as drawn".
