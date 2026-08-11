# Phase 06 — Whole-app verify + docs

**Priority:** High · **Owner:** code-reviewer + doc-writer · **Depends:** 05

## Goal
User yêu cầu "sau khi 5 page động xong thì verify lại toàn bộ". Xác nhận cả app coherent, không regression, docs khớp.

## Steps
1. **Full spec-verify re-run (runtime-sealed):** re-run `/aidd-spec-verify` 5 màn với DB up — lần này fetch spec MoMorph ở MAIN thread (tránh lỗi provenance [[spec-verify-subagent-momorph-empty]]) + SQL/browser proof. Verdict tổng mỗi màn phải PASS (0 VIOLATED runtime).
2. **Full E2E suite** xanh cả 3 project (public/authed/admin) — không chỉ per-screen.
3. **Cross-screen flows:** login → homepage → board → viết kudo → xuất hiện feed → profile người nhận → secret-box. 1 luồng E2E xuyên màn.
4. **Reviewer pass** (`/tkm:review-code`) trên toàn diff của đợt này (seed, tests, fixes).
5. **Docs** (doc-writer): cập nhật `docs/project-changelog.md` (V1/V2/V3 fix + test coverage) + `docs/development-roadmap.md` (5 màn động: verified). Note notifications còn pending (C1).
6. Consolidated `plans/.../reports/final-verify-report.md`: per-screen API✓/behavior✓/evidence link/gate✓ + danh sách còn treo (noti C1, static screens, runtime bug nếu có).

## Success criteria
- [ ] 5 màn: spec-verify PASS[runtime] + E2E xanh + gate PASS + evidence đầy đủ.
- [ ] Cross-screen flow E2E xanh.
- [ ] Reviewer APPROVED; docs cập nhật.
- [ ] Final report liệt kê rõ phần đã seal vs còn pending.

## Open questions (đưa user cuối report)
- Notifications F007 scope (C1) — quyết để mở lại notifications.
- Static screens (awards/rules/countdown) + auth: test đầy đủ ở đợt sau?
