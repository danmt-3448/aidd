# Phase 08 — profile i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/profile.json` · namespace `profile`

## Goal
Trích chuỗi hardcode VN của profile (own + other user feed) ra `profile`.

## Files
- `src/features/profile/**/*.tsx` (7 file có VN text)
- `src/app/profile/page.tsx`

## Rules
- VN verbatim, EN dịch chuẩn. Chuỗi chung (nút, tab, empty state) → `common` nếu thật sự dùng lại.
- ICU cho biến (tên user, count). Điền cả vi + en cùng key. Client → `useTranslations('profile')`; server → `getTranslations`.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en profile.json cùng key; tsc PASS vùng sửa.
