---
name: سیرکل
description: Trust-path market that feels like a sitting room, not a stall.
colors:
  plum: "#4a3a8f"
  plum-deep: "#3c3075"
  plum-mid: "#5f4aa8"
  plum-wash: "#f3f1fa"
  canvas: "#ebe8e3"
  surface: "#fffcf8"
  ink: "#1a1816"
  ink-muted: "#534e4a"
  ink-faint: "#5f5a55"
  trust: "#1f6b42"
  trust-b: "#3b6ea5"
  trust-c: "#c27a2d"
  canvas-dark: "#121110"
  surface-dark: "#1c1b19"
  ink-dark: "#f2efe9"
typography:
  headline:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  nav:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
    lineHeight: 1.4
  table:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  kpi:
    fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.125rem"
  pill: "999px"
spacing:
  xs: "0.28rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.plum}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  button-primary-hover:
    backgroundColor: "{colors.plum-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  chip:
    backgroundColor: "{colors.plum-wash}"
    textColor: "{colors.plum-deep}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.5rem"
  nav-active:
    backgroundColor: "{colors.plum-wash}"
    textColor: "{colors.plum-deep}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
---

# Design System: سیرکل

## Overview

**Creative North Star: "اتاق نشیمن آشنا"**

Circle should feel like walking into a familiar sitting room: warm stone underfoot, cream plaster walls, plum only where a hand would reach for a door. It is intimate and Persian. It is not a stall, not a SaaS dashboard skin, and not a cool-gray marketplace.

The member app is a 480px phone column — airy, one family of type, trust colors used as meaning. The admin desk uses the same room at a tighter density: more numbers per glance, side-by-side inspector, no new palette. Dark theme is the same room after dusk, not a different brand.

**Key Characteristics:**

- Warm limestone canvas and cream surfaces; never cool marketplace gray
- One accent (sitting-room plum) for action, selection, and charts
- Vazirmatn only; no display serif, no English UI chrome
- Two densities, one identity: airy phone app, compact RTL admin
- Flat surfaces at rest; depth is tonal, not theatrical shadow

## Colors

Warm stone + one plum. Trust greens/blues/ambers are semantics, not decoration.

### Primary
- **Sitting-room plum** (`plum`): the only action color — primary buttons, selected nav, chart fills, switches on. Rarity is the point.
- **Plum deep** (`plum-deep`): hover/press of the same action.
- **Plum mid** (`plum-mid`): dark-theme brand and focus ring (`#5f4aa8`).
- **Plum wash** (`plum-wash`): selected rows, active tabs, KPI on-state. A tint, not a fill.

### Secondary
- **Closest trust** (`trust`): trust level A and “connected” health. Garden green, not success-toast chrome.
- **Acquaintance steel** (`trust-b`): trust level B.
- **Clay amber** (`trust-c`): trust level C — farther, warmer, weaker.

### Neutral
- **Limestone floor** (`canvas`): page background.
- **Cream plaster** (`surface`): cards, sidebar, inputs.
- **Walnut ink** (`ink`): body text.
- **Stone mute** (`ink-muted`): secondary labels.
- **Dusted stone** (`ink-faint`): captions; still ≥4.5:1 on cream.
- Dark counterparts: `canvas-dark`, `surface-dark`, `ink-dark`.

**The Action-Only Plum Rule.** Plum is for things you can press or things that are currently chosen. It is never body copy and never a page wash.

**The Warm Stone Rule.** Neutrals stay warm (stone, cream, walnut). Do not introduce blue-gray marketplace chrome.

## Typography

**Display Font:** none. Product UI does not pair a display face.
**Body Font:** Vazirmatn (`--font-vazir`), with system-ui fallback.
**Label/Mono Font:** same family; `font-mono` only for phones, emails, invite codes (dir=ltr).

**Character:** One well-tuned Persian sans. Headings are the same cut, slightly heavier. Tracking stays near zero. Numerals are Persian digits in UI copy and tabular in data.

### Hierarchy
- **Headline** (600, 20px, 1.25): page titles (داشبورد، رشد، کاربران). `text-wrap: pretty`.
- **Title** (600, 14–15px): card and section titles.
- **Body** (400, 13–14px, 1.6): member prose and admin rows. Member measure can run denser than 75ch; admin tables may exceed it.
- **Label** (500, 11–12.5px): tabs, table headers, captions, pills.

**The One-Family Rule.** Do not add a second typeface for “admin” or “data.” Weight, size, and tabular-nums do the work.

## Layout

Two spatial contracts, one brand.

**Member app:** `.app-shell` is a centered 480px column on a limestone field. Mobile-first. Bottom nav. Stacked cards with generous vertical rhythm (`1rem` inside, `1.25rem` between groups).

**Admin desk:** `.admin-shell` is a sticky 15.25rem sidebar + fluid main, content capped at 80rem. RTL: content hugs the sidebar (inline-start). Breakpoints that actually exist: 860px (sidebar becomes top nav), 1024px (list + inspector split), 1100px (growth/dashboard two-column), 1280px (wider inspector).

Spacing rhythm is 4-based with a useful middle: 0.28 / 0.5 / 1 / 1.25 / 2rem. Tight inside a control group; generous between cards.

**The Two-Densities Rule.** Do not stretch the member phone column into a desktop marketing layout. Do not ship admin as stacked mobile cards on a wide desk. Same colors; different topology.

## Elevation & Depth

Mostly flat. Depth is a change of surface (canvas vs plaster), a 1px warm hairline, or a selected plum wash. Shadows are rare and structural.

### Shadow Vocabulary
- **Card rest** (`0 1px 2px rgba(26,24,22,0.04)`): listing/request cards in the member app.
- **Phone shell** (`0 0 40px rgba(26,24,22,0.06)`): the 480px column floating on the desktop canvas.
- **Bottom nav** (`0 -1px 16px rgba(26,24,22,0.06)`): member tab bar.
- **Admin savebar** (`0 8px 24px rgba(26,24,22,0.08)` plus blur): sticky unsaved settings only.

**The Flat-at-Rest Rule.** Idle admin panels and KPIs have no drop shadow. A halo with zero offset is decoration; do not add it.

## Shapes

Soft sitting-room geometry: large plaster cards, pill filters, squircle marks.

- Cards and admin panels: 1.125rem (`rounded.lg`).
- Inputs, buttons, nav links: 0.75rem (`rounded.md`).
- Pills, switches, funnel tracks: full pill.
- Hairline borders: `rgba(26,24,22,0.07–0.16)` on light; white at ~8–10% on dark. No accent bar on the inline edge of cards.

## Components

### Buttons
- **Shape:** 0.75rem corners, compact padding (`0.5rem 0.75rem`). `touch-action: manipulation`.
- **Primary:** plum fill, white label, hover plum-deep. Used for the one irreversible or confirming act (ارسال، بررسی شد، ذخیره).
- **Secondary:** plaster fill, 1px stone hairline. Export, filters, “مسدودها”.
- **Hover / Focus:** hover is a background shift, not a lift. Focus is a 2px plum-mid ring, 2px offset, `:focus-visible` only.
- **Active:** 0.5px translateY. Disabled: 40–60% opacity.

### Chips
- **Style:** pill, 11px, plum-wash + plum-deep for selected/ok; red wash for warn; stone wash for muted.
- **State:** status only (کامل، مخفی، زنده). Not a second navigation.

### Cards / Containers
- **Corner Style:** 1.125rem plaster.
- **Background:** surface on canvas.
- **Shadow Strategy:** none on admin; card rest on member listings.
- **Border:** 1px warm hairline.
- **Internal Padding:** 1rem typical; denser `px-4 py-2` for admin stat lists.

### Inputs / Fields
- **Style:** full-width, 0.75rem, 1px stone stroke, plaster fill, 14px.
- **Focus:** plum-mid ring, no glow.
- **Error / Disabled:** error is inline red copy next to the field; disabled is 0.45 opacity on switches.

### Navigation
- **Member:** bottom tabs, icon + label, active in plum.
- **Admin:** sticky end-side rail, 13.5px links, active plum-wash. Below 860px the rail becomes a horizontal scroller. `aria-current="page"` on the active item.

### Admin signature
- **KPI tiles:** 1.45rem tabular number + 12px label; selected = plum wash + plum hairline. They are the chart’s metric switch, not hero metrics for decoration.
- **Day bars:** plum fills, value above non-zero days, denser 30-day labels skip evens.
- **Funnel rows:** hairline track, plum fill from inline-start, optional % beside the count.
- **Split lists:** table + 22.5–25rem inspector; sticky thead; inspector sticky.

## Do's and Don'ts

### Do:
- **Do** keep plum for press/selection and trust colors for A/B/C meaning.
- **Do** set `dir="ltr"` on phones, emails, and invite codes; keep surrounding UI RTL.
- **Do** use Persian digits in labels and `tabular-nums` in tables and KPIs.
- **Do** collapse admin to a top scroller at 860px and split list/inspector from 1024px.

### Don't:
- **Don't** use a second typeface, gradient text, or glass blur as decoration.
- **Don't** put a thick colored bar on the inline edge of cards or rows.
- **Don't** treat the member 480px shell as a desktop marketing page, or the admin desk as stacked marketing cards.
- **Don't** invent cool-gray neutrals or a second accent “to make admin feel like software.”
- **Don't** lock zoom or hide focus rings.
