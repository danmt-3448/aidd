# Phase 12 — errors i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/errors.json` · namespace `errors`

## Goal
Trích chuỗi hardcode VN của error boundary + not-found + error components ra `errors`.

## Files
- `src/features/errors/**/*.tsx` (2 file có VN text)
- `src/app/error.tsx`, `src/app/not-found.tsx`

## Rules
- VN verbatim, EN dịch chuẩn. `src/app/error.tsx` là `'use client'` → `useTranslations('errors')`.
- `not-found.tsx` (server) → `getTranslations('errors')`. Chuỗi chung → `common`.
- Điền cả vi + en cùng key.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en errors.json cùng key; tsc PASS vùng sửa.
