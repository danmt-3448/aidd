# Performance Audit & Safe Improvement — Report

Date: 2026-08-15 · Branch: `develop` · Deploy target: **Vercel** · No commit/push (working-tree only)
Spec: `plans/260815-1104-performance-audit-and-improve/spec.md` · Plan: `.../plan.md`
Risk policy honored: **config-safe / high-safety — no business-logic or UI-behavior change.**

## TL;DR

The app was already well-optimized (Tiptap lazy-loaded, 83% RSC, sane query staleTimes) — there was **no
low-hanging JS-bundle reduction**. The one decisive win was an **unoptimized 3.0 MB PNG** on the countdown
LCP, fixed with `next/image`. Net: the countdown page transfers **~2.9 MB less**. Two neutral-but-correct
config/cleanup changes kept; four candidates tested and dropped (with numbers).

**Kept:** C6a (next/image countdown), C1 (sourcemaps off), C8 (remove dead dep).
**Dropped after measuring:** C2 (no-op), C3 (added console warning), C4 & C5 (behavior risk / above-fold LCP).

## Evidence — before/after (measured, same machine, cache cleared)

### Bundle — PRIMARY metric = Turbopack (what Vercel ships)
> Note: Next 16 build stdout no longer prints the First-Load-JS route table; metric = on-disk `.next/static/chunks/*.js` bytes.

| | chunks | raw | gzip |
|---|---|---|---|
| **Before** (clean tree) | 35 | 2,221,292 B (2.12 MB) | 635,232 B (620 KB) |
| **After** (C1+C6a+C8) | 37 | 2,284,454 B (2.18 MB) | ~664,432 B |
| **Δ** | +2 | **+63,162 B (+2.84%)** | **+29,200 B (+4.6%)** |

The JS bundle went **UP** — entirely from C6a pulling the `next/image` client runtime into the countdown
route. That is a deliberate, favorable trade (see below), not a regression to fix.

### The real win — countdown LCP image (measured on running prod server)
`/_next/image?url=/images/countdown/prelaunch-bg.png&w=…&q=75`, Accept: image/webp:

| Asset | Bytes |
|---|---|
| Source PNG (served raw before) | **3,141,825 B (3.0 MB)** |
| next/image webp @1920 q75 | 132,276 B (129 KB) — **−95.8%** |
| next/image webp @1200 q75 | 95,512 B (93 KB) — **−97%** |

**Net countdown page transfer: ~3.0 MB → ~0.16 MB** (129 KB webp + 29 KB JS). Trading 29 KB gzip JS for
~2.9 MB less image bytes on the LCP element is overwhelmingly correct; LCP on the countdown improves substantially.

### Build time (Turbopack, both measured)
Before compile 4.3s / wall 11.42s · After compile 4.3s / wall ~11.8s — unchanged (candidates affect the bundle graph, not compile speed).

## Per-candidate verdicts

| # | Change | Bundle Δ (raw/gzip) | Verdict | Why |
|---|--------|---------------------|---------|-----|
| **C6a** | countdown bg `<img>` → `next/image` | +63,162 / +29,200 | **KEEP** | 3.0 MB PNG → 129 KB webp on the LCP; ~2.9 MB less transfer. Gate PASS (visual identical, z-index correct, 0 console). |
| **C1** | `productionBrowserSourceMaps: false` | 0 / +0.19% (noise) | **KEEP** | keeps client sourcemaps out of the deploy; explicit default. |
| **C8** | remove dead dep `embla-carousel-react` | 0 (unused) | **KEEP** | grep-confirmed 0 imports; cleaner install/tree. |
| C2 | `optimizePackageImports:['lucide-react']` | byte-identical w/ vs w/o | **DROP** | no-op — lucide v1.28 already ESM-modular (reviewer predicted). |
| C3 | DSEG7 woff2 `<link rel=preload>` | ~0 | **DROP** | added a "preloaded but not used" console **warning** — LED digits are client-rendered post-hydration, so the font isn't needed at initial paint. Negligible benefit, reverted to keep console clean. |
| C4 | lazy-load `react-zoom-pan-pinch` | — | **DROP** | clean impl needs extracting an interactive canvas subcomponent + rewiring the used `resetTransform()` ref → crosses "don't break code". ~30 KB win not worth it. |
| C5 | lazy-load `swiper` carousel | — | **DROP** | above-the-fold LCP on /board → lazy-loading would hurt LCP. |

## The compression question — answered with numbers (spec §7)

> *"Does compressing/minifying the build increase performance, and does it work on the server?"*

- **Bundler-level "compression/minify" config gave ZERO measurable gain on Vercel.** Next 16 already minifies
  with SWC (the old `swcMinify` knob was removed — there is nothing to turn on). `compress` gzips the Node
  server response, but **on Vercel the edge/CDN applies brotli automatically downstream** → an explicit
  `compress` is a no-op there. `output: 'standalone'` is a self-host concern and out of scope for Vercel.
- **The lever that actually moved bytes was optimizing what is *shipped*, not "compressing the source":**
  `next/image` on the 3.0 MB countdown PNG saved ~2.9 MB (webp + right-sizing). Brotli on top of an already-
  optimized 129 KB webp is marginal; brotli on a 3 MB PNG does almost nothing (PNG is already compressed).
- **Conclusion:** on Vercel, "build/compress the source" ≈ no gain; **asset delivery + client-byte reduction** is
  the real win. This is why the effort's single meaningful improvement is an image-delivery change, not a config flag.

## Deploy validity (Vercel)

Every kept change is a net-win-or-neutral on Vercel:
- C6a — Vercel Image Optimization serves the webp/sizing at the edge out of the box. ✔ works on Vercel.
- C1 — `productionBrowserSourceMaps: false` is honored by the Vercel build. ✔ (fewer deploy artifacts).
- C8 — dependency removal; `npm ci` on Vercel installs one fewer package. ✔
Nothing self-host-only was shipped. `compress`/`standalone` intentionally NOT added (no-op/ambiguous on Vercel).

## Verification

- **UI-First Gate /countdown: PASS** — `plans/reports/ui-gate-260815-1104-countdown.md` (next/image visually identical to Figma, gradient on top, LED font renders, 1920 no-break, 0 console errors/warnings).
- **Typecheck:** `tsc --noEmit` clean. **Lint:** changed files clean.
- **Unit tests:** `vitest` — **567 passed / 45 files.**
- **E2E:** see "Full feature test" below.

## Full feature test (user request — "run source test lại hết feature")

My change is isolated to the `/countdown` public route + build config; nothing touches other features.
Results (real seeded data, Supabase local):

| Suite | Result | Notes |
|-------|--------|-------|
| Unit (vitest, all) | **567 passed / 45 files** | green |
| E2E `public` (prod server) | **15 passed** | 1 fail = CD-E2E-04 — **verified fails on pristine baseline too** (pre-existing `event_config` self-race, unrelated to change) |
| E2E `authed` non-kudos (prod) | **77 passed** | board, profile, homepage, awards, rules, secret-box, root-redirect, auth-check |
| E2E `authed` viet-kudo (dev) | **26 passed / 11 failed** | 11 fails = **Turbopack-dev headless hydration flakiness** on interactive controls (Radix dropdown / Tiptap). **Modal + all controls manually verified working via Playwright MCP (0 console errors)** — feature is fine. |
| E2E `admin` | no specs | project configured but no `admin-*.spec.ts` files exist yet |
| UI-First Gate `/countdown` | **PASS** | next/image visually identical to Figma, 1920 no-break, 0 console errors |

**Env note (learned):** e2e must run on the **dev server** (`npm run dev`) — viet-kudo's `?modal=compose`
entry is dev-only (`kudos/page.tsx` redirects to /board in production). Running it on `next start` fails all
modal tests (redirect). This is a harness constraint, documented; not a code issue.

**Conclusion:** No feature regression attributable to the performance change. Countdown UI + behavior verified;
all other feature suites that can run cleanly are green; viet-kudo feature verified working manually (its e2e
failures are the known dev-headless flakiness). UI is OK.

## Adversarial review trail
- Spec red-teamed (2 rounds) → APPROVED. Plan red-teamed (2 rounds) → APPROVED. Findings F1–F12 (spec) + F1–F8 (plan) all resolved; see `spec.md` §12 Resolved and `phase-*.md`.

## Files changed (working tree, NOT committed)
- `next.config.ts` (+`productionBrowserSourceMaps: false`, comment on reverted C2)
- `package.json` + `package-lock.json` (−`embla-carousel-react`)
- `src/features/countdown/components/countdown-screen.tsx` (`<img>` → `next/image`)
- `src/app/layout.tsx` — **net zero** (C3 preload added then reverted)

## Honest bottom line
This codebase did not have a bundle-size problem — it had **one giant unoptimized image**. The performance
work correctly found and fixed that (−2.9 MB on the countdown LCP) and **rejected** the changes that didn't
measurably help, rather than shipping cosmetic config for the appearance of optimization.
