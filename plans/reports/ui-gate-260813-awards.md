# UI-First Gate — awards (/awards) — PASS

Context: i18n crash fix — `kudos-promo.tsx` (`KudosPromo`, rendered by both the `'use client'`
homepage tree and the server `awards-showcase.tsx`) switched from server-only `getTranslations`
to isomorphic `useTranslations`. Change is i18n-mechanism-only (no visual value changed).

Gate method: `/awards` is an authed route; the automated `capture-code.mjs` launches an
unauthenticated browser (redirects to `/login`), so it cannot gate authed screens (all 5 authed
screens report all-elements-MISSING under regate — a harness limitation, not a code defect).
Gated manually via the skill's Step 3 flow: authed Playwright MCP session (storageState cookie
injected) + live `getComputedStyle` read → `style-assert.mjs` against the MoMorph design side.

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280
- **`style-assert` verdict: PASS @1440** — elements=7, checks=19, failed=0 (exit 0).
  Map: `/tmp/awards.merged.1440.json` (live code vs `plans/reports/_gate-ref/nodemap/awards.map.json` design).
- **`style-assert` verdict: PASS @1280** — elements=7, checks=17, failed=0 (exit 0).
  Design: `plans/reports/_gate-ref/nodemap/awards.map.1280.json`.
- KudosPromo nodes (the only awards element this change touches): `kudos-h2` color rgba(255,234,158,1) · weight 700 · size 57 · lineHeight 64 · letterSpacing -0.25 — all PASS; `kudos-section` height 500 vs design 500 — PASS.
- Nets: no horizontal overflow @1280 (1269=1269). Density: h1-title, awards-nav, further-logo(IMG), award-h2-title, page-root bg rgba(0,16,26,1), kudos-section all present + matching.
- No-break @1920: `scrollWidth==clientWidth` (1909=1909); kudos-section stable at 500px (no zoom); awards-nav present. No break.
- Port verified: localhost:3001 (authed) · font.check('700 16px Inter')=true.

## B. Behavior (real seeded data, authed session) — 100%
- [x] `/awards` renders authed (HTTP 200, no redirect), title "Sun* Annual Awards 2025".
- [x] KudosPromo present (`[data-fig='335:12023']` count=1); Further logo `<img>` present (count=1).
- [x] **0 console errors** at 1440 / 1280 / 1920 (Playwright).
- [x] Awards nav + award cards + KudosPromo render i18n text correctly (isomorphic `useTranslations`).
- Evidence: `plans/reports/_gate-ref/awards-1440-authed.png` (fullPage, authed).

## Verdict: PASS
