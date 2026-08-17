# UI-First Gate — Secret box (J3-4YFIpMM) — PASS

Ngày: 2026-08-17 · Route: `/secret-box` · Screen: `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM`
Port: `localhost:3001` (dev, authed real seeded data) · color-profile=srgb · fonts.ready=true (Montserrat 700)

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280 → PASS

`style-assert.mjs` exit 0 ở **cả 1440 + 1280**: elements=6 (min 5) · checks=27 · failed=0.
Mọi element gắn `data-fig` (nodeId thật từ `get_node`, không slug bịa): `modal`=1466:7676 · `title`=1466:7678 · `guidance`=1466:7683 · `counterLabel`=1466:7692 · `counterNum`=1466:7693 · `boxAsset`=1466:7686.

| key | props khớp | ghi chú |
|---|---|---|
| modal | bg rgba(0,16,26,1) · radius 12.729 · padTop 23.866 · padLeft 12.729 · rowGap 22.275 | khớp get_node |
| title | color rgba(255,234,158,1) · 700 · 25.457px · lh 31.822 · ls 0 | "KHÁM PHÁ SECRET BOX CỦA BẠN" (get_node.character — đúng, "MỞ...THÀNH CÔNG" chỉ là spec note cũ) |
| guidance | color white · 700 · 12.729px · lh 19.093 · ls 0.398 | "Click vào box để mở" |
| counterLabel | color white · 700 · 12.729px · lh 19.093 · ls 0.398 | "Secretbox chưa mở" |
| counterNum | color rgba(255,234,158,1) · 700 · 28.639px · lh 35.004 · ls 0 | "05" |
| boxAsset | tag=IMG · src non-empty | next/image `<img>` thật (box-qua-chua-mo.svg / badge png) |

- Nets: overflow @1280 ok (scrollWidth==clientWidth) · @1440 ok.
- No-break @1920: overflow ngang none · không zoom/lệch/đè-cắt (screenshot `_gate-ref/secret-box-1920.png`).
- Harness fix áp dụng: `style-assert.mjs` nay coi `letter-spacing: normal` ≡ `0px` (getComputedStyle serialize 0px→normal — false-diff class, đã sửa scoped + selftest xanh).
- Screenshots: `_gate-ref/secret-box-1440.png`, `-1280.png`, `-1920.png`. Maps: `_gate-ref/secret-box.1440.map.json`, `.1280.map.json`.

## B. Behavior (real seeded data, authed session) — 100% PASS

Driven qua Playwright + minted fresh session (password-grant → inject `@supabase/ssr` cookie; tránh dev-Turbopack hydration flakiness cho auth). User `tran.thi.binh@` (5 box, real seed).

- [x] Render data thật: counter "05" = đúng `secret_box.unopened_box_count` DB
- [x] Guidance "Click vào box để mở" hiện khi unopened > 0
- [x] Box **enabled** khi > 0
- [x] Interactive open: click box → RPC `open_secret_box()` → **badge reveal** (ảnh badge hiện: root-further) + counter **05 → 04 (−1)**
- [x] Empty state (mở tới 0): counter "00" · guidance **ẩn** · box **disabled**
- [x] Navigation: close → `/board` · unauthenticated → `/login`
- [x] Console: 0 error/warning từ secret-box (asset đã thêm `sizes`). Warning còn lại là `/homepage/*` (SiteHeader shared chrome) + `/images/board/kudos-logo.svg` (trang /board sau close-nav) — không thuộc màn này, pre-existing.
- Validation form: N/A (màn không có form). Loading spinner + stateError tồn tại trong code; error-path là best-effort (không ép được runtime error mà không mock) — không hard-fail.
- Unit: 30/30 pass (`src/features/secret-box`). tsc `--noEmit` sạch.

## Verdict: PASS

Screen được phép sang integration → test → ship. (BE + logic đã sẵn từ build; đây là chốt UI + behavior.)

## Ghi chú harness (cho lần sau)
- `capture-code.mjs` (harness auto) launch chromium **KHÔNG** load session → không tới được route authed. Đã dùng script standalone `_gate-ref/secret-box-capture.mjs` + `secret-box-behavior.mjs` (mint session, inject cookie). Nên vá `capture-code.mjs` nhận `--storage-state`/mint để re-gate authed screen push-button.
- `_gate-ref/nodemap/` vẫn rỗng cho các screen khác → 8 screen "Gate PASS" cũ là pixel-diff, **chưa** qua property-diff số này. Cân nhắc audit lại.
