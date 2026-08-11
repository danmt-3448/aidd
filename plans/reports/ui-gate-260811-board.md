# UI-First Gate — /board — FAIL (formal) · real-data card VERIFIED · needs mock+nodemap refresh

**Date:** 2026-08-11 · screen `MaZUn5xHXZ` · port 127.0.0.1:3001 · ran main-thread (không skip nữa)

## A. Property-diff (CỔNG CỨNG) — **BLOCKED / stale**
- **Nodemap STALE:** `plans/reports/_gate-ref/nodemap/board.map.json` dated **Aug 6** — trước toàn bộ redesign card hôm nay (tier badge, `dept · tier`, danh-hiệu row, hashtag `#text`, carousel compact, "Xem chi tiết"). style-assert chạy trên map cũ chỉ chấm element cũ → **KHÔNG cover element mới** (đúng blind-spot lesson 11). → property-diff **coverage-error (exit 2) = BLOCKED, không PASS câm.**
- **Mock STALE (lesson 12 bắt được):** ở `?ui_state=full` (gate dùng mock) card **KHÔNG hiện tier/dept/#hashtag** (`tierBadge=false, hashtagWithHash=false` trên cả 4 state) — vì `board.mock.ts` chưa có `senderTier/department/danh_hieu` + hashtag chưa `#`. Card THẬT (data seed, đăng nhập) hiện đủ (đã verify screenshot). ⇒ gate mock hiện **không phản ánh card đã ship**.

## B. Behavior (mock data) — phần lớn OK
- [x] `empty` → empty-state "chưa có Kudos" render ✓
- [x] `loading` → spinner/skeleton ✓
- [~] `error` → feedCards=0 (cần xác nhận thông báo lỗi hiển thị — chưa assert text)
- [x] `full` → carousel + feed render (nhưng mock thiếu tier/dept/#hashtag — xem mục A)
- [x] Console: chỉ **noise dev** (Turbopack `webpack-hmr` WebSocket + font-preload warning) — **0 app error thật**

## Real-data fidelity (eyeball, KHÔNG phải property-diff)
Card THẬT khớp Figma (image 12/13 user gửi): sender/receiver `CEVC10 · New/Legend Hero` tier badge · danh-hiệu row + pencil (own-kudo) · content · gallery (4 kudo có ảnh) · hashtag `#Quality #Support` đỏ · footer heart+copy+**Xem chi tiết** · carousel compact hug-content, hết vạch đỏ. Bằng chứng: `evidence/screenshots/card-tier-hover/`, `highlight-fix/`, `verify/`.

## VERDICT: **FAIL (formal gate)** — card thật đúng, nhưng property-diff chưa PASS được vì:
1. **Refresh `board.mock.ts`** — thêm `senderTier/receiverTier`, `senderDepartment/receiverDepartment`, `danhHieu`, hashtag có `#`, đủ density Figma → `?ui_state=full` phản ánh card đã ship.
2. **Rebuild board nodemap** (`board.map.json`/`.1280`/nodemap) — gắn `data-fig` cho element MỚI (tier badge, dept·tier line, danh-hiệu row, hashtag, footer Xem-chi-tiết) → style-assert cover đủ (lesson 11).
3. Re-run property-diff 1440+1280 → khi exit 0 + nets OK → PASS.

→ Đây là bước bounded để đạt PASS thật. Card đã đúng trên data thật; việc còn lại là làm gate mock+map bắt kịp.
