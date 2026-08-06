# Phase 09 — `/rules` + `/notifications` (gỡ chặn)

**Track:** A · **blockedBy:** quyết định của user (không phải phase khác) · **Status:** blocked

## Hai màn này chưa chấm được — không phải vì code sai

### `/rules` — mâu thuẫn modal vs full-page
- Thể lệ UPDATE: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6 · node `3204:6051`
- Figma artboard **1440×1796** (trang dài, content trải hết, footer ở đáy).
- App render **modal cao cố định ~1024px**, scroll nội bộ, nút "Đóng"/"Viết KUDOS" giữa viewport.
- → 1024 vs 1796, không diff trực tiếp được. [Report](../reports/ui-gate/ui-gate-260805-rules.md)

**Cần user quyết:** Figma "Thể lệ" là **trang riêng** hay **modal**? Đây là câu hỏi thiết kế, đọc code không trả lời được.
- Nếu là trang → đổi `/rules` thành full-page, dựng band manifest, chấm bình thường.
- Nếu là modal → app đúng hướng, chỉ cần chốt lại chuẩn chấm (chỉ diff vùng modal, như `/kudos`).

### `/notifications` — ✅ ĐÃ GỠ CHẶN (2026-08-06)
Gate cũ báo BLOCKED vì resolve nhầm screenId ([report](../reports/ui-gate/ui-gate-260805-notifications.md)). `list_frames` tìm ra **2 màn riêng biệt**, khớp ảnh Figma user gửi:

| Màn | screenId | Figma node | Dạng |
|---|---|---|---|
| **View thông báo** | `gWBVcaSVIf` | `589:9152` | Dropdown panel mở từ chuông trên header — có "Xem tất cả" |
| **Tất cả thông báo** | `6-1LRz3vqr` | `589:9132` | Trang đầy đủ — có "Đánh dấu đọc tất cả" |

- https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/gWBVcaSVIf
- https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/6-1LRz3vqr

⚠️ Cả hai `spec_status: none` — **không có spec MoMorph**, chỉ có design. Behavior phải suy từ design + annotation, thiếu chỗ nào thì hỏi user, không tự chế.

Từ ảnh Figma: item thông báo có **icon màu theo loại** (thư/tim/quà/sao/cảnh báo/huy hiệu/cờ), tiêu đề + mô tả, timestamp tương đối ("16 phút trước"), **chấm đỏ = chưa đọc**, một số item có link ngoài ("Tiêu chuẩn cộng đồng ↗").

## Đầu việc (sau khi có câu trả lời cho /rules)
1. `/rules`: theo quyết định → dựng band manifest hoặc chuyển sang chuẩn chấm modal → sửa → re-gate.
2. `/notifications`: **2 gate riêng** — dropdown (`gWBVcaSVIf`) chấm như modal, chỉ diff vùng panel; page (`6-1LRz3vqr`) chấm full-page bằng band-diff. Đối chiếu app hiện tại xem đã có cả 2 dạng chưa.

## Out of scope
BE · các màn khác · **không đoán design khi thiếu reference** (vi phạm `.claude/rules/ui-first-gate.md`).
