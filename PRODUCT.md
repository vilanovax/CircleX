# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Members** are Persian-speaking people in Tehran (and nearby cities such as Karaj) who already know each other — family, friends, colleagues, acquaintances. They use Circle on a phone, in RTL, to buy, sell, give, borrow, request, and gather **inside a trusted circle**, not among strangers.

**Operators** are a small ops staff (مدیر کل, ناظر, پشتیبانی, تحلیل‌گر) who sit at a desk and run the same product from `/admin`: queues, invites, reports, content, broadcasts, settings. They are a first-class audience, not an afterthought.

## Product Purpose

سیرکل (Circle) is a trust-based social market: listings, wants, and events reach you along a **path of trust**, not a public classifieds feed.

Success for a member is: I can act with people I can place, through a visible chain of relationships. Success for an operator is: I can see growth, clear queues, and keep the network honest without becoming another Divar backoffice.

## Positioning

On Divar and Sheypoor, people are strangers. On Circle, every listing arrives through a trust path (فروشنده ← … ← شما). Visibility is gated by circle membership, invite, and trust level (A / B / C). That mechanism is the product; a neighboring marketplace cannot copy it without becoming a circle.

## Operating Context

- Member surface is **mobile-first**, served under `/circle`, Persian (`lang="fa"` `dir="rtl"`), installable as a PWA.
- Operator surface is **desktop-first** at `/admin`, same origin and brand, denser layout.
- City catalog is live (تهران is the default operating city). Invites are personal or wave. Join requests wait on a host.
- Auth is phone OTP (Kavenegar when configured). Operators sign in with email/password and role-scoped access.
- Trust is not a scoreboard costume: it changes what is visible, locked, or hidden in the feed.

## Capabilities and Constraints

Confirmed:

- Listings (فروش، خدمات، اهدا، معاوضه، قرض), want-requests with offers, events with RSVP, DMs, saved items, public person profiles, trust graph.
- Invite links, join requests, listing reports, content hide/show, broadcasts to Circlo inbox, live app flags and catalog.
- Admin roles: superadmin, moderator, support, analyst (analyst cannot see user phones/PII exports).
- Dark theme (light / dark / system). Vazirmatn. Base path `/circle`.

Constraints:

- Persian copy and RTL are non-negotiable. Latin is for codes, phones, emails.
- Brand plum is for action and selection, not body text.
- Member chrome stays a phone column; admin uses the wide desk.

Undecided (do not invent):

- Whether Circle will operate outside Iran, or add a non-Persian locale.
- Public marketing site vs in-app-only.

## Brand Commitments

- Name: **سیرکل** (Circle). Tagline in metadata: «خرید و فروش بین خانواده، دوستان و آشنایان — فقط حلقه‌ات.»
- Voice: direct, familiar Persian. Controls name the action. No marketplace hype, no English UI chrome.
- Identity: warm stone interiors, deep indigo-plum for action, garden green for closest trust. Intimate, not a cool gray classifieds site.
- Visual metaphor (confirmed): **اتاق نشیمن آشنا** — like a sitting room, not a market stall.

## Evidence on Hand

- Live product code: Next.js app, Prisma backend, admin console, real invite/report/content flows.
- Copy and labels: `lib/labels.ts`, `lib/admin-labels.ts`.
- Tokens: `app/globals.css` (`--circle-*`), `tailwind.config.ts` (brand, ink, canvas, trust levels).
- README.md still describes an earlier localStorage prototype; **do not treat it as current architecture.** Do not fabricate testimonials, press, or user quotes.

## Product Principles

1. **Trust is the feed.** If a listing has no path to the viewer, it is hidden or locked — not merely ranked down.
2. **One product, two densities.** Members get air and intimacy; operators get scanable density. Same brand, different job.
3. **Persian first.** Numbers, dates, and UI speak fa-IR. Identifiers stay Latin.
4. **Warm, not marketplace.** Stone, cream, plum. Never cold gray stall chrome.
5. **Small honest ops.** The admin panel exists so a few people can keep the circle healthy, not to scale anonymous inventory.

## Accessibility & Inclusion

- Body and secondary text must keep ≥4.5:1 on cream/canvas (ink faint is `#5f5a55` for that reason).
- `prefers-reduced-motion` disables decorative motion.
- Visible `:focus-visible` rings on controls. RTL and Persian wrapping must not clip actions.
- Zoom and font scaling are allowed; do not lock `user-scalable`.
