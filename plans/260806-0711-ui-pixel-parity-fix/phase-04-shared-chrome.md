# Phase 04 — Shared chrome (header / footer / card / tokens)

**Track:** A · **blockedBy:** 03 · **Status:** pending

## Goal
Sửa một lần các thành phần dùng chung → nhiều màn cùng tụt số. Chạy TRƯỚC các phase màn lẻ để tránh tranh chấp file.

## Vì sao tách riêng
`board`, `homepage`, `awards`, `profile` cùng dùng site-header / footer / feed-card / typography token. Nếu mỗi phase màn tự sửa chrome → 4 phase cùng ghi 1 file (vi phạm file-ownership) và sửa 4 lần cùng một lỗi.

## Đầu việc
1. Gom kết quả band `chrome` (header/footer) từ phase-03 + các gate report cũ để biết chrome lệch gì.
2. Lấy số thật từ MoMorph `get_node` cho: chiều cao header, spacing nav, footer 5 item, font-size/weight, màu.
3. Sửa tại chỗ. File > 200 dòng thì tách (đã đo: `src/components/site-header.tsx` **263 dòng**, `src/features/board/components/board-feed-card.tsx` **220 dòng** — xem [board rework plan](../archived/260805-1117-board-highlight-spotlight-rework/plan.md)).
4. Chạy lại band `chrome` trên `/awards` → phải ≤1%.

## File ownership (độc quyền phase này) — path THẬT đã verify
- `src/components/site-header.tsx` (263 dòng) — header dùng chung mọi màn
- `src/features/homepage/components/homepage-footer.tsx` (90 dòng) — footer dùng chung (board-screen.tsx:167 + homepage đều import)
- `src/features/board/components/board-feed-card.tsx` (220) + `feed-card-image-gallery.tsx` (81) + `feed-card-tier-badge.tsx` (168) — card feed dùng chung board/homepage
- token/style dùng chung (`src/components/**`, tailwind config, global css)

**Phase 05–08 KHÔNG được sửa các file trên** — thấy lỗi thì báo về đây.

## Out of scope
Nội dung riêng từng màn · BE · asset riêng của 1 màn.

## Success
- [ ] Band `header` + `footer` ≤1% trên `/awards`
- [ ] `tsc --noEmit` sạch, không màn nào vỡ layout sau khi sửa chrome
- [ ] Re-check nhanh `/homepage` + `/board` không vỡ header/footer/card sau sửa (đều import chung 4 file trên)
