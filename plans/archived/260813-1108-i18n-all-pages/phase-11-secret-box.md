# Phase 11 — secret-box i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/secret-box.json` · namespace `secretBox`

## Goal
Trích chuỗi hardcode VN của secret box open flow (gồm empty state hết box) ra `secretBox`.

## Files
- `src/features/secret-box/**/*.tsx` (4 file có VN text)
- `src/app/secret-box/page.tsx`

## Rules
- VN verbatim, EN dịch chuẩn. Empty/error state → key riêng. Chuỗi chung → `common`.
- Điền cả vi + en cùng key. Client → `useTranslations('secretBox')`.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en secret-box.json cùng key; tsc PASS vùng sửa.
