# UI-First Gate — Live Board (/board) — **FAIL** (full-page)

Date: 2026-08-05 · screenId `MaZUn5xHXZ` · viewport 1440 · auth: seed admin (nguyen.van.an) via /dev-login
Reference: `plans/reports/ui-audit/momorph/board.png` (Figma) · Actual full-page: `plans/reports/ui-gate/board-1440-fullpage.png`
DB state: **kudos = 0** (psql) → board hiển thị empty-state hợp lệ, KHÔNG phải lỗi data.

## Full-page review (từng section, top→bottom)

| Section | Figma | App thực tế | Chấm |
|---|---|---|---|
| Header | logo · nav · bell · VN · user icon gọn | có đủ, nhưng **badge tên "Nguyễn Văn An" tràn 3 dòng** góc phải | ✗ layout vỡ |
| KV banner | "Hệ thống ghi nhận **và** cảm ơn" + wordmark lớn **KUDOS** + artwork lông vũ full-width | "Hệ thống ghi nhận **lời** cảm ơn" · **thiếu wordmark KUDOS** · artwork bị cắt nhỏ góc phải | ✗ sai copy + thiếu element |
| Search bar | có | có, khớp | ✓ |
| HIGHLIGHT KUDOS | carousel cards có data | "Hiện tại chưa có Kudos nào" (empty đúng vì 0 kudos) | ⚠ empty hợp lệ, chưa verify layout populated |
| ALL KUDOS | feed cards | "Hiện tại chưa có Kudos nào" | ⚠ như trên |
| SPOTLIGHT | word-cloud "388 KUDOS" trên nền texture | "0 KUDOS · Chưa có dữ liệu" | ⚠ empty hợp lệ |
| Sidebar | Kudos nhận/gửi/Hearts/Secret Box + 10 Sunner | có, toàn 0 + "Chưa có dữ liệu" | ⚠ empty hợp lệ |
| Footer | có footer + link | **không thấy footer** trong full-page capture | ✗ thiếu/không render |
| Avatar | ảnh user | **không load** (400) | ✗ |

## A. Visual ~95% (1440) — FAIL
Lệch RÕ: header badge tràn · KV banner sai copy + thiếu wordmark KUDOS + artwork cắt · footer không render · avatar không hiển thị. Các section data đang empty (0 kudos) nên **chưa thể verify layout khi có data** → cần seed kudos để chấm đầy đủ.

## B. Behavior (mock) — FAIL (bất khả nhân nhượng)
- **36× `500 @ /board` + 1× `400` avatar** = 37 console errors ⇒ FAIL (ngưỡng 0).
  - 500 **độc lập với data** (vẫn xảy ra khi kudos=0) và **tích lũy theo thời gian** ⇒ tương quan với **Supabase Realtime** (`board-feed-realtime` / `board-highlights-realtime`) invalidate → RSC refetch /board fail lặp. Root-cause cần dev-server logs.
  - 400 avatar: `api.dicebear.com/.../svg` qua next/image — allow hostname nhưng **thiếu `dangerouslyAllowSVG`**.
- **`?ui_state=` chưa implement** → không ép được empty/error/loading.

## Verdict: **FAIL**

## Việc cần fix (ưu tiên theo mức chặn)
1. **[BE·chặn] 36× 500 /board** — `/tkm:debug-code` với dev-server logs; nghi realtime invalidation (use-board-feed/use-highlights) trigger refetch fail. Đây là lỗi nghiêm trọng nhất.
2. **[BE·config] 400 avatar** — `next.config.ts`: `images.dangerouslyAllowSVG:true` (+ contentDispositionType/CSP) hoặc đổi dicebear sang PNG.
3. **[FE] footer** — kiểm footer có render trên /board không (Figma có).
4. **[FE] header badge tên user tràn** — truncate/max-width.
5. **[FE] KV banner** — wordmark "KUDOS" + sửa copy "và cảm ơn" + artwork full-width.
6. **[FE] mock fixtures + `?ui_state=`** — để gate chấm 4 state.
7. **[QA/data] seed kudos** — cần data để verify layout populated (Highlight/Spotlight/feed) — hiện chỉ chấm được empty-state.

## Unresolved
- Root-cause 500 chưa xác định (cookie e2e/.auth hết hạn nên không curl lấy body được; cần đọc log dev server hoặc chạy /tkm:debug-code).
- Chưa chấm 768/375 (dừng ở 1440 vì FAIL rõ).
- Footer: cần xác nhận missing thật hay chỉ ngoài vùng capture.
