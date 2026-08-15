# Phase 10 — rules i18n (thể lệ — prose dài)

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/rules.json` · namespace `rules`

## Goal
Trích **toàn bộ** prose thể lệ (đoạn dài, danh sách, mục lục) ra `rules`; thay bằng translations.

## Files
- `src/features/rules/**/*.tsx` (2 file có VN text — nội dung dày)
- `src/app/rules/page.tsx`

## Rules
- VN verbatim (giữ đúng từng đoạn). EN dịch chuẩn nghĩa cả prose dài — **không tóm tắt, không bịa**.
- Key nested theo section/heading để dễ đọc & maintain (vd `rules.section1.title`, `rules.section1.body`).
- Đoạn có markup (list, bold) → giữ cấu trúc JSX, chỉ trích text node; hoặc dùng `t.rich` nếu cần inline tag.
- Điền cả vi + en cùng key.

## Out of scope
File feature khác, request.ts, common.json (chỉ đọc).

## Success
0 hardcode VN; vi/en rules.json cùng key; EN phủ hết prose; tsc PASS vùng sửa.
