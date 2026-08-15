# Phase 05 — board-spotlight i18n (spotlight / highlight)

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/board-spotlight.json` · namespaces `spotlight`, `highlight`

## Goal
Trích chuỗi hardcode VN của spotlight + highlight carousel ra `spotlight`/`highlight`.

## Files (chỉ những file này)
Dưới `src/features/board/components/`:
- `board-spotlight.tsx`, `board-spotlight-activity.tsx`, `board-spotlight-controls.tsx`,
  `board-spotlight-search.tsx`, `board-spotlight-search-results.tsx`,
  `board-spotlight-word-cloud.tsx`, `board-spotlight-word-cloud-tooltip.tsx`,
  `board-highlight-carousel.tsx`, `board-highlight-arrow-button.tsx`
- Test files tương ứng: giữ pass (chỉ sửa nếu assert vỡ).

## Rules
- VN verbatim, EN dịch chuẩn. Chuỗi chung → `common`. Điền cả vi + en cùng key.
- Client → `useTranslations('spotlight')` / `useTranslations('highlight')`.

## Out of scope
board-main (Phase 04), board-sidebar (Phase 06), file JSON khác.

## Success
0 hardcode VN trong file sở hữu; vi/en board-spotlight.json cùng key; tsc PASS vùng sửa.
