# Phase 03 — Hover states: avatar popover + tier tooltip

**Priority:** High · **Status:** ⏳ · **Track:** A (behavior mock)
**Goal:** 2 interactive state từ Figma annotation (MoMorph brief thiếu) — hover avatar → user popover, hover danh hiệu → tooltip mô tả tier.

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260805-1117-board-highlight-spotlight-rework/clarifications.md
- Nguồn state: ảnh Figma annotation user gửi (Hover Avatar info user · Hover danh hiệu).

## Spec (nhóm B)
1. **Hover Avatar → popover** (TC 6b1e2359 hover preview): hover avatar người gửi/nhận (feed card, sidebar, spotlight node) → card nổi hiện:
   - avatar + tên + dòng role/phòng ban + tier pill (vd "Legend Hero")
   - "Số Kudos nhận được: {n}" · "Số Kudos đã gửi: {n}"
   - nút **"Gửi KUDO"** (gold) → mở compose modal tới người đó
   - Click avatar/tên vẫn → profile (giữ nguyên navigation hiện có).
2. **Hover danh hiệu (tier badge) → tooltip**: hover pill tier (New/Rising/Legend/Super Hero) → tooltip mô tả điều kiện đạt tier. Thay `title` attr bằng tooltip custom (giữ a11y: focus/keyboard hiện được, `aria-describedby`).

## Việc làm
1. Tạo `board-user-hover-card.tsx` (popover) — nhận props user (tên, role, dept, tier, kudosReceived, kudosSent, onSendKudo, onOpenProfile). Presentational, mock data.
2. Wire vào `board-card-person-block.tsx` (avatar feed card) + sidebar avatar + spotlight node → bọc trigger hover/focus. Dùng Radix (shadcn `hover-card`/`tooltip`) nếu đã có, hoặc popover nhẹ; KHÔNG thêm dep nặng.
3. Tạo `feed-card-tier-tooltip` (hoặc mở rộng `feed-card-tier-badge.tsx`) — tooltip mô tả tier; map điều kiện tier lấy từ `award-config`/tier data có sẵn (không bịa nội dung — nếu thiếu text mô tả, lấy từ MoMorph/Figma tier node).
4. Mock: bổ sung field kudosReceived/kudosSent/tierDesc vào mock fixtures nếu thiếu (từ Figma: 25/25). `tsc --noEmit` sạch, file <200d.

## Files
- Tạo: `board-user-hover-card.tsx` (+ tách nếu >200d)
- Sửa: `board-card-person-block.tsx`, `feed-card-tier-badge.tsx`, sidebar avatar block, spotlight node; mock fixtures.
- Kiểm shadcn `src/components/ui/` có `hover-card`/`tooltip` chưa; thiếu thì thêm primitive (copy-in), không thêm lib ngoài.

## Success
- Hover avatar bất kỳ → popover đúng nội dung; nút Gửi KUDO mở compose; keyboard focus hiện popover.
- Hover/focus tier badge → tooltip mô tả; 0 console error.
- Handoff: gate ở Phase 05.

## Out of scope
- Không đụng BE. Không đổi navigation click→profile hiện có. Không viết test (Phase 05).
