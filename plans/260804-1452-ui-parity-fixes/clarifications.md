# Clarifications — UI Parity Fixes

## Session 2026-08-04

- Q: Countdown label VN (NGÀY/GIỜ/PHÚT) vs Figma EN (DAYS/HOURS/MINUTES) → A: Giữ VN theo i18n — render theo locale người dùng là đúng; Figma chỉ là artboard EN. Phase-04 KHÔNG đổi string VN, chỉ xác nhận string 2 locale đúng; countdown label không tính là parity bug.
- Q: Kudos modal counter "0/2000" ký tự (không có trong Figma) giữ hay bỏ → A: Giữ — coi là cải tiến UX có chủ đích. Phase-08 giữ counter, không cần product sign-off thêm.
- Q: Bước kế sau khi tạo plan → A: Validate plan trước (plan-reviewer) rồi mới build (PLAN-FIRST).
- Q: Field "Danh hiệu" chưa có cột DB — xử lý phase-08 thế nào → A: Thêm migration cột `danh_hieu` vào bảng `kudos` + sửa RPC `create_kudo` nhận field (fix đủ, persist thật). Track B phase mới; phase-08 wire-submit blockedBy phase migration này. Đụng RPC nhạy cảm (anonymity) → phải re-test kudos_public masking + Realtime publication không lộ thêm cột.
