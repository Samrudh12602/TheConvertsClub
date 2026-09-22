# The Convert Club

GDPI (MBA group discussion and personal interview) prep platform for convertsclub.in: a public
marketing site plus Student, Mentor and Admin portals behind one login.

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Zod · React Hook Form · Vitest.
Prisma + Neon Postgres · Auth.js (Google + email link + gated demo login) · Razorpay · Resend ·
Vercel Blob · Vercel Cron + GitHub Actions cron.

**Live:** https://the-converts-club.vercel.app — public site, and all three portals (Student, Mentor,
Admin) behind one login. Demo logins for all three roles: see `docs/DECISIONS.md` for how to get the
passcodes. Real payments (Razorpay) and real email (Resend) need API keys added via
`scripts/set-vercel-env.sh` — until then, checkout and login-by-email say plainly that nothing was
sent or charged, they never fake success.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run check` | Typecheck, lint, tests (run before every commit) |
| `npm test` | Vitest |
| `npm run build` | Production build |

Set `APP_ENV=production` to see the site with demo content hidden.

## Status

| Phase | State |
| --- | --- |
| 0 Foundation | Tokens, fonts, UI primitives, CI, docs: **done**. |
| 1 Auth and roles | **Done.** Auth.js (Google, email magic link, gated demo login), role guards (proxy + server + query scoping), mentor invites, audit logging. |
| 2 Public site and payments | **Done.** DB-backed catalog, Razorpay orders + webhook (idempotent, signature-verified), credit ledger, welcome email, coupons, early-bird pricing. |
| 3 Scheduling core | **Done.** Availability windows → 1-hour slots, holds with expiry, booking, assignment rules (tier, load-based), GD batches + waitlist, cancel/reschedule policy, reminders (24h/1h). |
| 4 Feedback and progress | **Done.** Mentor feedback form, WAT/SOP async reviews (private file uploads), student feedback reports, progress view, calls tracker, ratings. |
| 5 Money | **Done.** Payout accruals (rate-snapshotted), milestone bonuses, payout runs, manual mark-paid, refunds (credit-reversing), coupons, expenses, Finance dashboard, mentor earnings. |
| 6 Admin power tools | **Done**, except: no drag-and-drop scheduler timeline (list-based allocation board instead) and no "View as" impersonation (360 detail pages substitute) — both documented in `docs/DESIGN_MAP.md`. 2FA and a command palette are not built. |
| 7 Hardening and launch | **Partially done.** Rate limiting, CSRF (Auth.js default), security headers, `noindex` on portals, encrypted payout fields, file-type sniffing are in. No Playwright e2e suite, no formal accessibility or performance pass yet. |

## Deploy

Vercel project `the-converts-club`, connected to `Samrudh12602/TheConvertsClub`. **Auto-deploy-on-push is
unconfirmed** — a push to `main` did not trigger a build in testing (see `docs/DECISIONS.md`); until that's
fixed, ship with:

```bash
vercel --prod --yes
```

Add third-party keys with `scripts/set-vercel-env.sh <preview|production>` (hidden prompts, stored as
Sensitive). Use Razorpay TEST keys on `preview`; live keys only at go-live. Frequent cron jobs
(hold-expiry, reminders) run via `.github/workflows/cron.yml`, not Vercel Cron — Hobby-plan accounts only
allow daily Vercel Cron schedules, so only the once-daily bonus-period-close job uses it.

## Layout

```
src/app/(public)/     marketing site, checkout, login, legal
src/components/ui/    design-system primitives (Button, Card, Field, Pill, Notice)
src/components/site/  public-site components
src/lib/              catalog, settings, money (paise), IST dates, validation, copy
docs/                 DESIGN_MAP.md, DECISIONS.md
```

Money is integer paise, shown with Indian grouping. Timestamps are UTC, shown in IST.
Read `docs/DECISIONS.md` first: it lists every assumption and what blocks go-live.
