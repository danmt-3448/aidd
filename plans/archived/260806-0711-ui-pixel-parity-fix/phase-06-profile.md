# Phase 06 — `/profile`

**Track:** A · **blockedBy:** 02, 04 · **Status:** ✅ PASS (2026-08-06, verified vs live get_node — see plans/reports/ui-gate-260806-1850-phases-05-10-summary.md)

## MoMorph refs
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Figma node `362:5037` · artboard **1440×4660** · app **1440×1104**
- Gate cũ: [ui-gate-260805-profile.md](../reports/ui-gate/ui-gate-260805-profile.md) — FAIL

## Goal
Mọi band ≤1% @1440 + 1280 → PASS `/aidd-ui-gate /profile`.

## Vấn đề gốc: THIẾU DATA, chưa phải lệch layout
App cao 1104px vs Figma 4660px — **hụt 3556px**. Không phải drift, mà là màn rỗng: không có kudos list, stats, badges. Chấm visual lúc này vô nghĩa. **Phải có fixture (phase-02) trước.**

## Đầu việc
1. Fixture `src/features/profile/mocks/profile.mock.ts` — density bằng Figma: kudos list đủ số card, stats đủ ô, badges earned đủ huy hiệu. Content từ `get_frame_image` + `get_node`, không bịa.
2. Hero artwork banner — report cũ nói thiếu; export asset thật qua `get_media_files`, render `<Image>`. **Cấm dựng lại bằng CSS/text.**
3. Đối chiếu label stats theo node `362:5037` (không tự đặt tên nhãn).
4. Band manifest → sửa tới ≤1% → re-gate.

## Out of scope
Shared chrome (phase-04) · BE/queries · 4 state khác `full` chỉ cần render đúng, không cần đủ density.

## Success
- [ ] App cao xấp xỉ 4660px ở `?ui_state=full`
- [ ] Mọi band ≤1%, `|heightDelta| ≤ 2px`
