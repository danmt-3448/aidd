# Phase 04 — Write/expand tests per screen

**Priority:** High · **Owner:** test-writer (test files ONLY) · **Depends:** 01, 02 · **Blocks:** 05

## Goal
Cover các gap/stale từ ma trận (phase-02): E2E Playwright (UI thật, DB seed) cho High + happy/error; Vitest unit cho logic/validation. Test data-thật, KHÔNG mock bypass.

## Per-screen (parallelizable — file ownership tách bạch)
- **board** → `e2e/board.spec.ts` + `src/features/board/*.test.ts`
  High/critical: feed render + infinite scroll · hashtag/department filter · like toggle (self-like refuse, one-per-user, count) · special-day weighted stat · empty "Hiện tại chưa có Kudos nào." · spotlight states.
- **profile** → `e2e/profile.spec.ts` + `src/features/profile/*.test.ts`
  **PHẢI có** V1 (write-bar mở modal pre-fill recipient — FUN_007) · V2 (heart toggle count = server value — FUN_014) · V3 (sent-card receiver nav — GUI_006) · SEC_001 sent hidden on other · route resolution 404/malformed (FUN_003/004) · self/other faces.
- **kudos** → `e2e/viet-kudo.spec.ts` + `src/features/kudos/*.test.ts`
  validation (recipient/content/hashtag/danh-hieu required + error text) · anon masking · double-submit guard · atomic create → feed appears · sanitize XSS.
- **secret-box** → `e2e/awards-rules-secret-box.spec.ts` (secret-box block) + `src/features/secret-box/*.test.ts`
  open → badge + count −1 · count=0 disabled · double-open no double-award · close → /board.
- **homepage** → `e2e/homepage.spec.ts` + `src/features/event/*.test.ts`
  countdown compute/TZ/at-zero + hide Coming-soon · bell badge gating · admin menu · language switch · public vs authed.

## Rules
- Test files ONLY (không sửa implementation — nếu test lộ bug, feed DEV role ở phase-05).
- Dùng seed data (phase-01) + Playwright projects public/authed/admin. Không `test.skip`/`--force`/mock để giả xanh.
- Ưu tiên High TC; bỏ TC thuần GUI (UI-gate lo).

## Success criteria
- [ ] Mỗi màn: test mới/cập nhật cover hết High/critical + V1/V2/V3 (profile).
- [ ] Test biên dịch (`tsc`/eslint) sạch; chưa cần xanh (chạy ở phase-05).

## Risk
E2E cũ assert theo mock cũ → rewrite theo data seed. Auth session cho authed/admin (global-setup.ts) phải khớp seed users.
