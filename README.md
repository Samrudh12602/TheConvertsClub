# The Convert Club

GDPI (MBA group discussion and personal interview) prep platform for convertsclub.in: a public
marketing site plus Student, Mentor and Admin portals behind one login.

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Zod · React Hook Form · Vitest.
Planned: Prisma + Neon Postgres, Auth.js, Razorpay, Resend, Vercel Blob, Vercel Cron.

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
| 0 Foundation | Tokens, fonts, UI primitives, CI, docs: **done**. Portal shells: **pending** (portal designs not yet read). |
| 1 Auth and roles | Not started (login UI exists, unwired) |
| 2 Public site and payments | Public site **built**. Razorpay, DB-backed catalog, webhooks, credits, welcome email: **pending** |
| 3-7 | Not started |

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
