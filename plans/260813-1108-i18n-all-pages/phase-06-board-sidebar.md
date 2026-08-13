# Phase 06 — board-sidebar i18n (leaderboard / stats / filters / hover)

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/board-sidebar.json` · namespaces `leaderboard`, `boardStats`, `boardFilters`, `userCard`

## Goal
Trích chuỗi hardcode VN của sidebar (leaderboard, stats, department/hashtag filter, hover card) ra các namespace tương ứng.

## Files (chỉ những file này)
Dưới `src/features/board/components/`:
- `board-sidebar.tsx`, `board-sidebar-leaderboard.tsx`, `board-sidebar-stats.tsx`,
  `board-department-filter.tsx`, `board-hover-card-popup.tsx`, `board-user-hover-card.tsx`
- Test files tương ứng: giữ pass (chỉ sửa nếu assert vỡ).

## Rules
- VN verbatim, EN dịch chuẩn. Map namespace: leaderboard→`leaderboard`, stats→`boardStats`, filter→`boardFilters`, hover→`userCard`.
- Chuỗi chung → `common`. Điền cả vi + en cùng key.

## Out of scope
board-main (04), board-spotlight (05), file JSON khác.

## Success
0 hardcode VN trong file sở hữu; vi/en board-sidebar.json cùng key; tsc PASS vùng sửa.
