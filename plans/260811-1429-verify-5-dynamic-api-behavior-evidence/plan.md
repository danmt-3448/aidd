# Plan — Verify 5 Dynamic Screens: API + Behavior + Test Evidence

**Created:** 2026-08-11 · **Branch:** develop · **Status:** DRAFT (awaiting approval)

## Goal
Đảm bảo 5 màn động **thực sự** wire API đúng, behavior rõ ràng đúng spec, và có **evidence test cụ thể** (E2E trên UI thật + unit) — không dừng ở "code có". Chốt bằng test chạy pass trên DB thật + screenshot.

## Scope
- **In:** board, profile, kudos (Viết Kudo), secret-box, homepage.
- **Out (pending):** notifications (spec F007 mâu thuẫn — chờ quyết C1). Static (awards/rules/countdown) + auth: chỉ smoke; test đầy đủ **sau** khi 5 màn động xong.
- **Final:** sau 5 màn → verify lại toàn bộ app (phase-06).

## Approach (chốt với user 2026-08-11)
- DB: **colima + Supabase local** (tôi dựng) + seed demo data → reset được, test data thật.
- Evidence bar: **MoMorph TC Priority=High + happy/error + business-rule critical**; E2E Playwright (UI thật) + Vitest unit cho logic/validation. Evidence = test output + screenshot.
- UI-First: các màn đã build+integrate → **gate = confirm** (không rebuild). Nếu fix bug làm đổi UI → chạy `/aidd-ui-gate` màn đó trước khi tiếp.

## Phases
| # | Phase | Owner role | Depends |
|---|---|---|---|
| 01 | [DB up + demo-data seed](phase-01-db-and-demo-data.md) | be-developer | — |
| 02 | [Test-case matrix (MoMorph → gap vs e2e)](phase-02-test-matrix.md) | test-writer | — |
| 03 | [Runtime spec-verify seal](phase-03-runtime-spec-seal.md) | code-reviewer | 01 |
| 04 | [Write/expand tests per screen](phase-04-tests-per-screen.md) | test-writer | 01, 02 |
| 05 | [Run tests + evidence + gate confirm](phase-05-run-and-evidence.md) | test-runner | 04 |
| 06 | [Whole-app verify + docs](phase-06-whole-app-verify.md) | code-reviewer + doc-writer | 05 |

## Dependency shape
```
01 (DB+seed) ─┬─► 03 (runtime seal) ─────────────┐
              └─► 05 (run tests) ◄── 04 ◄─ 02    ├─► 06 (final verify)
02 (matrix) ──────────────────────► 04 ──────────┘
```
- 01 blocks everything needing DB (03, 05). 02 blocks 04. 04 blocks 05. 03 feeds 04/06. 06 last.

## Key risks
- **colima cold start** kéo VM ~vài phút + tốn RAM/CPU máy user (đã được authorize).
- **Không có demo seed** → phải viết (phase-01); density phải giống Figma (board word-cloud ~45–50 tên…).
- E2E cũ **chưa cover V1/V2/V3** (profile fixes vừa làm) + có thể fail sau reset → phase-04 bổ sung, phase-05 fix theo DEV↔QA loop (max 3 vòng).
- Turbopack dev có thể lỗi hydration cho behavior check → dùng prod build khi cần (memory [[ui-gate-turbopack-headless-hydration]]).

## Definition of Done
Mỗi màn: API wire xác nhận · behavior đúng spec (High TC) có test pass trên UI thật + DB seed · business-rule critical seal bằng runtime · UI-gate confirm PASS · evidence lưu `evidence/`. Cuối: full E2E xanh + spec-verify runtime-sealed + docs cập nhật.
