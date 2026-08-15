# Phase 03 — homepage i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/home.json` · namespace `home`

## Goal
Trích chuỗi hardcode VN của homepage (gồm HomepageFooter dùng chung showcase) ra `home`.

## Files
- `src/features/homepage/**/*.tsx` (11 file có VN text)

## Rules
- VN verbatim, EN dịch chuẩn. Điền cả vi + en cùng key.
- Footer/nav dùng lại nhiều nơi → cân nhắc đưa chuỗi thật sự chung vào `common`; phần riêng home giữ ở `home`.
- Client → `useTranslations`; server → `getTranslations`.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc/thêm chuỗi chung nếu là footer bản quyền — phối hợp Phase 13 nếu trùng).

## Success
0 hardcode VN; vi/en home.json cùng key; tsc PASS vùng sửa.
