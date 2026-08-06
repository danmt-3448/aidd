# Phase 05 — `/` Homepage

**Track:** A · **blockedBy:** 04 · **Status:** pending

## MoMorph refs
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Figma node `2167:9026` · artboard **1512×4480** (scale → 1440×4266) · app **1440×4326**
- Gate cũ: [ui-gate-260805-homepage.md](../reports/ui-gate/ui-gate-260805-homepage.md) — 22.6%
- Plan cũ (tham khảo, đã bị phase này thay thế): [260805-1353-home-ui-parity-check-fix](../260805-1353-home-ui-parity-check-fix/plan.md)

## Goal
Mọi band ≤1% @1440 + 1280 → PASS `/aidd-ui-gate /`.

## Đã biết trước
Report cũ chốt: **layout đúng, thiếu badge tròn vàng (asset) trong awards grid**. Chênh chiều cao chỉ 60px (4266 vs 4326) → 22.6% gần như chắc chắn là **drift tích luỹ**, không phải sai cấu trúc. Band-diff sẽ khoanh đúng chỗ.

## Đầu việc
1. Band manifest từ `get_node(2167:9026)`; artboard 1512 → nhớ scale hệ số 1440/1512 = 0.9524 khi quy đổi refY/refH.
2. Export badge tròn vàng bằng `get_media_files` — **verify là PNG/SVG thật**, không phải XML AccessDenied. Signed URL hết hạn ~10 phút, tải ngay.
3. Sửa từng band fail → re-gate.

## Lỗi đã xác nhận (2026-08-06, đối chiếu code)
- ❌ **Award grid thiếu ảnh riêng (cùng lỗi awards).** `homepage-award-card.tsx:48` hardcode CHUNG `/homepage/award-card-bg.png`; data từ `award-config` (DRY, chưa có field `image`). → Sau khi phase-03 thêm `award.image`, homepage render luôn ảnh đó. **Sửa 1 lần ở config, 2 màn cùng hết lỗi.**
- ❌ Icon target `fill="white"` (dùng chung `icon-target.svg`) — theo phase-03.

## ✅ FIX 2026-08-06 (verified Playwright)
- **Widget FAB rebuild** — expanded giờ = 2 pill vàng `#FFEA9E` (`⚡ Thể lệ`→/rules TRÊN, `✏ Viết KUDOS`→compose DƯỚI) + nút X đỏ `#EF4444`. Verified: expanded ✓, href/handler ✓, thứ tự ✓, label "Viết KUDOS" ✓. Giữ fixed/Esc/outside-click/auth-gate. (⚠ hex X đỏ tạm #EF4444 — verify node khi MoMorph reachable.)
- **Icon awards** — `icon-target/diamond/gift.svg` đổi `fill:white → #FFEA9E` (token vàng trang). (MoMorph export = white; #FFEA9E là token label cạnh icon — verify node khi MCP reachable.)
- ⏸ **Keyvisual objectPosition** — HELD: cần vị trí fill từ Figma; MoMorph + figma MCP đều Unauthorized/rate-limit lúc fix. KHÔNG đổi mù. Đã xác nhận không có overlay tối trong code.

## Widget FAB (Frame 525) — annotation Figma + audit code (2026-08-06)
NOTE Figma: *"Button sẽ được fix cứng ở vị trí này trên màn hình"* → **position:fixed** (code đã đúng: `homepage-widget-fab.tsx:71` fixed).

Đối chiếu spec (image #6) vs `homepage-widget-fab.tsx`:
- **Collapsed:** pill 2 icon — Figma pen `/` **lightning ⚡**; code pen `/` `icon-kudos-logo`. ⚠️ verify icon thứ 2 (lightning hay logo) theo node.
- ❌ **Expanded SAI hẳn.** Figma = **các pill VÀNG riêng lẻ**: `⚡ Thể lệ` (trên) + `✏ Viết KUDOS` (dưới) + **nút X ĐỎ tròn đóng**. Code = 1 dropdown TỐI (`rgba(16,20,23,0.96)`+blur) 2 dòng text trắng. → phải dựng lại theo Figma.
- ❌ **Thứ tự ngược:** Figma `Thể lệ` trên, `Viết KUDOS` dưới; code `Viết Kudo` trên, `Thể lệ` dưới.
- ❌ **Thiếu nút X đỏ** đóng (Figma có); code chỉ đóng bằng outside-click/Esc/toggle.
- ⚠️ **Label:** Figma `Viết KUDOS` (hoa); code `Viết Kudo`.
- ✅ **Behavior wiring ĐÚNG:** `Thể lệ` → `/rules` (Link), `Viết Kudo` → `onWriteKudo()` (mở KudoComposeModal), auth-gated (chỉ render khi có user), Esc/outside-click đóng.
- 🔢 Lấy màu/size/spacing pill + X đỏ từ MoMorph `get_node` widget (mms_6_Widget Button) khi dựng — không guess.

## Out of scope
Shared chrome (phase-04) · BE · các màn khác.

## Rủi ro
Artboard 1512 chứ không phải 1440 → sai hệ số scale là hỏng toàn bộ band manifest. Kiểm bằng cách đối chiếu 1 band đã biết đúng trước khi dựng cả bộ.
