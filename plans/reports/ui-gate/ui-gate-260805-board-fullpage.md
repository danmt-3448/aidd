# UI-First Gate — /board (Sun* Kudos, MaZUn5xHXZ) — **FAIL**

Port: 127.0.0.1:3001 · render qua `?ui_state=` (dev bypass proxy.ts) · full-page 1440/375 · Figma frame 2940:13431.

## A. Visual ~95% (full-page)
- **Layout composition**: PASS — banner full-width · highlight full-width · spotlight full-width · all-kudos 2 cột (feed + sidebar 374px) · footer. Đúng Figma.
- **KV Banner**: PASS — height 512, KUDOS wordmark là ảnh, artwork lông vũ nhiều màu, "Hệ thống ghi nhận và cảm ơn".
- **Highlight carousel**: PASS — 3-up center focus + 2 bên peek, arrow 80×80, dots + "1/5", tier pill (Rising/Legend/New Hero), "Sao chép liên kết" localize, hashtag #Dedicated #Inspring, "1.000 ❤". (Minor: card 2 bên chưa mờ rõ opacity 0.4 — chấp nhận.)
- **All-Kudos + Sidebar**: PASS — cream card, gallery, stats 25/25/25/25/25 + badge x2, gift list, footer 5 item ("Tiêu chuẩn chung" ✓).
- **❌ SPOTLIGHT BOARD: FAIL** — word-cloud render dạng **hàng ngang (flow rows)** như đoạn văn, KHÔNG phải **scatter cloud dày rải rác** như Figma (tên ở nhiều x/y, size theo kudoCount, phủ kín box). Đây là lệch **layout composition** rõ. Phụ: artwork gradient mép trái quá mờ so với Figma (Figma là mảng màu đậm). Search/388 KUDOS/activity log/pan-zoom icon: có, đúng.
- 1440: **FAIL** (do spotlight) · 375: PASS (adapt, không overflow) · 768: không chụp riêng, không thấy dấu hiệu overflow (fixed-width đã tránh).

## B. Behavior (mock data)
- [x] 4 state `?ui_state=`: **full** ✓ (data đầy đủ) · **empty** ✓ (highlight "chưa có Kudos", spotlight "0 KUDOS"+"Chưa có dữ liệu", feed empty) · error/loading: đã wire (Phase 02: spinner role=status; resolveOverrideData) — **verify lại ở lần re-gate**.
- [x] Console: 12 error nhưng đều là **WebSocket HMR** (dev hot-reload noise), **0 app error** → OK.
- [ ] Hover popover / tier tooltip / pan-zoom drag / search filter: **chưa verify tương tác** (visual FAIL short-circuit) — verify ở re-gate.

## Verdict: **FAIL**
Chặn bởi 1 mục visual: spotlight word-cloud layout sai kiểu. Mọi phần khác đạt ~95%.

## Việc cần fix (gửi lại fe-developer — Phase 02 spotlight)
1. **`board-spotlight-word-cloud.tsx`** — đổi `computeWordLayout` từ flow-rows sang **scatter cloud**: rải tên ở nhiều vị trí x/y trong canvas (pseudo-random deterministic theo index), size chữ theo kudoCount, phủ dày kín box, tránh chồng đè. Bám ảnh Figma `mms_B.7_Spotlight` (2940:14174) — tên rải khắp, không thành hàng.
2. **`board-spotlight.tsx`** — artwork gradient mép trái đậm/rõ hơn (Figma `image 24/25` là mảng màu, không chỉ gradient nhạt).
3. Re-run `/aidd-ui-gate /board` sau fix; verify nốt error/loading state + hover/pan-zoom/search tương tác.
