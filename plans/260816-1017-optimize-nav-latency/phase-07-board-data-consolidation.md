# Phase 07 — Board data consolidation (8 server actions → 1–2)

**Priority:** P1 · **Risk:** TB–Cao · **Status:** pending · **Depends:** Phase 00 (đã đo) · **Nguồn:** baseline-260816-prod-nav.md (PHÁT HIỆN MỚI)

## Context (đo được, không đoán)
Baseline prod: 1 lần mở `/board` = **8× `POST /board` server actions** fire song song lúc mount (feed, highlights, spotlight, spotlight-activity, board-user-stats, gift-leaderboard, hashtag-list, department-list). Mỗi POST đi qua middleware → 1 `MW getUser` (~40–100 ms). Board data query hầu như không getUser nội bộ → cost chính = **8 HTTP round-trip, mỗi cái mang thuế middleware getUser + latency mạng**.

Đây là "spam mỗi page" người dùng cảm nhận + phần lớn "behavior chậm" lúc hydrate board.

## Goal
Gộp initial fetch của board về **1–2 round-trip** (1 RPC/action trả nhiều mảnh data, hoặc gom vài query gần nhau). Giảm số POST → giảm cả middleware-getUser count lẫn DB round-trip. Bổ trợ Phase 06 (getClaims làm mỗi middleware rẻ; consolidation làm ÍT lần hơn).

## Requirements
- Gộp các query **initial, không phụ thuộc tương tác** thành 1 server action / RPC: feed (trang đầu) + highlights + spotlight + spotlight-activity + user-stats + gift-leaderboard + hashtag-list + department-list. Cân nhắc 1 Postgres RPC `get_board_initial(uid)` trả JSON nhiều nhánh (giống pattern `create_kudo` RPC — CLAUDE.md "Database Writes").
- **Catalog tách được:** hashtag-list + department-list là catalog tĩnh (staleTime 5m) → có thể giữ riêng hoặc gộp; ưu tiên gộp initial payload.
- **KHÔNG gộp** cái phụ thuộc tương tác (load-more feed cursor, toggle-heart) — giữ riêng.
- **Realtime giữ nguyên** — các channel subscribe sau initial fetch không đổi (Phase 05 lo hydrate). Consolidation chỉ gộp *fetch đầu*.
- Giữ nguyên shape data mỗi widget nhận (không đổi UI/props) — chỉ đổi cách lấy.
- KHÔNG giảm mật độ/nội dung board (bám Figma).

## Related Code Files
- **Read:** `board-connected.tsx`, `use-board-feed/highlights/spotlight/spotlight-activity/board-user-stats/board-leaderboards/hashtag-list/department-list.ts`, `board-queries.ts`, `board-leaderboard-queries.ts`, `board-department-queries.ts`.
- **Create:** RPC `get_board_initial` (supabase migration) + 1 hook `use-board-initial.ts` (hoặc gộp trong board-connected).
- **Modify:** board-connected wiring (thay N hook fetch bằng 1 initial + phân phối xuống).

## Steps
1. Map 8 query → data shape từng cái. Xác định cái nào initial-độc-lập (gộp được) vs tương-tác (giữ).
2. Viết RPC `get_board_initial(uid)` trả JSON gộp (1 transaction, read-only). Hoặc 1 server action gọi song song server-side rồi trả 1 payload (ít rủi ro schema hơn RPC).
3. Thay fetch client: 1 `useBoardInitial()` → seed cache / phân phối xuống widget. Giữ realtime subscribe như cũ để update sau.
4. Đo lại (như Phase 00): số `POST /board` giảm từ 8 → 1–2; TBT board giảm.
5. `tsc --noEmit`; unit board queries.

## Success Criteria
- `POST /board` lúc mount: **8 → ≤2** (đo Network prod).
- **`/aidd-ui-gate` /board PASS** (property-diff 1440+1280 + behavior real data — nội dung/mật độ không đổi).
- Realtime vẫn update live (test: seed 1 kudo mới → board cập nhật).
- Unit + e2e board xanh.

## Risk & Mitigation
- Refactor rộng (nhiều hook) → làm sau Phase 06 + Phase 02 (đã ổn định auth). Ưu tiên phương án "1 server action gọi song song" trước khi nhảy sang RPC (RPC rủi ro schema/maintenance cao hơn — cân YAGNI).
- Nếu đo cho thấy 8 POST song song không thực sự làm chậm sau khi Phase 06 hạ getUser tax → **cân nhắc scope nhỏ lại** (chỉ gộp catalog + stats, giữ feed riêng).

## Out of scope
Không đổi realtime channel, không đổi load-more/toggle-heart, không đổi UI.
