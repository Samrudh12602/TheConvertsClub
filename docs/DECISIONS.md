# Decisions and assumptions

Every assumption made without asking, with its default. Change any of these and the code follows
from one place. **Business numbers are read from `src/lib/settings.ts` / `src/lib/catalog.ts`**
(database-backed and Admin-editable from Phase 1); pages never hard-code them.

## Open questions (blockers to go live, not to keep building)

1. ~~GitHub repo~~ **Done.** `Samrudh12602/TheConvertsClub`, `main` is the default branch. It is **PUBLIC** (chosen by you); the earlier prototype remains on branch `claude/convert-club-platform-design-9641yp`. Consider making it private: `gh repo edit Samrudh12602/TheConvertsClub --visibility private --accept-visibility-change-consequences`.
2. ~~Vercel~~ **Done.** Project `the-converts-club` (personal scope `samdhaimodkar-2351`), Git-connected. First deploy was auto-assigned to production: https://the-converts-club.vercel.app
3. **Domain** convertsclub.in: **not purchased yet** (confirmed with you directly). I attached the
   domain name to the Vercel project (`vercel domains add`) so the DNS records are ready the moment
   you buy it — that command only tells Vercel "route this hostname here if it ever resolves to us,"
   it does not register, reserve or charge for the domain. Nothing to do until you've bought it;
   then add an `A` record `convertsclub.in → 76.76.21.21` at your registrar (get the exact current
   record with `vercel domains inspect convertsclub.in`). The app is fully functional on the
   `.vercel.app` URL in the meantime — `appUrl()` (`src/lib/env.ts`) now resolves automatically to
   whichever URL is actually live (Vercel's own `VERCEL_PROJECT_PRODUCTION_URL`), so every email
   link, sitemap entry and canonical URL updates itself the moment the domain goes live — no code
   or env var change needed then. (Caught and fixed a bug from this: `NEXT_PUBLIC_APP_URL` had been
   set to `https://convertsclub.in` — a domain that doesn't resolve — which would have sent every
   login/notification email with a dead link. Removed the env var and the hardcoded fallback that
   caused it.)
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
15. **Vercel Marketplace's Resend integration requires a paid plan** ($20/mo Pro minimum — the free
    tier I initially tried is disabled for this account). Did not purchase it without asking; you
    chose the free direct-signup path at resend.com instead (same result, $0 cost). Provisioning
    also requires accepting Resend's marketplace terms as the account owner in the browser — not
    something I can do on your behalf even with permission, so that path stays available if you ever
    want the convenience later.
16. **Email + password login, for any role.** Works unconditionally (bcrypt, no external service
    needed) — this was added because Resend wasn't configured yet and you needed a way to actually
    use the site. Students self-register at `/signup`; mentors and admin get their account through
    the existing flows (invite, direct-add, promote-application, `ADMIN_EMAIL`) and can add a
    password afterwards from their own settings/profile page. Role-based routing is unchanged: it
    was always read from the database (`User.role`), never from which method someone signed in with.
17. **`NEXT_PUBLIC_APP_URL` should almost never be set explicitly.** Caught and fixed a live bug:
    it had been set to `https://convertsclub.in`, a domain that isn't purchased, so every email link
    generated in production would have been dead. `appUrl()` now falls back to Vercel's own
    `VERCEL_PROJECT_PRODUCTION_URL`, which is always correct for whatever's actually live — no
    manual update needed the day the real domain goes live. Only set the env var if you deliberately
    want a URL Vercel wouldn't infer on its own.

18. **In-app notifications are now visible.** `notify()` had been writing `Notification` rows from ~20
    places (bookings, payments, feedback, payouts, applications) but nothing read them. There is now a
    bell in every portal's top bar (`NotificationBell`, `/api/notifications`): unread badge, dropdown,
    mark one / all read, refreshes every 30 s and on window focus. The API is scoped to the signed-in
    user, so ids can't touch anyone else's rows.
19. **Messages are a real two-way support thread, student/mentor <-> the team.** Students and mentors
    write from `/student/messages` / `/mentor/messages`; each message is stored once against the primary
    admin, and every admin gets a bell notification with a deep link. Admin answers from
    `/admin/messages` (inbox, "awaiting reply" flag, reply box) or the new "Message" button on a
    student/mentor page. Deliberately **no student <-> mentor direct messaging** (keeps mentor tier/pay
    and contact details out of student hands). Demo accounts only reach demo admins and real accounts
    real admins, so test chatter never lands in your real inbox. Not yet emailed: with no Resend key, a
    message is only visible in-app; once a key is added, a "you have a new message" email is the next
    obvious step.
20. **Gmail is now a real send option, and wins over Resend when both are set.** `sendEmail()`
    (`src/server/email.ts`) tries Gmail SMTP (an App Password, via nodemailer) first, then falls back
    to Resend, and logs `SKIPPED` with no provider configured — nothing else in the app changes.
    Every email's reply-to defaults to the sending mailbox, so a reply from a student or applicant
    lands directly in your own Gmail inbox — no extra "receiving" code needed, Gmail already does that.
    `scripts/set-vercel-env.sh` now prompts for `GMAIL_USER` / `GMAIL_APP_PASSWORD` alongside Resend.
21. **New students get an email-verification link; new mentors do not get a login until you approve
    them.** Signup (`/signup`) sends a "confirm your email" link (`/verify-email`, single-use, 48h,
    hashed in the existing `VerificationToken` table); it doesn't block using the site while unverified
    — this only records the confirmation, since nothing currently depends on it. The mentor rule was
    **already true before this change** and needed no new gating: a public mentor application
    (`submitApplication`) only ever creates a `MentorApplication` row, never a `User` — there is no
    login for an applicant until you promote them from `/admin/applications`, or invite them directly.
    Verified by tracing every place a `User` gets `role: "MENTOR"` in the codebase: `addMentorDirect`,
    `promoteApplication`, and the invite-accept route all require either `requireAdmin()` first or a
    token you generated for that exact email. What's new here is real email around that: the applicant
    gets a "we've got your application" email, and your own Gmail inbox gets a direct alert (in
    addition to the existing in-app admin notification) with reply-to set to the applicant, so you can
    just hit reply.
22. **Local dev needs its own `AUTH_SECRET`.** Vercel marks it Sensitive, so `vercel env pull` can't
    fetch it. A throwaway one was generated into the gitignored `.env.development.local`. Note local
    dev talks to the **same live Neon database** as production — treat test actions accordingly.
23. **PDF receipts, generated locally, never sent to a third party.** `@react-pdf/renderer` (MIT,
    pure JS, no native binary, no Chromium) renders the PDF in the same Vercel function that already
    has the order — a customer's name, email and amount never leave our own servers to reach a
    PDF-generation SaaS. No GST/tax line, by design (item price, discount, total only). It's attached
    to the payment-confirmation email (delivered over Gmail SMTPS or Resend's HTTPS API, both already
    encrypted in transit) and downloadable two ways: `/student/payments/[orderId]` for a logged-in
    student (ownership checked against the real session, same as the page itself already did), and a
    link on `/checkout/success` for a guest who hasn't logged in yet. That second path deliberately
    does **not** trust the order id alone as a bearer credential — a receipt carries real PII, and an
    order id is a plausible-enough target to guess at. It uses the same pattern as the existing
    email-verification links (`src/server/receipt-access.ts`): a random token, SHA-256-hashed at rest,
    scoped to one order, expiring after 72h. Found and fixed one real bug while building this: the
    Helvetica base-14 PDF font has no ₹ (U+20B9) or − (U+2212) glyph, so both silently vanished from
    the rendered PDF — the PDF now formats money as "Rs. 1,234", ASCII-only, while the site and emails
    keep the real ₹ symbol (real fonts, unaffected).
24. **`nodemailer` stays on v8, not the latest v10 (a known, deferred security item).** `next-auth`
    5.0.0-beta.32 pins its own nodemailer dependency to `^7.0.7 || ^8.0.5`; forcing v10 breaks that
    peer resolution (`npm ls` reports an invalid tree). v8.0.11 has several disclosed advisories
    (`npm audit`) with no clean fix available while on this next-auth version. Revisit when next-auth
    bumps its own pin, or when this stops depending on next-auth's Credentials/Google/Resend providers.
25. **A full platform audit found one real dead feature and a few real blind spots; fixed all of
    them.** Traced every page, not guessed:
    - **Resources/Library was structurally dead.** Both `/student/library` and `/mentor/resources`
      read from the `Resource` table, but nothing anywhere could ever write to it — it only ever
      showed the seed data. Admin > Content now has a real add/remove panel for it (scoped per
      audience), and both portal pages now render a resource's `url` as an actual "Open" link, which
      they silently dropped before even when a resource had one.
    - **You had zero visibility into whether payments/email were actually live.** `paymentsConfigured()`
      and `emailProvider()` existed and worked but were only ever checked on the student/checkout
      side. Admin > Settings now opens with a "System status" panel reading the exact same functions
      the real checkout/email code paths use — Razorpay, the webhook secret, which email provider
      (and which Gmail address), Google sign-in, and the live URL — so nothing can drift from reality.
    - **WAT/SOP reviews had no overdue tracking**, unlike session feedback (which has a dashboard KPI,
      a red topbar badge, and a filtered view). Reviews now have the same: a topbar badge counting
      reviews past `dueAt`, an "Overdue" status pill, and an `/admin/reviews?filter=overdue` view.
    - **A mentor couldn't be hidden from `/mentors` without suspending them.** The `publicVisible`
      column existed on `MentorProfile` since the mentor-pipeline build but no form ever set it.
      Added a toggle on the mentor detail page; `getPublicMentors()` already filtered on it, so this
      was a missing write path, not a missing read path.
    - **Season-stat tiles on `/results` could never show real numbers — there was no field for them
      at all**, only ever bracketed placeholders (`"[ xx ]"`). Added a `SeasonStat` table and an
      Admin > Content panel for it. Deliberately independent of testimonials (a different table,
      already real/admin-editable) — either can be real while the other is still demo; the page's
      placeholder notice reflects whichever part, if any, still is.
    - Fixed two stale claims in `docs/DESIGN_MAP.md` that contradicted what's actually built now
      (login described as "not wired," mentor applications as "not persisted") — both have been real
      since earlier this session; the docs just hadn't caught up.

    Verified every item live against the real database (not just "it builds"): added and removed a
    real resource end-to-end including its link rendering on the student side, drove the review
    overdue filter against real seeded data, round-tripped a mentor's `publicVisible` flag and
    confirmed both the DB state and that a demo-admin safety guard correctly refused to touch a real
    (non-demo) mentor's data, and added a real season stat and watched it appear on `/results`
    alongside the still-placeholder testimonials with the demo notice correctly still showing.
26. **Site-wide pricing is now MRP by default, everywhere — the only way a price ever comes down is
    a coupon entered at checkout.** `priceView()` used to auto-apply a discount two ways: a
    time-limited "early bird" price on the two bundles, and a permanent lower price on Additional PI
    for enrolled students. Both are gone; `payablePaise` is now simply the product's MRP (or
    `pricePaise` for the handful of singles that have no MRP at all). This was an explicit, repeated
    instruction ("everything on site stays at MRP... make everything MRP basically"), confirmed to
    cover Additional PI too even though that one wasn't a "discount," just a different mechanism
    built on the same two fields — the site no longer distinguishes them. `pricePaise`/`mrpPaise`
    themselves are untouched in the catalog; only what's displayed/charged by default changed. The
    "Need another mock?" panel on `/student/payments` (which advertised the now-gone automatic
    discount) was removed; Additional PI now just appears in the generic Top Up list at its MRP like
    every other enrolled-only item.
27. **Every mentor gets a unique, auto-generated referral coupon — the whole feature reuses the
    existing Coupon/Order machinery, no new tracking table.** `Coupon` got one new nullable column,
    `mentorId` (unique). A mentor's code is a completely ordinary coupon underneath: same discount
    type/value, same `usedCount`, same `checkCoupon()` validation, same increment-on-payment in
    `fulfilOrder` — so "which mentor referred which student for what" is just `Order.couponId ->
    Coupon.mentorId`, nothing bespoke to maintain or get out of sync.
    - **Code shape**: 8 characters, always — 5 letters from the mentor's own name (3 from first, 2
      from last, padded with `X` for a short or single-word name) + 3 random digits, retried on a
      real DB collision (checked, not assumed) up to 50 times. Two mentors named "Rohit Kulkarni"
      get `ROHKU` + different digits, not a colliding code — verified with unit tests, including the
      collision-retry path.
    - **Created automatically** the moment a `MentorProfile` row is created — direct add, a promoted
      application, and an accepted invite — inside the same transaction, so a mentor can never exist
      without one. Admin's own "mentor mode" profile (`isAdminMentor`) deliberately doesn't get one;
      there's no one for the owner to refer. Default discount: 10%, same as any other coupon — change
      it per mentor from `/admin/products` like any other coupon if you ever need to.
    - **Backfilled once for the 7 mentors that already existed** before this shipped, so the feature
      works immediately across the whole current roster, not just future mentors.
    - **Visibility, exactly as specified**: a mentor's own `/mentor/profile` shows their code and a
      plain count ("3 students used it") — nothing about who. Admin sees everything: `/admin/mentors`
      lists a referral count per mentor, and each mentor's own page (`/admin/mentors/[id]`) has a full
      "Referrals" panel — code, total, and an itemized table of student, service, date and amount
      paid. Mentor-owned coupons are deliberately left out of the generic `/admin/products` coupon
      list (they live on the mentor pages instead) so that list doesn't fill up with one row per
      mentor.
    - **Where a coupon can be entered**: the public guest checkout already had a coupon field;
      `PortalBuy` (in-portal purchases — Additional PI, top-ups) didn't, so one was added there too,
      since the ask was explicitly "any purchase."
    - Verified live end-to-end (not just unit tests): applied a real backfilled mentor code at
      checkout and watched the 10% discount compute correctly against the new MRP base; inserted a
      completed order using that code and confirmed it shows up correctly on both the admin mentor
      detail page (itemized) and the mentor's own profile (count only); confirmed mentor coupons are
      absent from the generic admin coupon list.
    - **Not live-tested**: a brand-new mentor's coupon being created at the moment of "Add mentor
      directly," because the demo admin account is correctly blocked from that config-writing action
      (the same guard already protecting every other mentor-creation action) — no real admin account
      exists yet in this deployment to test through. Covered instead by unit tests on the exact
      generation logic plus the backfill script running the identical algorithm successfully against
      the live database.
28. **Pricing is now genuinely three-tier — this reverses part of item 26 above, on purpose, per a
    direct follow-up request.** Item 26 made every price default to MRP; this walks that back to a
    richer model: MRP (struck through) -> `pricePaise` (shown/charged by default, no coupon) ->
    `Product.mentorPricePaise` (new column, nullable) — an exact target price a mentor's own coupon
    charges for that specific product, overriding the coupon's own percent/flat math. `checkCoupon()`
    takes an optional `mentorPricePaise` now: if the coupon being used belongs to a mentor AND the
    product has one set, the discount is whatever reaches that exact price; otherwise every coupon
    (mentor or not) behaves exactly as before. This is opt-in per product, not special-cased to the
    two bundles — any product can get a `mentorPricePaise` from Admin > Products, which is also where
    `pricePaise`/`mrpPaise` are edited, so all three tiers live in one place.
    - **The two bundles, set to the requested numbers**: Call Convert Plus 4999 -> 3999 -> 2999 (with
      a mentor code); Call Convert 2999 -> 2599 -> 2199. Updated on the live `Product` rows directly
      (not just seed-data.ts, which only seeds a fresh database) and in seed-data.ts for consistency.
    - **Additional PI reverts fully to its original, correct behaviour**: 449 automatic for any
      enrolled student (pricePaise), 599 otherwise (mrpPaise) — restored by the priceView() revert
      alone, no special-casing needed. This was never a promotional discount; flattening it in item 26
      was a mistake, caught and corrected here.
    - **Mentors can edit their own coupon's code** (4-16 alphanumeric characters, checked against the
      live database for a collision — not assumed unique) from `/mentor/profile`. Verified live: a
      real code change persisted, and trying to steal another mentor's existing code was correctly
      rejected with "That code is already taken."
    - **Admin has complete control over any mentor's coupon** — code, type, value, a use cap, and
      active/inactive — from that mentor's own `/admin/mentors/[id]` page, the same place admin
      already views everything else about them. Reuses the identical `assertConfigWritable` guard
      every other config-mutating admin action already has; confirmed the demo admin is correctly
      blocked from it, same as from creating a mentor or editing a product.
    - Verified live end-to-end: Call Convert with a real mentor code computed to exactly 2199 (not a
      generic percent off 2599); the same code on a product with no `mentorPricePaise` set (Mock
      GD/GE) correctly fell back to the mentor's own 10%; the admin Products page shows all three
      price columns pre-filled with the real values for every product.
29. **Coupon list cleaned up: removed `WELCOME10` (unused — zero orders ever referenced it, confirmed
    before deleting), added one generic `TEST90` (90% off, for your own testing).** The Admin >
    Products "Coupons" panel now lists every coupon, generic and mentor-owned, in one place —
    previously mentor coupons were deliberately kept off this page; that turned out to be the wrong
    call once there was a real "where do I see all of this" need. Sorted by how much each has
    actually been used, each mentor row links straight to their own page. Admin's full per-mentor
    view (`/admin/mentors/[id]`'s "Referrals" panel: code, total referred, an itemized student/
    service/date/amount table) and the quick per-mentor count on the `/admin/mentors` list were
    already built — this was about making the aggregate view discoverable, not adding new tracking.

30. **Receipt download links fixed; contact page, calendar invites, welcome email, guaranteed video room.**
    - *Receipt links broke for two reasons:* they were `next/link` (prefetch / client navigation is the
      wrong tool for a file), and every render of the success page deleted the order's previous
      download token, so any refresh or router refresh invalidated the link already on screen. They are
      now plain `<a download>` (`ButtonAnchor`), and issuing a token only prunes *expired* ones.
    - */contact* (+ `/api/contact`): rate-limited (5/hour/IP), honeypot field, emails the owner with
      reply-to = the sender and sends the sender an acknowledgement. Nothing is stored beyond `EmailLog`.
    - Booking confirmations (student + mentor) carry an `.ics` calendar invite (`src/server/ics.ts`,
      hand-written RFC 5545, no dependency).
    - `welcome_account` email now actually sends, once, when a student verifies their email.
    - Every session gets a working Join link: if a mentor hasn't pasted one, `ensureMeetingUrl` creates
      a private Jitsi room named after the session id (free, no account, no API key).
    - Reminder windows now overlap (24h = anything not yet reminded in the next 25h) because GitHub's
      free `*/5` timer actually fires only every few hours; Vercel Hobby also runs daily backstop crons
      (reminders 18:00 IST, hold-expiry 08:30 IST). CI build now supplies placeholder env so it passes.

31. **Mentor ratings on the public page, a mentor leaderboard, and opt-in credit expiry.**
    - *Public mentor cards* show an average rating (only once a mentor has 3+ ratings, so one review
      never defines them) and the number of sessions run. Never tier or pay. Student comments are not
      shown publicly (they didn't consent to that).
    - *Mentor leaderboard* on the mentor dashboard: last 30 days, ranked by completed sessions then
      rating; shows first name + last initial only, never earnings or tier. Demo and real mentors never
      appear on the same board.
    - *Credit expiry exists but is OFF* (`creditValidityDays: 0`). It removes paid value from
      customers, and the Terms say nothing about expiry, so switching it on is a legal/policy call for
      you, not a default. When on (Admin > Settings): oldest unspent credits expire first, booked
      sessions are never touched, students get a warning email N days before (default 14) and a notice
      after. Runs daily via `/api/cron/credit-expiry`; the ledger row reads "Credit expiry: ...".
      **Before turning it on, add a validity line to Terms and the FAQ.**

32. **Real legal documents, and nobody gets in without agreeing to them.**
    - *Four documents*, drafted for Indian law: Terms of Use, Privacy Policy (DPDP Act 2023), Refund
      Policy, and a new Mentor Agreement. Numbers that Admin can change (refund window, notice period,
      feedback deadline, recording retention) are filled in from Settings, so the text can't contradict
      the product. Source: `src/lib/legal-text.ts`.
    - *Where agreement is collected* (all recorded with document, version, time, IP, user agent in
      `LegalAcceptance`, append-only): student signup checkbox; checkout checkbox (stored on the Order as
      the contract record, then copied onto the account when the guest becomes a student); mentor
      application checkbox; and a **gate** (`requireRole` -> `/accept-terms`) that catches every other
      way in (Google, login link, invite, existing users) and re-asks everyone when `LEGAL_VERSION`
      changes in `src/lib/legal.ts`. Mentors must additionally confirm their background is true.
    - *Existing real users* (current students and mentors) have no record, so they are asked once at
      their next sign-in. Demo accounts and admins are never asked.
    - *Admin sees proof* on each student's and mentor's page ("Terms accepted").
    - *Operator and venue (confirmed by the owner):* "Samrudh Dhaimodkar, sole proprietor, trading as
      The Convert Club"; disputes and arbitration are seated in Goa. Both live in `src/lib/business.ts`.
      If this ever becomes a company/LLP, change `operator` and bump `LEGAL_VERSION` in `src/lib/legal.ts`.
      (Version bumped to 2026-10-04 for this change.)
    - **This is a thorough draft, not legal advice.** Have an Indian advocate review it before taking
      real money, especially the liability cap, the non-solicit (12 months), the arbitration clause and
      the mentor "independent contractor" classification.

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
| 14 | Mentors page contents | Photo, name, college, bio, plus (once earned) a rating average and session count. Never tier or pay. | `getPublicMentors` |
| 15 | GST | Off by default (`gstEnabled: false`). Needs a CA decision before it is switched on. | `settings.ts` |
| 16 | `middleware.ts` | Next.js 16 renamed it `proxy.ts`. Route guards will use `proxy.ts`. | Phase 1 |
| 17 | Recording / refund claims in copy | Copied from the design ("recording available 90 days", "refundable within 48 hours if no credit used"). Recordings are not in the build spec; confirm you offer them. | `content.ts` |
| 19 | Vercel env vars | `AUTH_SECRET`, `CRON_SECRET`, `ADMIN_EMAIL` (Sensitive, generated/set) on Production+Preview. `NEXT_PUBLIC_APP_URL` deliberately left **unset** — `appUrl()` auto-resolves to the real live URL instead (see item 3). Third-party keys are added with `scripts/set-vercel-env.sh`, never through chat. | Vercel |
| 18 | Copy claims about mentors | "Converted in 2024 or 2025", "screened and trial mock" are design copy. Confirm they are true or the FAQ overstates. | `content.ts` |

## Where the prompt and the design disagreed

Behaviour follows the prompt; looks follow the design. Differences are listed in
`docs/DESIGN_MAP.md` under "Things in the design that could not be implemented as drawn".
