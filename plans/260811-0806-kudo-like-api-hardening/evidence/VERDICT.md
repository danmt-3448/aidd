# Evidence Verdict — Kudo + Like API hardening — SEALED: SHIP (backend verified)

**Date:** 2026-08-11 · Branch develop · local Supabase (colima) + prod build (`next build && next start :3001`).

## What was verified (3 independent layers)

### 1. Runtime SQL (rolled-back tx on real DB) — see `reports/verify-after-260811-implementation.md`
- toggle_heart: like→(t,1), unlike→(f,0), duplicate insert conflict-safe (no 23505), self-like→P0008, not-found→P0007.
- hearts_received weighted: 1 normal + 1 special = **3** (not 2); unlike special → **1** (revoke 2).
- create_kudo: nonexistent receiver → **P0007** (not raw FK); valid → created.

### 2. Unit (Vitest) — 159/159 pass
- `heart-actions.test.ts` rewritten to exercise the RPC path (7 cases).
- board + kudos suites green. tsc clean. lint 0 errors.

### 3. E2E on real app (Playwright, prod build, authed session) — `e2e-260811-board-vietkudo.log`
**Tests covering THIS change — PASS (see `e2e-like-PASS.txt`):**
- ✓ TC-BOARD-08: heart button toggles heart state
- ✓ TC-BOARD-09: heart count updates after toggle
- ✓ TC-BOARD-01,03,04,05,06,07,10,11,12,13,14 (board loads, kudo card, copy link, responsive)
- ✓ viet-kudo ID-0 (stays on /kudos), ID-1 (unauth → /login)

board.spec = **13/14 pass**.

## Pre-existing FAILURES (NOT caused by this diff — provable)
- ✘ TC-BOARD-02 (KV banner renders) — component `board-kv-banner.tsx` last changed by commit **0e7a3f2** (already on develop), NOT this work.
- ✘ viet-kudo ID-2..ID-33 (compose modal open/title/sections/recipient/mention/bold) — all time out at 30s because the modal doesn't open in this env; component `kudo-compose-modal.tsx` last changed by **0e7a3f2**, NOT this work. viet-kudo was NOT in the prior green e2e list (plan phase-16).

**Proof this diff is UI-independent:** commit 668f2f2 changed ONLY `heart-actions.ts`, `kudo-actions.ts`, `heart-actions.test.ts`, 3 SQL migrations — **zero `.tsx` files**. The failing tests exercise UI components this diff never touches; the passing heart tests DO exercise this diff.

## Decision
**SHIP** the backend hardening. The two tickets' behavior (like race, special-day +2, unlike revoke, create-kudo receiver) is verified at DB + unit + (for like) e2e levels. The e2e red is pre-existing UI test debt outside this diff — filed as follow-up, not a blocker for this backend change.

## Follow-ups (separate from these 2 tickets)
- Fix TC-BOARD-02 (KV banner) + viet-kudo compose-modal e2e (pre-existing, from 0e7a3f2 UI work).
- P03 (liked_by_me server-side), P05 (kudo detail) — deferred/optional per plan.
- Confirm sender-vs-receiver for hearts (defaulted to receiver, evidence-backed).
