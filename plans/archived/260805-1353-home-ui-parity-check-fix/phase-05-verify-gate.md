---
title: "Verify — UI gate 1440 + 1280"
phase: 05
priority: CRITICAL
status: pending
blockedBy: [02, 03, 04]
spec_source: momorph:i87tDx10uM
---

# Phase 05 — Verify (UI-First Gate, visual portion)

**Role:** code-reviewer · **Skill:** `/aidd-ui-gate /` (route) — visual portion only.

**Goal:** Confirm the fixed Homepage passes **pixel-perfect ≥ 99% (pixel-diff ≤ 1%)** vs Figma at
**1440 (ưu tiên 1)** and **1280 (ưu tiên 2)**. Verdict bằng auto pixel-diff + screenshot thật
(fullPage), KHÔNG tin report "DONE" của phase fix.

## Steps

1. `npm run dev`, Playwright navigate `/?ui_state=full` (mock, độc lập BE), screenshot fullPage @ 1440
   rồi @ 1280 (cả trang tới footer).
2. Chạy `scripts/pixel-diff.mjs` vs ảnh Figma reference (mask countdown/avatar, `--aa`) → ghi ratio %
   mỗi viewport. PASS khi ≤ 1%.
3. Walk lại drift table phase-01: mọi row phải resolved (chuẩn pixel-perfect — không còn "MINOR bỏ qua").
4. Xác nhận: đúng layout composition (full-width vs cột), asset ảnh render đúng, không overflow ngang /
   vỡ layout / đè-cắt chữ @ 1280.
5. Emit PASS/FAIL report.

## Success criteria (PASS)

- [ ] 1440 pixel-diff ≤ 1% — layout/màu/font/element/vị trí đúng
- [ ] 1280 pixel-diff ≤ 1% — không overflow / vỡ / cắt chữ
- [ ] Tất cả drift row đã đóng (chuẩn pixel-perfect)
- [ ] Assets là ảnh thật, không CSS-fake
- [ ] Report PASS/FAIL viết vào `plans/reports/reviewer-260805-home-ui-gate-verify.md`

## On FAIL

- Ghi rõ row nào còn drift + owner phase → loop lại phase fix tương ứng (max 2 vòng → escalate user).

## Out of scope

- Behavior / 4-state / integration / test — deferred (visual-only pass, per plan scope).
