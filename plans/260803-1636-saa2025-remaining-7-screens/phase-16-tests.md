---
title: Tests (Vitest + Playwright)
work_type: feature
track: test
status: planned
blockedBy: [15]
blocks: [17]
spec_source: momorph:8PJQswPZmU, momorph:zFYDgyj_pD, momorph:b1Filzi9i6, momorph:i87tDx10uM, momorph:J3-4YFIpMM, momorph:MaZUn5xHXZ, momorph:3FoIx6ALVb
---

# Phase 16 — Tests: Vitest + Playwright (TDD from MoMorph test cases)

## Context Links
- MoMorph test-case counts (recon): Countdown 17 · Prize 15 · Rules 9 · Homepage 62 · Secret box 19 ·
  Live board 41 · Profile 30 = **193 test cases** total.
- **All 7 screenIds** (spec_source): Countdown `8PJQswPZmU` · Prize `zFYDgyj_pD` · Rules `b1Filzi9i6` ·
  Homepage `i87tDx10uM` · Secret box `J3-4YFIpMM` · Live board `MaZUn5xHXZ` · Profile `3FoIx6ALVb`.
  Pull the full test-case CSV per screen (`download_test_cases`) — do NOT test Homepage-only.
- Existing patterns: `src/features/kudos/kudo-schema.test.ts`, `src/features/auth/guard-rules.test.ts`,
  `login-screen.test.tsx`; e2e under `e2e/**`.
- Seed users (disk fact `supabase/seed-auth-users.mjs`): 10 fixed-UUID users
  (`11111111-0000-0000-0000-00000000000N`), password `TestPass123!`, created via GoTrue admin API;
  `profiles` rows auto-created by `handle_new_user` trigger.
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Overview
- **Priority:** P1 · **Status:** planned
- Test matrix driven by the 193 MoMorph test cases. **Tester owns test files only** — reads impl, never edits it.

## Test matrix
| Layer | Target | Examples |
|-------|--------|----------|
| **Unit (Vitest)** | pure logic, hooks, queries | `computeRemaining` (past/zero/invalid); `parseProfileId` (self/other/invalid); weighted-badge distribution (10k rolls); `badgeAsset` allowlist; anon-mask CASE at query level |
| **Unit (Vitest)** | security invariants | `getProfileStats(otherId).sent === null`; `listProfileKudos sent` denied for non-owner; header has no email |
| **DB integration** | RLS + RPC + views | `kudos_public` masks anon sender; `open_secret_box` decrement + double-open lock; hearts idempotent + self-heart block; notification trigger anon-safe |
| **E2E (Playwright)** | user flows per screen | countdown nav-lock; prize scroll/anchor; rules overflow + Viết KUDOS; homepage bell + account menu; board heart + filter + Realtime; profile self/other + 404; secret-box open + disable-at-zero |

## Requirements
- Unit: cover every pure util + hook return contract; error paths included.
- DB integration: hit a **real local Supabase** (no mocks — repo convention), assert RLS + RPC + view masking.
- **E2E session injection (resolve the Viết-Kudo drafted-not-run gap — concrete plan):**
  1. `npm run db:reset` (schema + `seed-auth-users.mjs`) so the 10 fixed-UUID users exist locally.
  2. Playwright **`globalSetup`** signs in one seeded user via `@supabase/supabase-js`
     `auth.signInWithPassword({ email: 'nguyen.van.an@sun-asterisk.com', password: 'TestPass123!' })`,
     then writes the resulting Supabase auth cookies/localStorage to a **`storageState` JSON** file
     (e.g. `e2e/.auth/user.json`); tests set `use: { storageState }` so every spec starts authed.
  3. For flows needing a SECOND identity (Realtime two-client, profile OTHER mode), repeat for a second
     seeded user → `e2e/.auth/user2.json`; a spec loads it via `test.use({ storageState })` per context.
  4. Service-role key stays test-only (`.env.local` / CI secret) — never shipped to the browser.
  Cover the primary flow per screen from its test-case CSV.
- Realtime E2E: two contexts (user.json + user2.json) — one writes, the other observes the live update (board + notifications).

## Related Code Files
- **Create:** `*.test.ts(x)` next to each new source file; `e2e/{screen}.spec.ts` per screen.
- **Modify:** test seed/setup util if needed for session injection (test-only).
- **Delete:** none.

## Implementation Steps
1. Unit tests for phase 02/05/06 pure utils + security invariants (05, 06).
2. DB-integration tests for phase 01 views + phase 03/04/06 RPC/trigger/RLS.
3. E2E per screen from MoMorph test cases (all 7 screenIds); session-injection via `globalSetup` storageState.
4. Realtime two-client E2E (board, notifications) using user.json + user2.json.
5. `npm run test` + `npm run test:e2e` green; NO skips, NO forced pass.

## Todo
- [ ] Unit: countdown, profile-route, secret-box distribution + allowlist
- [ ] Unit/security: profile sent-hidden, no-PII header, `getIsAdmin` boolean
- [ ] DB-integration: kudos_public mask, open_secret_box, hearts, notif trigger (exact anon title), Realtime pub column-list
- [ ] E2E session inject: `globalSetup` signInWithPassword → `storageState` (user.json + user2.json)
- [ ] E2E: 7 screens primary flows from each screen's test-case CSV (all 7 screenIds)
- [ ] E2E: Realtime two-client (board + notifications) via two storageStates

## Success Criteria (binary)
- [ ] `npm run test` passes with zero failures and zero `.skip`.
- [ ] `npm run test:e2e` passes for all 7 screens with authed sessions from `storageState` (no manual login in specs).
- [ ] Every security invariant (anon mask, sent-hidden, no-PII, server-only box) has a passing test.
- [ ] Weighted-badge distribution test passes within tolerance.

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| E2E session injection unresolved (Viết-Kudo gap) | Med | **High** | Resolve service-role session inject first; blocks e2e sign-off |
| Realtime flakiness in CI | Med | Med | Deterministic waits on subscription events, not sleeps |
| Distribution test false-fail | Low | Low | Wide tolerance + fixed seed if supported |

## Security Considerations
- Tests are the enforcement proof for every § security invariant across phases 01/03/04/05/06.

## Remaining e2e-debt (gộp từ 260811-0806, 2026-08-11)
Phát hiện khi chạy e2e prod-build cho kudo-like API hardening. **Không phải bug sản phẩm** — spec e2e lệch môi trường. Chạy `next build && next start` + local Supabase + set `event_config.event_start_at` về quá khứ (kẻo pre-launch redirect countdown).
- [ ] **`e2e/viet-kudo.spec.ts` ID-2..ID-33 fail** — spec mong `/kudos` render compose-modal inline, nhưng **prod `/kudos` redirect `/board`** (`src/app/kudos/page.tsx:31`). Fix: điều hướng `/board?modal=compose` (prod mở modal qua `initialComposeOpen`), hoặc chạy specs trên dev + xử lý Turbopack-hydration (memory `ui-gate-turbopack-headless-hydration`). Helper `openModal(page)` cần cập nhật.
- [ ] **`e2e/board.spec.ts` TC-BOARD-02 (KV banner) fail** — UI-render, component `board-kv-banner.tsx` (đổi lần cuối `0e7a3f2`). Rà selector/điều kiện render.
- Bằng chứng: `plans/260811-0806-kudo-like-api-hardening/reports/e2e-verdict-260811-ship.md` + `e2e-260811-board-vietkudo.log`. Like e2e (TC-BOARD-08/09) XANH — chỉ 2 nhóm trên đỏ.

## Next Steps
- Green suite → Review + security audit (17).

## MoMorph refs:
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
