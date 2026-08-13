# Clarifications — Home UI Parity Check & Fix

## Session 2026-08-05

- Q: Phạm vi check màn Home lần này → A: Chỉ visual fidelity @ 1440 + 1280; bỏ qua behavior/4-state/interactive
- Q: Chuẩn visual fidelity → A: NÂNG từ ~95% lên PIXEL-PERFECT ≥ 99% (pixel-diff ≤ 1%), áp cho cả skill aidd-ui-gate + rule ui-first-gate + CLAUDE.md + fe-developer role
- Q: "Check pixel" thực thi bằng gì → A: Auto pixel-diff (pixelmatch, script scripts/pixel-diff.mjs) screenshot vs ảnh Figma; bật AA tolerance (includeAA:false) + mask vùng động (countdown/avatar); PASS khi ratio ≤ 0.01
- Q: Chuẩn đối chiếu UI khi MoMorph frame và Figma mâu thuẫn → A: MoMorph + Figma trực tiếp, Figma thắng; ảnh render thắng brief
- Q: Home screenId → A: i87tDx10uM (Figma node 2167:9026), route `/`, đã build ở phase-11 plan 260803-1636
- Q: Breakpoint chấm → A: 1440 (ưu tiên 1) + 1280 (ưu tiên 2), bỏ 768/375 theo ui-first-gate.md
- Q: KudosPromo banner ownership → A: Shared với /awards (plan 260804-1452 A-06); phase-04 KHÔNG edit, chỉ defer nếu có drift
- Q: Khi chạy aidd-ui-gate mà BE lỗi thì làm sao render UI để chấm → A: Mock data đầy đủ density từ Figma (?ui_state=full, dev-only), gate độc lập BE, không block; homepage thiếu mock → tạo homepage.mock.ts + nhánh ?ui_state ở connected layer
- Q: Container/spacing drift quanh section (screen.tsx) thuộc phase nào → A: Owner = P02 (shell), P03/P04 chỉ sửa nội bộ component, tránh clash song song
- Q: Countdown "0 0 0 0 0 0" có phải drift không → A: Không — countdown value là behavior, out of scope; chỉ chấm layout/style flip-card
