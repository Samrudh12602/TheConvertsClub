# The Convert Club — platform prototype

"You got the call. Now let's convert it."

A high-fidelity, clickable prototype of the full Convert Club platform: the public marketing
site, a single login, and three role-based portals (Student, Mentor, Admin). Built with
Next.js (App Router), TypeScript and Tailwind CSS v4, using mocked/sample data throughout —
there is no real backend, payment gateway or auth provider wired up.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**, **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **lucide-react** for icons
- No external UI kit — every component in `src/components/ui` is hand-built to the design
  system tokens in `src/app/globals.css`

## Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

- `npm run build` — production build
- `npm run lint` — ESLint

## Structure

```
src/
  app/
    (marketing)/     Public site — home, packages, services, mentors, results, FAQ,
                      become-a-mentor, checkout, legal templates
    (auth)/           Single login, mentor invite acceptance, forgot password
    student/          Student portal (onboarding, dashboard, booking, sessions, progress, …)
    mentor/           Mentor portal (dashboard, availability, sessions, feedback, earnings, …)
    admin/            Admin portal (command center, scheduler, students, mentors, finance, …)
    design-system/    Developer-facing design system reference page
  components/
    ui/               Design system primitives (Button, Card, StatusChip, SlotChip, DataTable, …)
    marketing/        Marketing-site-specific components (header, footer, logo, FAQ accordion)
    portal/           Shared portal chrome (topbar, impersonation banner)
    theme/            Light/dark theme provider + toggle
  lib/
    data.ts           All sample/mock data (students, mentors, sessions, packages, payouts, …)
    format.ts         INR + deterministic date formatting helpers
```

## Notable prototype conventions

- **Demo login** — `/login` includes a "Demo accounts" strip (Student / Mentor / Admin) that
  logs straight into each portal, since there's no real auth. The Admin path also demonstrates
  the two-factor step.
- **Mentor tier (Senior/Junior)** is only ever rendered inside the Mentor portal (visible to
  that mentor only) and the Admin portal — never on the public site or in the Student portal,
  per the platform's confidentiality rule.
- **Impersonation** — Admin's "View as student" / "View as mentor" and "Mentor mode" links
  route to the respective portal with an `admin_view` query param, which renders a persistent
  read-only banner at the top of that portal.
- **Payments** — Checkout simulates a Razorpay redirect and both success/failure outcomes;
  nothing is actually charged.
- **Dates/times** — all times are IST, 1-hour session slots, 12-hour display format.
- Light and dark themes are implemented for every screen (toggle in the top bar); dark mode
  uses the gold-on-navy identity, light mode uses the ivory portal surface.

## Design system

Tokens (color, type scale, spacing, radii, elevation), and every component with its states,
are documented at `/design-system` — meant as the one-to-one developer handoff reference.
