# UI-First Gate — /countdown (Countdown Prelaunch, 8PJQswPZmU) — **behavior PASS · visual NEAR (6.2%)** (run 2)

Port: localhost:3001 · ref node 2268:35127 · artboard 1512×1077 (scaled→1440×1025).

## A. Visual — pixel-diff **6.22% unmasked** (tự đo, KHÔNG dùng số masked của subagent)
- Sau fix run1: `?ui_state=full` render đúng state đếm ("Sự kiện sẽ bắt đầu sau" + `00 05 20`). Artwork phải khớp.
- **Residual 6.22%** gồm 2 phần (xem `_gate-ref/countdown-verify-diff.png`):
  1. **i18n hợp lệ** — app label VN `NGÀY/GIỜ/PHÚT`, Figma sample EN `DAYS/HOURS/MINUTES`. App đúng (default VN theo spec). KHÔNG phải defect.
  2. **Offset dọc ~80px** — app content block (title y=383) thấp hơn Figma (~y=300 scaled) → title/LED block bị ghost trong diff. Đây là drift thật cần chỉnh vertical-align về đúng Y Figma.
- ⚠️ Subagent báo 0.24% là do **mask nguyên khối x400-1040 y250-600** → che mất offset. Không nhận số đó.
- Console localhost: **0 error**.

## B. Behavior — **PASS**
- ✅ `?ui_state=full|done|loading` toggle HOẠT ĐỘNG (mock fixtures `countdown.mock.ts` mới) — ép được cả 3 state.
- ✅ 0 console error.

## Verdict: **behavior PASS · visual chưa clean (6.2%)** — cần 1 polish: dịch content block lên đúng Y Figma (~80px), lấy Y từ node thật. Sau đó chỉ còn i18n labels (mask hợp lệ) → ≤1%.
## Follow-up fix (deferred để đi tiếp các màn khác theo yêu cầu): vertical position content vs node 2268:35127.
