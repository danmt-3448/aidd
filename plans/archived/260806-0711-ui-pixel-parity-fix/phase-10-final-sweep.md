# Phase 10 — Re-gate toàn bộ + đóng

**Track:** Verify · **blockedBy:** 03, 04, 05, 06, 07, 08, 09 · **Status:** pending

## Goal
Chạy `/aidd-ui-gate` lại toàn bộ 11 màn trên cùng một chuẩn (band-diff) và chốt bảng kết quả cuối.

## Đầu việc
1. **Re-gate tất cả**, kể cả 3 màn đang PASS (`countdown` 0.39%, `login` 0.44%, `secret-box`) — chống hồi quy do phase-04 sửa shared chrome.
2. Bảng tổng: mỗi màn × {1440, 1280} × mỗi band → ratio + heightDelta.
3. Behavior nhóm B: 4 state `?ui_state=` × mọi màn + 0 console error.
4. Report `plans/reports/ui-gate/ui-gate-{date}-final-sweep.md`.

## Dọn nhà (nợ đang tồn)
- Ảnh gate đang nằm **sai chỗ ở root repo**: `awards-actual.png`, `board-full-actual.png`, `countdown-*.png`, `homepage-actual.png`, `kudos-modal-actual.png`, `login-*.png`, `notifications-actual.png`… → chuyển hết vào `plans/reports/_gate-ref/`, thêm `.gitignore` cho ảnh tạm. Skill đã quy định "report chỉ ghi vào `plans/reports/`" nhưng đang bị vi phạm.
- Xoá `.gate-shot.mjs` ở root hoặc đưa vào `.claude/skills/aidd-ui-gate/scripts/`.

## Đóng plan
- Cập nhật `status: completed` + kết quả cuối vào `plan.md`.
- Gỡ `blocks` sang 3 plan cũ; đánh dấu phần đã bị thay thế trong `260804-1452-ui-parity-fixes`, `260805-1353-home-ui-parity-check-fix`, `260805-1117-board-highlight-spotlight-rework`.
- **Chỉ sau khi mọi màn PASS** mới mở cửa: integration → viết test (e2e/unit) → review → ship. Trước đó cấm theo `.claude/rules/ui-first-gate.md`.

## Success criteria
- [ ] Mọi màn có Figma ref: mọi band ≤1% @1440 + 1280, `|heightDelta| ≤ 2px`
- [ ] Behavior 100%: 4 state đúng, 0 console error/warning
- [ ] 3 màn đang PASS không bị hồi quy
- [ ] Root repo sạch ảnh gate
- [ ] Màn còn BLOCKED (nếu user chưa cấp ref) được ghi rõ, không giấu
