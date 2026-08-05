# Phase 01 — Highlight carousel 3-up (Embla)

**Priority:** High · **Status:** ⏳ chưa build · **Track:** A (UI + behavior mock)
**Goal:** Carousel HIGHLIGHT KUDOS đúng Figma — 1 card center focus + 2 bên peek/faded non-interactive.

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260805-1117-board-highlight-spotlight-rework/clarifications.md
- Figma node: `mms_B.2_HIGHLIGHT KUDOS` (2940:13461); 3 card `KUDO - Highlight` 528px — trái x=0 · center `mms_B.3` x=552 · phải x=1104. Arrow 80×80 hai bên (`mms_B.2.1`/`mms_B.2.2`) + arrow 48×48 + "n/5" bottom (`mms_B.5`).

## Spec (test-cases — checklist behavior nhóm B)
- TC `86092c3a`: 5 slide · **active card center nổi bật · card 2 bên faded + non-interactive** · arrow Prev/Next disabled ở slide đầu/cuối.
- TC `81446f61`: Next/Prev đổi slide; disabled đúng ở đầu/cuối; pagination + arrow state cập nhật.
- Filter Hashtag/Phòng ban đổi → reset về slide 0.

## Việc làm
1. `npm i embla-carousel-react`.
2. Rework `src/features/board/components/board-highlight-carousel.tsx`:
   - Dùng Embla: `align:'center'`, `containScroll:false`, slide width ~528px + gap → card giữa center, 2 bên ló mép (peek).
   - Card **không active**: opacity ~0.4, `pointer-events:none`, `aria-hidden`, `tabIndex=-1` (non-interactive). Card active: opacity 1, interactive.
   - Theo `selectedScrollSnap()` cập nhật index → set active/faded + số trang `n/5`.
   - Arrow 80×80 hai bên (over card) điều khiển `scrollPrev/scrollNext`; disabled bằng `canScrollPrev/Next`. Giữ dots + "n/5" bottom.
   - Filter change → `scrollTo(0)`.
   - Giữ 4 state qua `?ui_state=` (full/empty/error/loading) render đúng.
3. `tsc --noEmit` sạch. Giữ file < 200 dòng (tách sub-component nếu cần).

## Files
- Sửa: `src/features/board/components/board-highlight-carousel.tsx`, `package.json`
- Không tạo file mới trừ khi > 200 dòng.

## Success
- 1440: center card focus + 2 bên peek faded, giống Figma ~95%.
- Behavior: 5 slide, arrow disabled đầu/cuối, faded card non-interactive, filter reset slide 0, 4 state đúng, 0 console error.
- Handoff: chạy `/aidd-ui-gate /board` (Phase 03).

## Out of scope
- Không đụng BE/queries. Không sửa spotlight/sidebar/feed. Không viết test (để Phase 03 sau gate).
