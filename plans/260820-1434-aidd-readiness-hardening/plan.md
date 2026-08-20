---
title: AIDD Readiness Hardening — vá 4 nhóm lỗ hổng (Traceability, Docs anti-drift, Verification, Tooling read-only)
status: in-progress
revision: "260820-1520 — P1 DONE (runtime-verified), P2 DONE (code-verified), P3 PARTIAL (coverage floor + baseline set, e2e gap specs deferred — Supabase down), P4 CODE-DONE (readonly role migration written, runtime-verification pending — Supabase down). Reviewer APPROVED_WITH_CONDITIONS on forge; reviewer conditions addressed (stmt threshold 37→36, docs:sync printf newline, active-plan.sh convention comment)."
work_type: deliverable
spec_waived: "Infra/process hardening — không có product feature mới; config + git hooks + npm scripts + 1 migration read-only role. Behavior sản phẩm không đổi."
priority: high
created: 2026-08-20
branch: chore/aidd-readiness-hardening
level: medium
blockedBy: []
blocks: []
related: []
phases:
  - phase-01-traceability-plan-anchored
  - phase-02-docs-anti-drift
  - phase-03-verification-depth
  - phase-04-tooling-readonly-db
---

# AIDD Readiness Hardening

Vá các lỗ hổng từ brainstorm scorecard (2026-08-20). 5/7 tiêu chí đã mạnh (Context, Guardrails,
Workflow, Verification, Docs); mục yếu chính là **Traceability (3/10)**, kèm 3 nhược điểm phụ.

## Bối cảnh quyết định (từ user)
- **Không có ticket tracker** (Backlog/GitHub Issues) — đây là **dự án cá nhân**.
  → DROP hẳn việc "wire Backlog MCP" và "ép prefix ticket". Work-unit anchor = **plan directory**.
  → Traceability khả thi cho solo = *plan ↔ commit ↔ PR* (leg "ticket" là N/A, ghi rõ, không giả vờ có).
- **Enforce commit-msg:** warn-only trước, hard sau. Có escape hatch.
- **Gate venue:** git hooks local + npm scripts. **KHÔNG dựng CI mới** (repo hiện không có CI).

## Thực trạng repo (đã verify)
- Không có `.github/PULL_REQUEST_TEMPLATE.md`; không có `.github/workflows/` (no CI).
- Không có git-hook infra (no husky, `core.hooksPath` chưa set).
- `backlog` có trong permission `.claude/settings.json` nhưng KHÔNG có trong `.mcp.example.json` → bỏ qua.
- 46 unit + 11 e2e; `db:reset` seed thật (mock đã gỡ); có `aidd-ui-gate` + `aidd-spec-verify`.
- `supabase/migrations/` là source of truth cho schema.

## Phases (độc lập — không block nhau, chạm file khác nhau)

| # | Phase | Mục tiêu | File chạm chính |
|---|---|---|---|
| 01 | [Traceability (plan-anchored)](./phase-01-traceability-plan-anchored.md) | plan↔commit↔PR liền mạch | `.githooks/`, `package.json`, `.github/PULL_REQUEST_TEMPLATE.md` |
| 02 | [Docs anti-drift](./phase-02-docs-anti-drift.md) | docs không lệch code | `.githooks/pre-push`, `package.json`, `scripts/` |
| 03 | [Verification depth](./phase-03-verification-depth.md) | e2e dày + coverage floor | `vitest.config.*`, `e2e/`, `package.json` |
| 04 | [Tooling read-only DB](./phase-04-tooling-readonly-db.md) | psql read-only role | `supabase/migrations/`, docs |

## Thứ tự thực thi đề xuất
P1 → P2 → P3 → P4 (giảm dần lợi ích/công). Có thể chạy song song vì không chung file, nhưng
P1 dựng `.githooks/` infra mà P2 dùng lại (pre-push) → **P1 làm trước P2**.

## Dependency
- P2 tái dùng git-hook infra do P1 tạo (`core.hooksPath=.githooks` + `npm run hooks:install`).
- P3, P4 độc lập hoàn toàn.

## Success (toàn plan)
- Mọi commit/PR mới truy về được plan dir; PR template ép link plan + evidence.
- `npm run docs:sync` + pre-push cảnh báo khi docs lệch src.
- Coverage floor enforced; e2e cover thêm flow chính.
- Agent đọc DB qua role read-only, không ghi được.
- KHÔNG thay đổi behavior sản phẩm; KHÔNG dựng CI.

## Out of scope
- Dựng GitHub Actions CI (user chọn local hooks).
- Tích hợp tracker ngoài (không có tracker).
- Refactor feature code sản phẩm.
