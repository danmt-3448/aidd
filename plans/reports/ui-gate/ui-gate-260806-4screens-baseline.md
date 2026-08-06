# UI-Gate Baseline — 4 màn (Homepage · Awards · Countdown · Đa ngôn ngữ)

**Ngày:** 2026-08-06 · **Loại:** baseline/readiness (check-only, KHÔNG fix) · **i18n:** DEFERRED theo yêu cầu user

> Mục đích: chốt điểm xuất phát 4 màn trên trục **A (pixel)**. Trục **B (đa ngôn ngữ)** tạm gác — ghi lại để không quên, chưa xử lý.

## Bảng baseline

| Màn | Route | Pixel (số cũ) | Check được NGAY? | Chặn bởi |
|---|---|---|---|---|
| **Countdown** | `/countdown` | **PASS 0.39%** @1440 (report 260806) | ✅ CÓ — 1 viewport, phương pháp gate tin được | — |
| **Homepage** | `/` | FAIL 22.6% @1440 (drift + thiếu badge asset) | ⚠️ CHƯA nghĩa — số bị phương pháp thổi phồng | **phase-01 band-diff** |
| **Awards** | `/awards` | FAIL 14.96% @1440 (thứ tự card + height + badge) | ⚠️ CHƯA nghĩa — như trên | **phase-01 band-diff** |
| **Đa ngôn ngữ** | (xuyên suốt) | — | ⏸ DEFERRED | quyết định user |

## Vì sao homepage/awards CHƯA check pixel có nghĩa lúc này

`pixel-diff.mjs:139-143` neo top-left; trang > 2000px một section lệch height đẩy toàn bộ phần dưới thành mismatch → 14–22% phần lớn là **giả**. Đây đúng là vấn đề phase-01 (band-diff) sinh ra để sửa. Chạy gate full-page bây giờ = tái tạo số cũ, không thêm thông tin. **Chờ phase-01 xong mới re-gate 2 màn này.**

Countdown là 1-viewport nên không dính lỗi này → số 0.39% tin được, làm mốc chống hồi quy.

## Đa ngôn ngữ — trạng thái (DEFERRED, chưa fix)

Ghi lại để không mất dấu:
- Namespace hiện có: `login, language, countdown, board, kudos` — parity vi/en 56/56 ✓.
- **Thiếu namespace `homepage` + `awards`.** Header có nút VN/EN (`site-header.tsx:151-184`) nhưng body 2 màn hardcode tiếng Việt → đổi ngôn ngữ chỉ đổi header.
- Awards: đoạn mô tả giải dài hardcode trong `award-config.ts` → cần tách sang messages khi làm.
- Countdown: i18n đầy đủ, 0 chuỗi VN hardcode ✓.
- → Khi mở lại i18n: gate nhóm B của homepage/awards sẽ FAIL cho tới khi có 2 namespace này.

## Checkpoint nhóm B (behavior) — áp khi tới lượt từng màn

- 4 state `?ui_state=full|empty|error|loading` render khác nhau (homepage/awards chưa có fixture — phase-02 lo homepage; awards supabase-files=0 nên không cần).
- 0 console error/warning.
- Countdown: verify nút VN/EN hiện ở màn prelaunch (chưa login) + label ngày/giờ/phút đổi theo locale.

## Next (không tự chạy, chờ user)

1. Muốn số countdown tươi → bật `npm run dev` (port 3001) rồi `/aidd-ui-gate /countdown`.
2. Homepage/Awards pixel → làm phase-01 (band-diff) TRƯỚC, rồi phase-03/05.
3. Đa ngôn ngữ → khi user mở lại (hiện gác).

## Unresolved
- User có muốn re-gate countdown live ngay (cần bật dev server) hay giữ số 0.39% cũ làm mốc?
