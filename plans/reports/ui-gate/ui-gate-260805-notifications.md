# UI-First Gate — /notifications (Tất cả thông báo) — **BLOCKED (visual)** (run 1)

Port: localhost:3001.

## A. Visual — **BLOCKED**
- `get_frame_image` **không có ảnh** cho cả `6-1LRz3vqr` (Tất cả thông báo) lẫn `D_jgDqvIc8` (Notification) → **không có Figma reference desktop**. Theo gate rule: KHÔNG tự chấm visual bằng trí nhớ ⇒ BLOCKED.
- App render sạch: top-nav (logo Sun Annual Awards, About SAA 2025 / Award Information / Sun* Kudos, VI selector, bell, avatar) + heading "Tất cả thông báo" + **empty state** ("🔔 Chưa có thông báo nào").
- Console localhost: **0 error**.

## B. Behavior — partial
- Empty state render đúng. `?ui_state=full/error/loading` + đọc-thông-báo chưa verify (không có ref visual để đối chiếu; behavior list cần Figma/spec).

## Verdict: **BLOCKED (visual — thiếu Figma frame image)**. App render OK, 0 error. → skip theo "block thì đi tiếp", cần user cung cấp ảnh Figma / screenId đúng cho notifications.
