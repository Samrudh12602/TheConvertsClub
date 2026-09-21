# Design map

Source: Claude Design project "Scope, fidelity, and positioning questions"
(`579117ee-edaa-498d-9a8e-8ddf4a89ea0b`). Files: `Public Site`, `Student Portal`, `Mentor Portal`,
`Admin Portal`, `Handoff - Tokens, Components, Emails` (all `.dc.html`).

**Read so far:** Public Site, Handoff. **Not yet read:** the three portal files. The route table
for portals below comes from the Handoff's own screen map and is *unverified against the portal
files* until Phase 0 completes the shells.

## Tokens

Implemented in `src/app/globals.css` (Tailwind v4 `@theme`). Colours, radii, type scale and the
"no shadows, 1px line" rule come straight from the Handoff. Fonts: Bricolage Grotesque (headings,
meaningful numbers) and Archivo (everything else) via `next/font`.

## Public site and auth

| Route | Design screen | Status | File |
| --- | --- | --- | --- |
| `/` | Home, direction **B** (price-forward) | Built | `src/app/(public)/page.tsx` |
| `/packages` | Two bundle cards + single-service grid | Built | `.../packages/page.tsx` |
| `/services` | What we actually do | Built | `.../services/page.tsx` |
| `/how-it-works` | Five steps | Built | `.../how-it-works/page.tsx` |
| `/mentors` | Who takes your mock | Built (demo data outside production) | `.../mentors/page.tsx` |
| `/results` | Results | Built (placeholders outside production) | `.../results/page.tsx` |
| `/faq` | Questions | Built | `.../faq/page.tsx` |
| `/become-a-mentor` | Recruitment + application form | UI + validation built; **not persisted** (needs DB) | `.../become-a-mentor/page.tsx` |
| `/checkout` | Guest details, coupon, sticky order panel | UI + validation built; **no payment yet** (needs Razorpay) | `.../checkout/page.tsx` |
| `/checkout/success` | You're in | Presentational; **demo-only** until real orders exist | `.../checkout/success/page.tsx` |
| `/login` | One login for all roles | UI + validation built; **not wired** (Phase 1) | `.../login/page.tsx` |
| `/invite/[token]` | Not drawn: login card, mentor heading | Built as specified in handoff | `.../invite/[token]/page.tsx` |
| `/terms` `/privacy` `/refunds` | Legal | Built, one route each | `.../terms|privacy|refunds` |

## Portals (Phase 0 shells, Phase 3+ screens)

Not started. Route list is in the Handoff "Screen map" tab: Student (13 routes), Mentor (10, of which
`/mentor/sessions/[id]` is "not drawn, reuse feedback screen locked"), Admin (17). Each will be
mapped here after reading its design file.

## Things in the design that could not be implemented as drawn

| Design | What was built | Why |
| --- | --- | --- |
| Home direction **A** (countdown) | Not built | The Public Site file has direction A removed (`isHomeA: false`, block absent). Only B exists. |
| 8 nav buttons wrap to several rows on phones | Menu button under 768px | Wrapping eight items to three rows at 375px is unusable. Same links, same order. |
| Static field boxes (`<div>` styled as inputs) | Real `<input>`s with the same styling, visible labels, error messages | Design mock-ups aren't forms. 16px text under 768px to stop iOS focus-zoom. |
| Checkout coupon shown pre-filled `EARLY20` "applied" | Early-bird shown as automatic pricing, coupon box starts empty | The design mixes early-bird pricing and a coupon code. They are separate mechanisms in the spec. |
| Hero display size `clamp(28px,4.2vw,44px)` on Home vs Handoff `clamp(32px,5.4vw,58px)` | Followed the Home screen | Screen beats token sheet where they disagree. |
| Label size 10px on screens vs 10.5px in Handoff | 10.5px | Token sheet. Slightly larger is safer for legibility. |
| Card radii 11/13/14px scattered on screens | 12px cards (14px on the home hero) | Token sheet: "12px, cards on public and student". |
| Footer had one "Terms & privacy" link | Separate Terms, Privacy, Refunds links | Three routes exist. |
| No focus styles | 2px oxblood focus ring, skip link | WCAG AA. |
| Placeholder mentors/results/testimonials rendered as real | Shown only outside production, with a notice; production shows an honest empty state | The prompt says demo data is non-production only. |
