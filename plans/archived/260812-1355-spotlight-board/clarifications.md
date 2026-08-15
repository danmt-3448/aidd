# Clarifications — Spotlight Board

## Session 2026-08-12
- Q: ⤢ bottom-right button behavior (spec B.7.2 says Pan/Zoom toggle) → A: Fullscreen toàn màn hình (immersive event display); pan/zoom stays on mouse
- Q: Search + Enter/magnifier behavior → A: Navigate to matched Sunner's profile (/profile?id=receiverId); live-highlight in cloud as you type
- Q: Activity feed data source → A: 6 most-recent kudos from DB on load + realtime prepend (feed always populated)
- Q: Search khớp nhiều tên khi Enter → A: Dropdown match-picker (hiện danh sách Sunner khớp để user chọn), không phải best-match tự nhảy
- Q: ⤢ giờ = fullscreen, còn giữ nút reset pan/zoom riêng không? → A: Giữ nút reset nhỏ cạnh nút fullscreen (handleReset stays)
