# Clarifications — Board Highlight + Spotlight rework

Screen: Sun* Kudos (Live board) · MoMorph `MaZUn5xHXZ` · route `/board`
MoMorph refs: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ

## Session 260805-1117

- Q: HIGHLIGHT carousel (1 center + 2 bên faded) dựng bằng gì? → A: Embla Carousel (embla-carousel-react), center+peek, opacity 2 bên theo selectedSnap
- Q: SPOTLIGHT làm tới đâu? → A: Full spec — pan/zoom (react-zoom-pan-pinch) + search input + hover tooltip (tên+giờ) + click→kudo detail + loading/empty; giữ computeWordLayout cho vị trí chữ
- Q: Xem Figma trực tiếp cho spotlight animation? → A: Authenticate Figma MCP ngay, đọc frame + annotation trực tiếp
- Q: Phạm vi plan? → A: Cả 2 — Highlight carousel + Spotlight board (Track A UI, không đụng BE)

## Findings (3 nguồn — 260805)

- Browser /board: BLOCKED — auth gate redirect /login, supabase local chưa chạy (54321→404). Cần session để chấm gate sau.
- Highlight impl SAI: `board-highlight-carousel.tsx` render 1 card/lần ("one card visible at a time") — thiếu 2 bên faded non-interactive. Spec TC 86092c3a: active card center prominent, inactive faded.
- Spotlight impl thiếu: `board-spotlight.tsx` có expand/compress toggle thay vì pan/zoom; thiếu search input, tooltip node, click→detail, loading/empty. Spec TC ddf67e52/cac4b7a3/33ca8f8a/d035e3b8.
- Deps: chưa cài embla-carousel-react, react-zoom-pan-pinch — sẽ thêm.

## Resolved — Figma trực tiếp (260805, figma MCP)

- Animation: `get_motion_context(2940:13431, recursive)` = `{"nodes":[]}` → Figma KHÔNG có keyframe/prototype animation. Không animation bắt buộc; motion (pan/zoom smoothing, hover, entrance) là micro-interaction do mình chọn.
- Icon góc phải spotlight = `mms_B.7.2_Pan zoom` (node 3007:17479, 30×30) → PAN/ZOOM, không phải expand-fullscreen. Impl expand/compress hiện tại SAI.
- Spotlight canvas: `Root further mo rong 1` (2940:14173) x=−64 width=1819 > box 1157 → content lớn hơn khung ⇒ pan/zoom để khám phá.
- Search input CÓ trong box: `mms_B.7.3_Tìm kiếm sunner` (2940:14833, góc trái-trên, 219×39). Impl thiếu.
- Count label `mms_B.7.1_388 KUDOS` (3007:17482, top center). Activity log 6 dòng bottom-left. Word density: 7 tên lặp ~45+ vị trí.
- Highlight: 3 card `KUDO - Highlight` 528px — trái x=0 · center `mms_B.3` x=552 · phải x=1104 (tổng 1632 > 1440 → 2 bên peek). Arrow 80×80 hai bên (over card, `mms_B.2.1/2.2`) + arrow 48×48 + "2/5" bottom (`mms_B.5`).

## Full-page scope (user: "2 ý chỉ là ví dụ, check toàn bộ page" + ảnh annotation phải)

Interactive states từ ảnh Figma annotation bên phải artboard (MoMorph brief thiếu) — đều là behavior nhóm B:
- Dropdown ngôn ngữ VN/EN · Dropdown profile thường (Profile·Logout) + admin (Profile·Dashboard·Logout) · Dropdown Hashtag (item active đậm) · Dropdown Phòng ban (CEVC2/3/4/1/OPD/Infra).
- Hover Avatar → popover: avatar+tên+role/phòng ban+tier pill + "Số Kudos nhận được:25" + "đã gửi:25" + nút "Gửi KUDO".
- Hover danh hiệu (tier badge) → tooltip mô tả tier (vd "New Hero" + điều kiện).

Audit code (Explore ×2, reports 260805-1135):
- ✓ đã có: header nav, KUDOS ảnh SVG, feed card (cream/tier/gallery), sidebar stats+gift list (mms_D.2 hidden đã bỏ đúng), lang VN/EN, profile menu admin, hashtag dropdown.
- ❌ thiếu: hover-avatar popover (board-card-person-block.tsx), hover-tier tooltip (feed-card-tier-badge.tsx chỉ có title).
- Gap nhỏ: banner height 420 vs 512; search placeholder + maxlength=100; footer thiếu "Tiêu chuẩn chung"; "Copy Link" chưa localize; EN flag emoji; hearts badge x2 thiếu; verify Phòng ban dropdown vs chip.
- File >200d: site-header 246, board-highlight-carousel 221, board-feed-card 249 → tách khi đụng.
- Browser visual gate: BLOCKED (auth: /board→/login, supabase local 54321→404). Cần dựng supabase + login mới chấm được — để Phase 05.
