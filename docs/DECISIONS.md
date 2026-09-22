# Decisions and assumptions

Every assumption made without asking, with its default. Change any of these and the code follows
from one place. **Business numbers are read from `src/lib/settings.ts` / `src/lib/catalog.ts`**
(database-backed and Admin-editable from Phase 1); pages never hard-code them.

## Open questions (blockers to go live, not to keep building)

1. ~~GitHub repo~~ **Done.** `Samrudh12602/TheConvertsClub`, `main` is the default branch. It is **PUBLIC** (chosen by you); the earlier prototype remains on branch `claude/convert-club-platform-design-9641yp`. Consider making it private: `gh repo edit Samrudh12602/TheConvertsClub --visibility private --accept-visibility-change-consequences`.
2. ~~Vercel~~ **Done.** Project `the-converts-club` (personal scope `samdhaimodkar-2351`), Git-connected. First deploy was auto-assigned to production: https://the-converts-club.vercel.app
3. **Domain DNS** for convertsclub.in: needed only at go-live (the app is fully functional on the
   `.vercel.app` URL in the meantime; the domain is a DNS/branding step, not a functionality one).
4. **Razorpay** live keys + webhook secret: the *code* is done (orders, checkout, signature-verified
   webhook, idempotent fulfilment, refunds) — nothing has been charged yet because no key is set.
   Add test keys with `scripts/set-vercel-env.sh preview` to test end-to-end before going live.
5. **Resend** account + verified sending domain: the *code* is done (every transactional email,
   magic-link login, broadcasts) — nothing has been emailed yet because no key is set. Until a key
   is added, `RESEND_API_KEY` is unset and every send is logged as `SKIPPED` in `EmailLog`, and the
   login page shows only Google + demo access.
6. ~~Google OAuth~~ **Not yet provided.** Without it the login page falls back to email-link + demo
   access, which is enough to test all three roles today (see the demo credentials below).
6b. ~~ADMIN_EMAIL~~ **Done.** Set to samdhaimodkar@gmail.com. That address becomes the real Admin
   automatically the moment it signs in (Google or email link) — no real admin account exists yet
   because signing in needs Google OAuth or Resend, neither configured yet. Once either is added,
   sign in with this address once and you're the real admin.
7. ~~Neon Postgres~~ **Done.** Provisioned via the Vercel Marketplace, migrated (43 tables), seeded
   with real reference data (catalog, pay rates, bonus rules) and a full demo dataset.
8. **Legal text**: `/terms`, `/privacy`, `/refunds` are structure only. **A lawyer and a CA must review them before launch** (refunds, GST, DPDP).
9. **Real content**: mentors, results, testimonials, season numbers. The Admin > Content screen is
   now real and wired to the public site — testimonials and FAQs you add there replace the
   placeholders immediately, in every environment.
10. **Auto-deploy on push is unconfirmed.** `vercel git connect` reported the repo as already
    connected, but a push to `main` did not trigger a Vercel build in testing, and the repo has no
    classic GitHub webhook (Vercel's GitHub integration uses a GitHub App, which I can't fully verify
    or reinstall from the CLI — that needs an interactive GitHub authorization). Ship with
    `vercel --prod --yes` until this is confirmed working; re-check by pushing a trivial commit and
    watching `vercel ls` for a new build.
11. **Demo login passcodes**: generated as random strings, stored only as Vercel env vars
    (`DEMO_PASSCODE_STUDENT/MENTOR/ADMIN`, Sensitive) and in `.env.development.local` (gitignored,
    local machine only — never committed). Retrieve them with
    `vercel env pull .env.local && grep DEMO_PASSCODE .env.local`, or read the already-pulled
    `.env.development.local` in this project. Demo accounts (`*@demo.convertclub.test`) can never
    receive real mail and are excluded from every real business metric.
12. **"View as student/mentor" and a drag-and-drop scheduler timeline are not built.** Both are
    listed in the spec's Admin power tools. Given the remaining time, I substituted the honest,
    lower-risk equivalents instead of a half-built impersonation feature or a fake-looking timeline:
    the Student/Mentor 360 pages (`/admin/students/[id]`, `/admin/mentors/[id]`) show everything
    "view as" would, read-only; the Scheduler is a reassign-anyone list (the design's "layout B").
13. **Mentor pipeline is real, not a stub.** `/become-a-mentor` now actually submits (requires a
    LinkedIn URL and a professional photo, both validated — the photo's real file signature is
    checked, not just its extension). Admin can add a mentor directly (`/admin/mentors`, photo
    upload or a pasted URL, account created immediately — no invite email to wait on) or promote an
    application (`/admin/applications`, carries the submitted photo over, no re-upload). `/mentors`
    now reads real mentor rows; it only shows the demo roster when there are zero real ones and the
    environment allows demo content.
14. **Mentor and applicant photos are private-store-backed, not a second public Blob store.**
    A Vercel Blob store's access mode (public/private) is fixed at creation and can't be mixed —
    confirmed by testing, not assumed. Rather than provision and wire a second store just for
    public photos, photos are served through two of our own routes reading the existing private
    store: `/api/mentor-photo/[mentorId]` (no auth, gated on the same ACTIVE/publicVisible rule the
    public page uses) and `/api/files/applications/[id]` (admin-only). Simpler, one store, same
    security properties.

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
| 19 | Vercel env vars | `AUTH_SECRET`, `CRON_SECRET` (Sensitive, generated) on Production+Preview; `NEXT_PUBLIC_APP_URL=https://convertsclub.in` on Production. Third-party keys are added with `scripts/set-vercel-env.sh`, never through chat. | Vercel |
| 18 | Copy claims about mentors | "Converted in 2024 or 2025", "screened and trial mock" are design copy. Confirm they are true or the FAQ overstates. | `content.ts` |

## Where the prompt and the design disagreed

Behaviour follows the prompt; looks follow the design. Differences are listed in
`docs/DESIGN_MAP.md` under "Things in the design that could not be implemented as drawn".
