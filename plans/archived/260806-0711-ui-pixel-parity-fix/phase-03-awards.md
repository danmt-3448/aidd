# Phase 03 — `/awards` (bàn hiệu chỉnh band-diff)

**Track:** A · **blockedBy:** 01 · **Status:** pending

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Figma node `313:8436` · artboard **1440×6410** · app hiện **1440×5232**
- Gate cũ: [ui-gate-260805-awards.md](../reports/ui-gate/ui-gate-260805-awards.md) — 14.96%

## Goal
`/awards` đạt mọi band ≤1% @1440 + 1280 → PASS `/aidd-ui-gate /awards`.

## Vì sao màn này đi đầu
FAIL nhẹ nhất (14.96%) **và `supabase-files = 0`** — màn duy nhất chưa vướng BE. Sửa được thuần UI, không chờ phase-02. Dùng làm bàn thí nghiệm hiệu chỉnh band-diff trước khi áp cho màn nặng.

## Đầu việc
1. Dựng band manifest `awards.bands.json` — `refY/refH` từ `get_node(313:8436)` con, thêm `data-band` vào section root.
2. Chạy band-diff → xác định band nào lệch. Chênh 6410 vs 5232 = **thiếu ~1178px chiều cao**, gần như chắc chắn nằm ở vài band cụ thể chứ không rải đều.
3. Sửa từng band tới ≤1%: report cũ chỉ ra **thứ tự card + chiều cao + giá trị badge** lệch node 313:8436.
4. Re-gate 1440 + 1280.

## Success
- [ ] Mọi band `/awards` ≤1% @1440 + 1280 → PASS `/aidd-ui-gate /awards`
- [ ] **[R1 — validate ngưỡng] Chọn 1 band TEXT-nhiều/chiều-cao-động của `/awards`, đo `heightDelta` thực tế của band ĐÃ khớp mắt.** Nếu band khớp mà `|heightDelta| > 2px` do line-height/font-metrics browser vs Figma → ngưỡng 2px quá gắt cho band động, **báo về phase-01 nới ngưỡng theo loại band** (fixed-height giữ ≤2px; text/động dùng ngưỡng rộng hơn có căn cứ), không ép mù. Regression countdown/login là fixed-height nên không lộ vấn đề này — `/awards` là chỗ đầu tiên stress được.

## Out of scope
BE/queries · các màn khác · shared header/footer (thuộc phase-04 — nếu band chrome fail thì ghi lại, để phase-04 sửa, không tự đụng).

## Bàn giao cho phase-01
Nếu band mode lộ khiếm khuyết (band không map được DOM, heightDelta báo sai) → sửa script ở phase-01 rồi chạy lại. Đây là mục đích của bàn hiệu chỉnh.

## Behavior spec từ annotation Figma (nhóm B — MoMorph crop mất)
⚠️ **Cross-ref BẮT BUỘC cả MoMorph LẪN Figma** — một số spec chỉ vẽ dạng NOTE ngoài artboard.
- **Menu list award = STICKY/scroll-follow.** NOTE "Scroll thì phần này sẽ đi theo" trỏ vào `mms_C_Menu list` (313:8459 — Top Talent…MVP). Layout scrollspy: **cột menu trái dính khi scroll**, cột card phải (`D.Danh sách` 313:8466, cao 4833px) cuộn qua. → checklist B: verify menu sticky + (nếu có) highlight item theo card đang xem.
- Header awards (từ ảnh Figma): nav = **`About SAA 2025` · `Award Information` (active, gạch chân vàng) · `Sun* Kudos`** — dạng landing nav, KHÁC SiteHeader app (bell/account). Cần đối chiếu: awards dùng nav riêng hay SiteHeader chung? → xác nhận với phase-04 trước khi sửa chrome.
- ⚠️ User báo "có 1 số spec" (số nhiều) → **có thể còn annotation khác**; figma MCP rate-limit (seat View) nên **phải nhờ user gửi thêm ảnh** các vùng awards chưa thấy.

### ĐÃ FIX (2026-08-06) — verified qua Playwright
- ✅ **6 ảnh giải riêng biệt.** User export 6 PNG (348×350, có sẵn khung vàng) → `public/awards/{slug}.png` (lưu ý `signature-2025-creator` → file `signature-creator.png`). Thêm field `image` vào `Award` type + 6 entry config. Tạo component chung `award-medallion.tsx` (DRY, dùng bởi awards + homepage). Ảnh có khung vàng baked → component KHÔNG thêm border/shadow/bg (chỉ size + `object-contain`). Verified: cả 6 medallion render (TOP TALENT…MVP), 0 console error.
- ⚠️ **Lazy-load gotcha cho GATE:** medallion dưới fold `loading="lazy"` → chưa tải tới khi scroll ⇒ gate chụp fullPage sẽ thấy trống ⇒ **FAIL giả**. `/aidd-ui-gate` phải **scroll hết trang + chờ mọi `<img>` complete** trước khi chụp (hoặc force eager). Ghi vào yêu cầu gate (phase-01).

### CÒN LẠI (chưa xong)
- ✅ **Icon color** → `#FFEA9E` (target/diamond/gift) — done.
- ✅ **Sticky menu + scrollspy** — done + verified: `awards-nav.tsx` client + IntersectionObserver (rootMargin -25%/-65%), wrapper `lg:sticky lg:top-24 self-start`, anchor `scrollMarginTop:96px`. Verify: nav dính top=96 khi scroll, active theo card (MVP center → chỉ MVP vàng+border). 0 console error.
- ✅ **KudosPromo "Phong trào ghi nhận"** — fixed: bên phải dùng wordmark `kudos-qr.svg` (thực ra là ⚡KUDOS logo 383×74, khớp `MM_MEDIA_Logo/Kudos`) ở tỉ lệ rộng đúng, **bỏ QR-vuông 140×140 + text "KUDOS" lặp**; button `mms_D2.1_Button-IC` → radius 4 + up-arrow trong button, bỏ icon kudos rời.
- ✅ **"Thể lệ" (FAB homepage) → mở RulesModal tại chỗ** (không navigate). Tách `rules-modal.tsx` (DRY: `/rules` route + homepage FAB dùng chung). Verify: click → `role=dialog` "Thể lệ SAA 2025" hiện.

### Trạng thái code hiện tại vs spec (đã đối chiếu 2026-08-06)
- ❌ **Sticky menu CHƯA làm.** `awards-showcase.tsx:92` bọc nav trong `<div className="hidden lg:block">` — KHÔNG có class `sticky top-*` (comment ghi "sticky" nhưng class không có). → vi phạm NOTE Figma.
- ❌ **Scrollspy CHƯA làm.** `awards-nav.tsx:6,13` — `activeSlug` hardcode item đầu, comment "wires scroll-spy [in] integration phase". → nhóm B FAIL.
- ⚠️ **Xung đột quy trình:** sticky + scrollspy là **behavior (nhóm B)**, gate đòi đúng với mock TRƯỚC integration. Code đang defer sang integration → SAI thứ tự. **Phải build sticky+scrollspy trong phase-03**, không đợi integration.
- ✅ **Header: RESOLVED (2026-08-06) — dùng chung `SiteHeader`, ĐÚNG.** User chốt "dùng chung". `site-header.tsx:67-71` `NAV_ITEMS` = `About SAA 2025` (/#about) · `Award Information` (/awards) · `Sun* Kudos` (/board) — khớp chính xác nav landing Figma. `awards/page.tsx:49` đã `activeNav="awards"`. Không đổi gì.
- ❌ **6 card thiếu ảnh riêng (user báo "toàn hình null").** `award-card.tsx:27,42` hardcode CHUNG `/awards/award-trophy.png` + `/awards/trophy-badge.png` cho cả 6; `award-config.ts` KHÔNG có field `image`. Figma có 6 artwork riêng: `mm_media_Award-Name-{Top-Talent,Top-Project,Top-Project-Leader,Best-Manager,Signature-2025-Creator,MVP}`. → **Fix:** export 6 ảnh qua `get_media_files` → `public/awards/award-{slug}.png`; thêm field `image` vào `award-config.ts`; render `award.image` trong card. (DRY: homepage dùng chung config — xem phase-05.)
- ❌ **Icon sai màu.** `public/awards/icon-target.svg` `fill="white"`, cạnh title vàng `#FFEA9E` → phải vàng. Lấy hex chính xác từ Figma node icon (`MM_MEDIA_Target`), không tự đặt.

## Rủi ro
Annotation ngoài artboard có thể chứa thêm spec state của card giải → figma MCP không đọc được (rate-limit View seat), **hỏi user gửi ảnh Figma vùng đó**, không tự suy.
