# Phase 09 — notifications i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/notifications.json` · namespace `notifications`

## Goal
Trích chuỗi hardcode VN của notification panel + các dòng thông báo ra `notifications`.

## Files
- `src/features/notifications/**/*.tsx` (5 file có VN text)
- `src/app/notifications/page.tsx`, `src/app/notifications/panel/page.tsx`

## Rules
- VN verbatim, EN dịch chuẩn. Message có biến (ai, khi nào, số lượng) → ICU `{name}`, `{count, plural, ...}`.
- Chuỗi chung → `common`. Điền cả vi + en cùng key.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en notifications.json cùng key; tsc PASS vùng sửa.
