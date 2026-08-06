# UI-First Gate — /kudos (Viết Kudo modal, ihQ26W78P2) — **visual FAIL (near) · structure OK** (run 1)

Port: localhost:3001 · ref node 520:11602 · 1440×1024. `/kudos` **redirect → /board**; modal mở qua nút "Viết lời cảm ơn và ghi nhận".

## A. Visual — **15.4% (FAIL)** nhưng phần lớn không phải modal
- Modal "Gửi lời cảm ơn và ghi nhận đến đồng đội" **cấu trúc khớp đủ**: Người nhận*, Danh hiệu*, rich-text toolbar (B/I/S/list/link/quote + "Tiêu chuẩn cộng đồng"), Hashtag* (+Hashtag tối đa 5), Image (+Image tối đa 5), checkbox "ẩn danh", Hủy/Gửi (vàng).
- Diff 15.4% do 3 nguồn (xem `_gate-ref/kudos-1440-diff.png`): (1) **modal lệch vị trí dọc ~15-20px** (text ghosting), (2) **background board khác** (board đang empty, art khác ref — issue của /board), (3) **Image**: ref có 5 ảnh mẫu, app trống (state compose ban đầu đúng — data-density khác, không defect).
- Console localhost: **0 error**.

## B. Behavior — partial
- ✅ Modal mở từ board button. Field đầy đủ, interactive. Close (Hủy) chưa test. Validation Gửi chưa test.

## Verdict: **FAIL visual (cần polish vị trí modal ~15-20px)** — cấu trúc đúng. Background diff là của /board (gate riêng). → cần 1 FE polish căn vị trí modal khớp node 520:11602.
