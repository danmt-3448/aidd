# Phase 02 — awards i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/awards.json` · namespace `awards`

## Goal
Trích chuỗi hardcode VN của awards (categories tĩnh) ra `awards`; thay bằng translations.

## Files
- `src/features/awards/**/*.tsx` (5 file có VN text)
- `src/app/awards/page.tsx`

## Rules
- VN verbatim, EN dịch chuẩn. Prose category dài → key nested rõ ràng.
- Chuỗi chung → `common`. Điền cả vi + en cùng key.
- Client → `useTranslations`; server → `getTranslations`.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en awards.json cùng key; tsc PASS vùng sửa.
