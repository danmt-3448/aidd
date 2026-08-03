# Clarifications — SAA 2025 Remaining 7 Screens

## Session 2026-08-03

- Q: Scope của plan làm tiếp → A: Cả 7 màn spec-ready chưa build, cấu trúc 3 wave (Wave 0 shared backend → Wave 1 landing/static → Wave 2 interactive core)
- Q: Notification bell trên Homepage SAA xử lý thế nào → A: Build notification service đầy đủ (table notifications + unread badge + Supabase Realtime) — đưa vào Wave 0, Homepage phụ thuộc
- Q: Live board cập nhật real-time bằng cơ chế nào → A: Supabase Realtime (postgres_changes trên kudos + hearts)
- Q: Spotlight word-cloud render thế nào → A: Client-side SVG/CSS over flat recipient aggregation (KISS)
- Q: Secret Box unopened_box_count được cấp thế nào → A: Consume-only round này (mở + decrement + weighted-random badge server-side); cơ chế grant box (admin/event) ngoài scope, seed thủ công để test
- Q: Anonymous kudos có tính vào "sent" count không → A: Có (theo test case), nhưng sender identity masked ở received feed của người khác
- Q: Secret box badges hiển thị trên Profile → A: 6 slot greyed (badge unlock logic deferred), chỉ hiện counter opened/unopened
