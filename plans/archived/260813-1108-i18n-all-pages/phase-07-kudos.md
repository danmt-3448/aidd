# Phase 07 — kudos i18n (Viết Kudo compose)

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/kudos.json` · namespace `kudos` (đã migrate 1 phần ở Phase 00 — mở rộng)

## Goal
Trích chuỗi hardcode VN còn lại của compose modal + Tiptap toolbar + mention/hashtag/image ra `kudos`.

## Files
- `src/features/kudos/**/*.tsx` (12 file có VN text)
- `src/app/kudos/page.tsx`

## Rules
- VN verbatim, EN dịch chuẩn. Namespace `kudos` đã có nhiều key (pageTitle, modalTitle, recipient*, hashtag*, image*, submit*…) — TÁI DÙNG, không tạo trùng.
- ICU cho biến (`{max}`) + số ít/nhiều nếu có. Chuỗi chung → `common`.
- Điền cả vi + en cùng key. Client → `useTranslations('kudos')`.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en kudos.json cùng key (EN đầy đủ cho cả key đã migrate); tsc PASS vùng sửa.
