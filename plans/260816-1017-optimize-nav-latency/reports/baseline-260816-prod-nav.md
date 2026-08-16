# Baseline — Nav latency (PROD build) · 260816

Env: `next build && next start` (prod, port 3000) · Supabase local · seeded (30 users/71 kudos) · authed non-admin (`tran.thi.binh@`, via /dev-login) · event **post-launch** (board reachable).
Method: temporary `[perf]` logs at 3 auth call-sites (`middleware.updateSession`, `get-is-admin`, `board/page`) — **reverted after**; server stdout counted; browser network via Playwright MCP.

## Câu hỏi "API nào bị call/spam mỗi page" — ĐÁP

### ✅ Không spam kiểu polling
- KHÔNG có `refetchInterval` (0 chỗ). `refetchOnWindowFocus: false`. Không refetch định kỳ.

### 🔴 Spam kiểu FAN-OUT trên mount (đây mới là vấn đề)
1 lần mở `/board` → **8× `POST /board` (server actions)** — mỗi board hook là 1 action HTTP riêng:
`useBoardFeed · useHighlights · useSpotlight · useSpotlightActivity · useBoardUserStats · useGiftLeaderboard · useHashtagList · useDepartmentList` (+ `useUnreadCount`, `useToggleHeart`=mutation).
→ 8 round-trip HTTP song song, **mỗi cái đi qua middleware (getUser) + có thể getUser lần nữa bên trong action**.
Cộng: 1× `POST /rest/v1/rpc/list_recent_activity` gọi thẳng Supabase từ browser.

### 🔴 getUser round-trip mạng (server→Supabase, KHÔNG thấy ở DevTools)
**1 lần render `/board` (đo cô lập) = 3× getUser:**
| Call-site | Thời gian |
|---|---|
| `middleware updateSession` (`/board`) | 46 ms |
| `board/page.tsx` getUser | 37 ms |
| `getIsAdmin` getUser | 3 ms |
| **Tổng auth serial trước content** | **~86 ms** |

**MỖI server action `POST /board` cũng chạy middleware getUser** (24–102 ms/lần). Login→board window: **19× `MW getUser`** tổng.

### 🔴 Prefetch tax (xác nhận red-team F5)
Mỗi page prefetch ~3 route anh em (`<Link>` — hoá ra CÓ prefetch, không phải "không có" như giả định ban đầu). Mỗi prefetch = 1 full `MW getUser`:
- Ví dụ ở `/profile`: prefetch `/board 67ms`, `/ 68ms`, `/awards 107ms`, lặp lại vòng 2 (`/awards 118ms`, `/board 104ms`, `/ 128ms`).
→ Chỉ *ghé* 1 page = thêm ~3–6 getUser mạng (~100 ms/cái) cho prefetch, mỗi cái là auth round-trip.

## Con số middleware getUser (đắt nhất, lặp nhiều nhất)
`MW getUser`: **24–134 ms/call**, chạy trên **mọi** request: document + mỗi server action + mỗi prefetch. Đây là thuế per-request lớn nhất.

## Kết luận cho plan (gate)
- **Phase 06 (getClaims trong middleware) = đòn số 1, xác nhận bằng số.** Mỗi `MW getUser` ~40–130 ms → local verify ~0. Với 8 server-action + prefetch, cắt cái này giảm auth tax gần như toàn bộ nav.
- **PHÁT HIỆN MỚI (chưa có trong plan): board fan-out 8 server action.** Gộp initial fetch của board về 1–2 RPC/action sẽ cắt cả "spam" lẫn 8× middleware-getUser. **Ưu tiên cao — thêm phase.**
- **Phase 02 (dedupe page getUser 2→1):** xác nhận có 2 getUser/render page (board/page + getIsAdmin) → cache() gộp còn 1. Đúng, giữ.
- **Phase 04 (prefetch) làm SAU Phase 06:** prefetch đang nhân getUser (~100 ms × 3–6/page). Chưa fix getUser mà chỉnh prefetch sẽ khuếch đại. Cân nhắc cả **giảm prefetch scope** (prefetch nhiều route đắt vì mỗi cái 1 auth round-trip).
- **Phase 03 (proxy DB query):** event_config + profiles vẫn song song → latency phụ; ưu tiên thấp so với getUser tax. Giữ ưu tiên thấp / cân nhắc drop.

## Unresolved / đã làm rõ
- **Làm rõ:** board data query KHÔNG gọi getUser nội bộ (chỉ `board-queries.ts` có 1, dùng cho feed+highlights). ⇒ cost getUser chính = **middleware getUser trên mỗi `POST /board`** (8 lần), KHÔNG phải getUser nội bộ. Consolidation cắt số HTTP round-trip (mỗi cái mang thuế middleware), bổ trợ Phase 06.
- Board có 5 console warnings (chưa điều tra — ngoài scope baseline).
- Số đo trên máy local (Supabase localhost, latency thấp). Trên Vercel↔Supabase cloud, mỗi getUser round-trip sẽ **đắt hơn nhiều** (network thật) → tác động Phase 06 còn lớn hơn.
