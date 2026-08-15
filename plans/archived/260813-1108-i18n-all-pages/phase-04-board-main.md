# Phase 04 — board-main i18n (feed / card / kv)

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/board.json` · namespace `board` (đã có copyLink/viewDetail/like/unlike từ Phase 00 — mở rộng thêm)

## Goal
Trích chuỗi hardcode VN của board feed + card + banner ra `board`.

## Files (chỉ những file này — KHÔNG chạm spotlight/sidebar)
- `board-all-kudos-feed.tsx`, `board-card-atoms.tsx`, `board-card-person-block.tsx`,
  `board-feed-card.tsx`, `feed-card-image-gallery.tsx`, `feed-card-tier-badge.tsx`,
  `board-write-kudo-trigger.tsx`, `board-x2-flame-badge.tsx`, `board-kv-banner.tsx`,
  `board-screen.tsx`, `board-connected-gates.tsx` (dưới `src/features/board/components/`)
- Test files tương ứng: giữ pass (vi verbatim nên không cần sửa; sửa chỉ khi assert vỡ).

## Rules
- VN verbatim, EN dịch chuẩn. `board-feed-card.tsx` đã dùng key `board.*` sẵn — mở rộng cùng namespace.
- Chuỗi chung → `common`. Điền cả vi + en cùng key. Client → `useTranslations('board')`.

## Out of scope
board-spotlight* / board-highlight* (Phase 05), board-sidebar*/department/hover (Phase 06), file JSON khác.

## Success
0 hardcode VN trong file sở hữu; vi/en board.json cùng key; tsc PASS vùng sửa.
