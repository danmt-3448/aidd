# UI-First Gate — /countdown (ceil-minute display + CTA → home) — PASS

- Date: 2026-08-16 · Screen: `/countdown` (MoMorph `8PJQswPZmU`, fileKey `9ypp4enmFmdK3YAFJLIu6C`)
- Verify env: **prod build** (`next build` + `next start -p 3001`), authed session (regular user), real seeded data, Supabase local UP. Port `127.0.0.1:3001`.
- Iterates on `ui-gate-260816-0830-countdown-redirect.md` (redirect + button). This pass covers two follow-up changes.

## Scope of change
- `src/lib/time/countdown.ts` — `computeRemaining` now rounds remaining time UP to whole minutes (`Math.ceil(remainingMs/60000)`), seconds always `0`. Fixes the last-minute UX gap (display no longer sits on a frozen "0 phút" for up to 59s before `done`). Behavior-only; no DOM/layout change.
- `src/features/countdown/components/countdown-display.tsx` — done-state CTA `href` changed `/board` → `/` (Homepage). Attribute-only; button style/layout unchanged.

## A. Visual fidelity
- **Property-diff surface unchanged** — the counting-state LED blocks (`data-fig` nodes) and the done-state button styles are byte-identical to the prior PASS (`ui-gate-260816-0830`). Only a JSX `href` value + pure-logic decomposition changed → no layout/style delta to re-diff. Prior visual PASS holds.
- No new/removed elements; 3 LED blocks (Ngày/Giờ/Phút) as per Figma.

## B. Behavior (real seeded data, authed, prod) — 100%
- [x] **Ceil display** — event set +90s → counter shows **"2 PHÚT"** (aria: "0 ngày 0 giờ 2 phút còn lại"). Floor would show 1 → confirms ceil active.
- [x] **No frozen 0** — observed live tick **2 → 1**; the final minute reads "1 PHÚT", not a stuck "0". Counter reaches `done` exactly at 0 (no dead minute).
- [x] **Done + CTA** — at 0 the done state renders "Sự kiện đã bắt đầu!" + CTA. CTA `href="/"`, text "Vào sự kiện".
- [x] **CTA → Homepage** — click → navigates to `http://127.0.0.1:3001/` (Homepage renders, NOT /board, NOT bounced). URL stays `/`.
- [x] **Post-launch lock** (from prior pass, still holds) — event past → `/countdown` redirects `/board`.
- [x] **Console** — 0 error / 0 warning on both /countdown (done) and / (home).

## Automated checks
- `npx tsc --noEmit` → exit 0
- `npx eslint` (countdown.ts, countdown.test.ts, use-countdown.test.ts, countdown-display.tsx) → exit 0
- `npx vitest run countdown.test.ts use-countdown.test.ts launch-gate.test.ts` → **73 pass** (ceil suite: sub-minute→1, whole-minute not bumped, 23h59m59s→1d, minute-by-minute→done)

## Verdict: PASS
- Behavior 100% verified live on prod build + real seeded data + authed; visual surface byte-identical to prior PASS (no property-diff regression possible from an href/logic change).
- Evidence captured via Playwright DOM/aria snapshots (counting 2→1, done CTA href="/", navigation to /).
