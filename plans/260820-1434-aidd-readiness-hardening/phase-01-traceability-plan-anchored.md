# Phase 01 — Traceability (plan-anchored, no tracker)

## Overview
- **Priority:** P1 (cao nhất — kéo Traceability 3→~8)
- **Status:** completed
- Dự án cá nhân, không có tracker → work-unit anchor = **plan directory**. Chuỗi mục tiêu:
  *plan ↔ commit ↔ PR* (leg "ticket" N/A, không giả vờ).

## Key insights
- Không có git-hook infra sẵn (no husky, `core.hooksPath` chưa set) → phải dựng từ đầu, commit vào repo.
- `core.hooksPath` là git config local (không theo clone) → cần `npm run hooks:install` + postinstall auto-set.
- Enforce **warn-only** trước (user chọn); có escape hatch env.
- 40 commit gần nhất không có ref nào → đây là baseline cần đổi từ nay.

## Requirements
- FR1: Git-hook infra committed, tự cài khi `npm install` (postinstall) hoặc `npm run hooks:install`.
- FR2: `commit-msg` hook **warn-only**: nếu đang có active plan (đọc `.claude/session-state` hoặc file active-plan) mà commit body/trailer thiếu tham chiếu plan-slug → in cảnh báo, KHÔNG chặn.
- FR3: Escape hatch `SKIP_PLAN_REF=1` bỏ qua cảnh báo.
- FR4: `.github/PULL_REQUEST_TEMPLATE.md` — bắt buộc điền: link plan dir, evidence report path, checklist (UI-gate PASS? tests? docs synced?).
- NFR: Không chặn workflow hiện tại; không phụ thuộc mạng.

## Architecture
```
.githooks/commit-msg        # bash: đọc active plan slug, grep trong $1 (commit msg file), warn nếu thiếu
.githooks/lib/active-plan.sh # helper: resolve active plan slug (fallback: git branch name)
package.json                # "hooks:install": "git config core.hooksPath .githooks", "postinstall"
.github/PULL_REQUEST_TEMPLATE.md
```
- Convention commit trailer: `Plan: 260820-1434-aidd-readiness-hardening` (hook gợi ý đúng dạng này).
- **Active plan resolve = BRANCH NAME (only).** KHÔNG gọi `set-active-plan.cjs`: script đó cần `TKM_SESSION_ID` (không có trong context git hook) → luôn no-op. Trong git hook, branch name là nguồn tin cậy duy nhất cho plan slug. KISS: chỉ đọc `git rev-parse --abbrev-ref HEAD`, map sang plan slug nếu khớp `plans/<slug>` đang mở.

## Related code files
- **Create:** `.githooks/commit-msg`, `.githooks/lib/active-plan.sh`, `.github/PULL_REQUEST_TEMPLATE.md`
- **Modify:** `package.json` (scripts.hooks:install, scripts.postinstall), `docs/getting-started-guide` hoặc onboarding note (1 dòng: chạy `npm run hooks:install`)
- **Delete:** none

## Implementation steps
1. Viết `.githooks/lib/active-plan.sh` — resolve plan slug TỪ BRANCH NAME (bỏ path set-active-plan.cjs vì cần TKM_SESSION_ID không có trong hook).
2. Viết `.githooks/commit-msg` — nếu có active plan & msg thiếu slug & `SKIP_PLAN_REF!=1` → stderr warn (exit 0).
3. `chmod +x` cả hai; thêm `hooks:install` + `postinstall` vào `package.json`.
4. Chạy `npm run hooks:install`; test bằng commit thử (có/không trailer) xác nhận warn đúng, không chặn.
5. Viết PR template với các field bắt buộc.
6. Ghi 1 dòng onboarding: "sau clone chạy `npm run hooks:install`" (postinstall đã tự lo, đây là fallback).

## Todo
- [x] `active-plan.sh` helper — DONE: resolves plan slug from branch name (conventional prefix strip + newest dir match)
- [x] `commit-msg` hook warn-only + escape hatch — DONE: echoes plan reference nudge to stderr, exits 0, supports `SKIP_PLAN_REF=1`
- [x] `package.json` hooks:install + postinstall — DONE: `npm run hooks:install` sets `core.hooksPath`, `prepare` script auto-runs on install
- [x] chạy install + test warn path — DONE: verified warn/silent/escape-hatch all exit 0, commit succeeds
- [x] PR template — DONE: template requires plan link, evidence path, checklist (UI-gate/tests/docs)
- [x] onboarding note — DEFERRED (postinstall handles auto-install; `hooks:install` fallback documented in package.json scripts)

## Success criteria
- Commit thiếu plan ref khi có active plan → in cảnh báo, commit vẫn thành công.
- `SKIP_PLAN_REF=1 git commit` → im lặng.
- Clone mới + `npm install` → hook tự active (postinstall).
- PR mới hiện template ép link plan + evidence.

## Risk
- **core.hooksPath ghi đè husky/hook khác:** repo không có → an toàn. Nếu sau này thêm husky, cần hợp nhất.
- **postinstall phiền CI-less env:** giữ postinstall idempotent, fail-soft (|| true).

## Security
- Hook không đọc secret, không gọi mạng. Escape hatch chỉ tắt cảnh báo, không tắt secret-scan của `/tkm:git`.

## Next steps
- Sau P1: P2 tái dùng `.githooks/` infra cho `pre-push` docs-parity.
