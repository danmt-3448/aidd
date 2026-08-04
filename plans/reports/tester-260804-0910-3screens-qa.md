# QA Report — Awards / Rules / Secret-box completion

**Date:** 2026-08-04 · **Branch:** develop · **Scope:** 3 screens completed this session

## Environment brought up
- Colima (Docker) started · Supabase local via `npm run db:reset` — all 12 migrations applied incl. `20260731110000_open_secret_box_rpc.sql` · 10 auth users seeded · Next dev on :3000 · dev-login gated by `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true`.

## Static checks
- `tsc --noEmit`: 0 src errors · `eslint`: 0 errors (4 pre-existing e2e warnings) · Vitest: **157/157 pass**.

## Secret-box RPC — DB-layer verification (psql, caller JWT simulated)
- RPC present, `SECURITY DEFINER` ✓ · `authenticated` has EXECUTE ✓.
- **Atomicity:** 3000 opens from count=3000 → remaining exactly **0**, badges exactly **3000** (one badge per open, no drift).
- **Weighted distribution (n=3000)** vs target 30/25/20/10/10/5:
  stay-gold 29.7 · flow-to-horizon 24.2 · touch-of-light 19.7 · beyond-the-boundary 10.6 · revival 10.4 · root-further 5.3 — all within ~1%. No gap/overlap.
- **Error paths:** count=0 → `P0102` ✓ · missing row → `P0102` ✓ · unauthenticated → `P0101` ✓.

## E2E (Playwright, `E2E_SUPABASE=1`)
- `e2e/awards-rules-secret-box.spec.ts`: **6/6 pass** — unauth redirect→/login (×3), awards shows 6 titles, rules headings + "Viết KUDOS" opens compose modal, secret-box UI renders.
- **Full suite, CI-like (serial `--workers=1 --retries=1`): 62 passed, 3 skipped, 0 failed.** Deterministically green.

### Full-parallel flake — diagnosed, not a code bug
A naive local run (`next dev`, 4 parallel workers, 0 retries) failed **rotating** tests each run
(`viet-kudo:210`, then `login:28/36`, then `viet-kudo:187`+`countdown:93`). Every one **passes in isolation**
(2–3×). Root cause: `next dev` compiles routes/server-actions on first hit; 4 workers hammering cold routes
simultaneously blow short timeouts. `playwright.config.ts` already hardens CI (`workers:1`, `retries:2`) so
CI never hits this. No config change needed.

## Bugs found & fixed during QA
1. **Secret-box page crashed at runtime** — `badgeAsset` (sync) was exported from the `'use server'` module `secret-box-actions.ts`; Next strips non-async exports from server-action modules on the client → import failed. **Fix:** extracted allowlist to new pure module `src/features/secret-box/badge-assets.ts`; updated hook + unit-test imports. (Masked by typecheck + node-env unit tests; only surfaced at runtime.)
2. **E2E rules selector ambiguous** — RulesPanel is itself `role="dialog"`; targeted the compose modal by `name: 'Viết Kudo'`.

## E2E robustness fixes (verified)
3. **`login.spec.ts:28,36`** — `[role="alert"]` also matched Next's app-wide `<div id="__next-route-announcer__" role="alert">` → false match. **Fix:** scoped to `p[role="alert"]` (login alert is a `<p>`). → `login.spec.ts` **12/12 pass**.
4. **`viet-kudo.spec.ts` `selectRecipient` helper** — recipient search = 300ms debounce + Supabase server-action; a cold first query exceeded the 5s option-wait. **Fix:** wait for the search box to mount, raise option timeout 5s→15s (measured ~10s cold). → ID-26 **3/3**, ID-8 **2/2**.

## Made durable
- Authenticated E2E gated by `process.env.E2E_SUPABASE === '1'` (runs in QA, skips in CI-without-Supabase).

## Unresolved / follow-up
- Revival badge still uses `badge-stay-gold.png` placeholder (no asset yet).
- Concurrent double-open (count=1) relies on `SELECT … FOR UPDATE`; verified structurally, not load-tested.
- Optional hardening: a Playwright global-setup that warms key routes would let local full-parallel runs match CI stability (not required — CI already serial+retries).
