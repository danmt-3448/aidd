# Phase 07 — Testing (Vitest + Playwright)

**Context:** [spec.md §9](./spec.md) · [primary-workflow.md Step 2](../../.claude/rules/primary-workflow.md)
**Priority:** P2 · **Status:** pending · **Track:** Test
**Blocked by:** 06 (integration; gate already PASS) · **Blocks:** 08
**UI-First:** No test-first — tests written ONLY after gate PASS + integration.

## Overview
Cover new logic with unit tests + user flows with e2e. Tests run against final integrated code. No `test.skip`/`--force`/mock-to-bypass.

## Unit (Vitest)
- **Activity time-format** — pinned formatter yields `hh:mmA` no-space, Asia/Saigon, for representative timestamps (AM/PM boundary, midnight, noon).
- **Activity mapping** — RPC row `{receiver_id,receiver_name,created_at}` → `SpotlightActivityEntry {time,name}`.
- **Best-match resolver** — exact ci-name wins over `includes`; empty query → no match (no-op); 0 matches → null; first `includes` when no exact.
- **Fullscreen hook SSR guard** — hook does not touch `document` at import/initial render; `typeof document` guard holds (simulate no-`document` / server path).

## E2E (Playwright, `--project=authed`)
- **Search-nav** — type a seeded recipient name → Enter → URL `/profile?id=<receiverId>`; empty submit → stays; 0-match → hint, no nav.
- **Fullscreen toggle + ESC** — ⤢ enters fullscreen (icon→collapse); ESC exits; collapse-click exits.
- **Feed prepend** — insert a kudo (seed/2nd session) → new row appears at top within debounce window.

## Acceptance
- [ ] All unit + e2e green (`npm run test`, `npm run test:e2e`).
- [ ] No skipped/forced tests; no mock-to-bypass.
- [ ] Failing → fix code (not test) per feedback loop; max 3 retries → escalate.

## Risks
- Realtime prepend timing flaky in e2e → assert with generous wait on the row, not fixed sleep.
- Fullscreen API in headless Playwright may no-op → assert fallback overlay state (`fixed inset-0 z-50`) as well as native.
