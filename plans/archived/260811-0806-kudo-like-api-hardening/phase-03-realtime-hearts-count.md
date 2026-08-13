# Phase 03 — `liked_by_me`/count server-side (privacy + perf)

**Track:** B·Like · **Scope:** core (SHRUNK) · **Priority:** P2 · **blockedBy:** 01

## Đã verify: realtime ĐÃ ĐÚNG — không build lại
- `use-board-feed.ts:91–124` subscribe hearts **INSERT + DELETE** (unlike propagate ✓, debounce 300ms).
- `use-highlights.ts:63–80` subscribe hearts INSERT+DELETE cho carousel ✓.
→ **BỎ** phần "build realtime subscription" trong plan gốc. Realtime multi-user đã hoạt động.

## Vấn đề còn thật: `liked_by_me` feed rò danh tính + O(N)
`board-queries.ts:278/306` select `hearts(user_id, is_special_day)` → **ship toàn bộ user_id của MỌI người đã like** mỗi kudo về browser, chỉ để tính `hearts.length` + `hearts.some(uid)` client-side (`:347–350`). Với kudo nhiều tim ở event → tải hàng trăm row/thẻ × 20 thẻ. Rò danh tính liker + nặng.

(Đối chiếu: `get_highlight_kudos` đã làm ĐÚNG — count + `liked_by_me` server-side, chỉ trả boolean. Feed nên theo mẫu này.)

## Fix
Tính `heart_count` + `liked_by_me` **server-side** cho feed, chỉ trả về number + boolean (không trả mảng user_id):
- Ưu tiên: **feed RPC** `get_board_feed(p_cursor, p_limit, p_hashtag, p_department)` security-definer — mirror mask của `kudos_public`, `count(hearts)` + `bool_or(h.user_id = auth.uid())`, giữ nguyên filter (phase-06 đã có ở query hiện tại → port vào RPC). 
- Hoặc nhẹ hơn (nếu không muốn RPC): PostgREST `hearts(count)` aggregate + `hearts!inner(user_id).eq(user_id, uid)` cho liked_by_me — nhưng RPC sạch hơn cho cursor + filter.

## Files
- **Modify/Create:** `src/features/board/board-queries.ts` — thôi select mảng hearts; dùng RPC/aggregate trả `heart_count`+`liked_by_me`. (+ migration nếu tạo `get_board_feed` RPC.)
- **Modify:** `src/features/board/use-toggle-heart.ts` — optimistic khớp phase-01 RPC `{liked, heartCount}`; **lọc self-echo** realtime (event `user_id === uid`) để không double-count với optimistic.

## Constraint
Không đụng UI layout (đã qua gate). Chỉ đổi nguồn data.

## Todo
- [ ] Feed `heart_count` + `liked_by_me` server-side (RPC/aggregate) — thôi ship user_id list
- [ ] Optimistic (use-toggle-heart) khớp RPC return + lọc self-echo
- [ ] tsc clean

## Success Criteria
- Feed không còn trả mảng user_id liker về client.
- `liked_by_me`/count đúng, không client O(N).
- Own toggle: optimistic + realtime echo không double-count.

## Risks
- Đổi shape query → cập nhật type + mọi consumer của `BoardKudoRow`.
- Self-echo double count → lọc theo uid (đã note).
