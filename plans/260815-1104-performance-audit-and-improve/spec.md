---
title: Performance Audit & Safe Improvement — Spec
status: draft
date: 2026-08-15
owner: performance
deploy_target: Vercel
risk_policy: config-only / high-safety (no business-logic change)
---

# Performance Audit & Safe Improvement — Spec

## 1. Objective

Measure current performance of the AIDD app (Next.js 16 + React 19 + Supabase), then apply
**low-risk, config-safe** improvements that measurably reduce bundle weight and improve runtime
Core Web Vitals **without changing any business logic or UI behavior**. Every change must be
justified by **before/after evidence** and must remain valid on the production deploy target (**Vercel**).

Explicitly answers the user's question: *"does compressing/minifying the build increase performance,
and does it work once deployed to the server?"* — see §7.

## 2. Scope (all four confirmed)

1. **Bundle / build** — First Load JS per route, shared chunk, build time, tree-shaking.
2. **Runtime web vitals** — LCP / FCP / TBT / CLS on key routes (board, homepage, login, countdown, kudos, profile), measured via Lighthouse on a prod build.
3. **Server / DB** — Supabase query/RPC timing on hot paths (board feed, spotlight, profile, leaderboard) via `EXPLAIN (ANALYZE, BUFFERS)`; confirm indexes on FK/WHERE/ORDER-BY columns.
4. **Compression build** — whether explicit compression/minify/source-map/standalone config helps, **and whether it actually takes effect on Vercel** (§7).

## 3. Constraints (hard rules)

- **No business-logic change. No UI/behavior change.** Only config, lazy-loading of already-optional/below-the-fold code, asset/font delivery, and query cache tuning that preserves identical output.
- **No `git commit` / `git push`** during this effort. Work stays in the working tree.
- **Deploy target = Vercel** — any optimization must be a net win (or neutral) on Vercel's build+edge pipeline. Nothing that only helps a hypothetical self-host and hurts Vercel.
- **Before/after evidence mandatory** for every accepted change — build size table, build time, Lighthouse JSON/screenshot, and (for DB) query timing.
- **Edit files in place** — no `*-v2` / `*-enhanced` copies.
- Must **not break** the existing UI-First Gate results or the unit/e2e suites.

## 4. Measurement methodology (canonical — reproducible)

> **Critical finding:** Next 16 build stdout (both Turbopack **and** `--webpack`) **no longer prints
> the per-route First Load JS size table** — verified against both baseline builds. Therefore the
> **bundle metric = on-disk size of `.next/static/chunks/*.js`** (raw + gzip bytes, total + per-chunk).
>
> **Two tracks, primary vs secondary (review F2):**
> - **PRIMARY = Turbopack** (`npx next build`) — this is what **Vercel ships**, so it is the honest
>   production number. All keep/revert decisions and the headline before/after are judged on this.
> - **SECONDARY = webpack** (`npx next build --webpack`) — only because **bundle-analyzer requires webpack**;
>   used for chunk *composition* (treemap), not for the headline number. Turbopack and webpack chunk graphs
>   differ (35 vs 49 chunks at baseline) — the report states which track each number comes from and never
>   presents webpack numbers as production reality.

| Metric | Command | Evidence artifact |
|--------|---------|-------------------|
| **Bundle (PRIMARY, ships)** total+per-chunk raw+gzip | `.next/static/chunks/*.js` after `npx next build` (Turbopack) | `evidence/{before,after}/bundle-*-turbopack.txt` |
| Bundle (SECONDARY, composition) | `.next/static/chunks/*.js` after `npx next build --webpack` | `evidence/{before,after}/bundle-*-webpack.txt` |
| Build time | `/usr/bin/time -p npx next build` — measured on the SAME bundler both before/after (Turbopack) | build logs |
| Bundle treemap | `ANALYZE=true npx next build --webpack` | `.next/analyze/*.html` → copied to evidence |
| Runtime CWV | prod build + `next start` → Lighthouse, authed session, throttled | `evidence/{before,after}/lighthouse-{route}.json` + screenshot |
| DB query timing | `psql … EXPLAIN (ANALYZE, BUFFERS)` on hot queries | `evidence/{before,after}/db-*.txt` |

**Evidence controls (review F7 — apples-to-apples):** before AND after measured on the same machine,
same seed state (`npm run db:reset` before each), fresh `next start` (cold server), same throttle profile.
**Lighthouse: ≥ 3 runs per route per state, report the median** (single-run variance ±5–10 pts can reverse
direction). Bundle builds are deterministic enough for 1 run but hashes vary — compare by total bytes, not filenames.

Runtime measurement runs against **real seeded data** (`npm run db:reset`) with an authed session
(`e2e/.auth/user.json`), consistent with the UI-First Gate.

## 5. Baseline (before) — captured 2026-08-15

- Turbopack build: **✓ compiled 4.3s**, wall `real 11.42s`. 14 app routes, all dynamic (`ƒ`).
- Webpack build: **✓ compiled 9.2s**, wall `real 19.87s`.
- **Bundle baseline — PRIMARY (Turbopack, ships on Vercel):** 35 JS chunks, **raw 2,221,292 B (2.12 MB)**, **gzip 634,740 B (620 KB)**. Largest single chunk `1qel2n1lmpymn.js` = **420KB raw / 132KB gzip** (vendor — investigate). → `evidence/before/bundle-baseline-turbopack.txt`.
- **Bundle baseline — SECONDARY (webpack, for analyzer):** 49 chunks, raw 1.96 MB, gzip 583 KB → `evidence/before/bundle-baseline.txt`.
- **Lighthouse baseline: NOT yet captured** — will be captured in the implement phase (before applying any change) so "improvement" is measurable against a real number. Do not claim CWV improvement without it.
- Working tree: clean at start.

## 6. Candidate optimizations (config-safe, ranked) — from codebase scout

Risk = risk to code behavior. Only LOW/MED (behavior-preserving) are in scope; HIGH deferred.

| # | Area | Change | Risk | Expected win | Verify / gate |
|---|------|--------|------|--------------|---------------|
| C1 | compression | `productionBrowserSourceMaps: false` (explicit; already default) — **skip `compress`** on Vercel (no-op, §7) | LOW | avoids shipping client source maps | build succeeds; bundle unchanged-or-smaller |
| C2 | bundle | `experimental.optimizePackageImports: ['lucide-react']` (+ other barrels only if analyzer proves gain) | **MED** | tree-shake icon barrel — **gain uncertain** (lucide v1.28 already ESM-modular) | analyzer treemap before/after MUST show lucide shrink; remove on any build/runtime import error |
| C3 | runtime | DSEG7 font: **preload woff2 only, KEEP `font-display: block`** (NOT `swap`=FOUT, NOT `optional`=shows fallback font to cold-cache first visitors which gate can't catch — review F4). Preload shrinks block window to ~0. | LOW | removes render-block, never shows wrong font | **re-run `/aidd-ui-gate` on /countdown** |
| C4 | bundle | Lazy-load `react-zoom-pan-pinch` via `next/dynamic` (interaction-gated, ~30KB) | MED | trims /board initial JS | verify `transformRef` still works post-hydration; e2e /board |
| C5 | bundle | Lazy-load `swiper` highlight carousel — **measure first**; it may be above-the-fold LCP so lazy could hurt | MED | trims /board initial JS | verify `swiperRef.slideToLoop(0,0)` (carousel.tsx:90) doesn't fire before mount; e2e /board + gate |
| C6a | runtime | countdown bg raw `<img>` → `next/image` (countdown-screen.tsx:44) | MED | LCP image optim (webp/sizing) | **re-run `/aidd-ui-gate` on /countdown** |
| ~~C6b~~ | ~~runtime~~ | ~~login keyvisual → next/image~~ — **OUT OF SCOPE**: it is a CSS `backgroundImage` (login-screen.tsx:29), unreachable by next/image without DOM restructuring (HIGH risk). Login LCP wordmark already uses `<Image priority>`. | — | dropped (review F3) |
| C8 | deps | Remove **`embla-carousel-react`** — installed but imported nowhere in `src/` (dead dep, review F8) | LOW | smaller install; cleaner tree | `grep -r embla src/` = 0; build + tests green |

**Dropped:** `output: 'standalone'` (was C7) — self-host optimization; user's target is **Vercel only**, and Vercel handles its own server packing. Out of scope to avoid an unverifiable/ambiguous change (review F1).

Each candidate is **independently gated**: measure PRIMARY (Turbopack) bundle + relevant runtime → keep only if it
helps or is provably neutral AND passes its verify/gate column, else **revert that candidate**. A candidate that
touches a screen's visual output (C3, C6a) is not "done" until its `/aidd-ui-gate` re-run passes.

## 7. Compression on Vercel — the user's question, answered up front

- Next.js **already minifies** JS/CSS (SWC) in production by default. In Next 16 the old `swcMinify`
  knob was removed (SWC is the only minifier) — **there is nothing to "turn on" for minify** (review F11).
- Next's **`compress` option gzips responses from the Node server** (`next start`, self-host). **On Vercel
  it is redundant** — Vercel's edge/CDN applies gzip+**brotli** automatically, brotli > gzip. So on Vercel
  `compress` yields **~0 benefit**; it is not zero on self-host. We keep the default and do NOT rely on it.
- `output: 'standalone'` affects the **server** bundle. **Correction (review F1):** it is NOT simply
  "ignored" — behavior is version/platform-dependent and unverifiable without a staging deploy. Since the
  target is **Vercel only** and Vercel manages its own server packing, this is **out of scope** (dropped C7)
  rather than asserted either way. No false claim ships in the report.
- **Real lever on Vercel = ship fewer/smaller bytes to the client** (tree-shaking, lazy-load, image/font
  delivery), because brotli is already applied downstream. Conclusion: **compression/minify config alone ≈ no
  measurable gain on Vercel; the win comes from client-bundle reduction (C2/C4/C5) + asset optimization
  (C3/C6a) + dead-dep removal (C8).** Stated, with before/after numbers, in the final report.

## 8. Targets (budgets, from docs/performance-guidelines.md §1)

- First Load JS/route: ≤ 200 KB warn, ≤ 300 KB hard. Shared chunk ≤ 120 KB.
- Lighthouse Performance ≥ 90 (prod). LCP ≤ 2.5s, CLS ≤ 0.1, TBT low.
- No `Seq Scan` on hot tables; FK/filter columns indexed.
- **Success = measurable improvement (or proven-neutral) on ≥ the highest-traffic routes, with zero behavior/UI regression and all tests green.**

## 9. Acceptance criteria

1. Before/after evidence present for bundle (**Turbopack primary** total raw+gzip), build time, and Lighthouse (**median of ≥3 runs**) on ≥ board + homepage + one more route.
2. Every accepted change is behavior-preserving: unit (`vitest`) + e2e (`playwright`) all green after changes.
3. UI-First Gate not regressed on any touched screen (re-run `/aidd-ui-gate` where a screen's visual output could shift — e.g. C6 image swaps, C3 font).
4. Compression question answered with evidence (§7) in the final report.
5. No commit/push. Working tree changes only.
6. Full feature test pass at the end (user request): run whole unit+e2e suite, confirm app works and UI ok.

## 10. Out of scope

- Business-logic refactors, data-model changes, new features.
- HIGH-risk architectural changes (e.g. route-splitting Tiptap beyond current lazy-load).
- iOS/mobile frames; screens whose MoMorph spec is still `in_progress`.
- Production deploy itself (evidence-gate/deploy is a separate, later step).

## 11. Risks & mitigations

- **Turbopack vs webpack size mismatch** → PRIMARY metric is **Turbopack** (what Vercel ships) for both before/after; webpack is secondary/analyzer-only, never presented as production (§4).
- **A "config-safe" change silently alters UI** (font swap, image component) → gated by UI-First Gate + e2e.
- **A candidate helps locally but not on Vercel** → judge each against Vercel semantics (§7); mark neutral ones as optional.
- **Lazy-load introduces a loading flash / hydration diff** → only lazy-load truly optional/interaction-gated code; keep a loading fallback; verify e2e.

## 12. "Measurable improvement or proven-neutral" — not an escape hatch (review F10)

Honest bar: each candidate must show, on the PRIMARY (Turbopack) metric or its runtime target, **either a
byte/score reduction OR strict neutrality (±1% noise band) with a code-quality/correctness reason** (e.g. C8
removes a dead dep — neutral bundle, cleaner tree; C1 makes a default explicit). A candidate that is neither
better nor justified-neutral is **reverted, not kept**. The report lists per-candidate: before, after, delta,
verdict (kept/reverted/neutral-kept), and why. No aggregate hand-waving.

## Resolved (from adversarial spec review — F1–F12)
- **C7 `output: 'standalone'` dropped** — Vercel-only target; claim was corrected, not asserted (F1).
- **Bundle metric = Turbopack primary + webpack secondary**, clearly labeled (F2).
- **C6 split**: C6a countdown only; login keyvisual out of scope (F3).
- **C3 font**: preload-only + keep `font-display: block` (NOT `optional`/`swap` — both regress the LED digits; gate is cache-warm and can't catch cold-cache font swap); gated on /countdown UI-First Gate (F4).
- **C2 → MED** with mandatory analyzer proof (F5). **C4/C5** ref-forwarding checks + e2e (F6).
- **Lighthouse**: median of ≥3 runs, cold cache, same seed (F7). **C8** dead-dep `embla-carousel-react` added (F8).

## Open questions (defer to plan/user)
- Lighthouse throttling profile: mobile Fast-3G (guideline default) vs desktop — **plan will run mobile
  (guideline default) as the headline; desktop optional**. Flag if user wants both.
