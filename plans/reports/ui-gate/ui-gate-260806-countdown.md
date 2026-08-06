# UI-First Gate — /countdown (Countdown Prelaunch, 8PJQswPZmU) — **PASS** (run 3)

Port: localhost:3001 · ref node 2268:35127 · artboard 1512×1077 (scaled→1440×1025).
Screenshots via project Playwright lib (MCP screenshot hangs on `document.fonts.ready` với DSEG font).

## A. Visual — pixel-diff (`scripts/pixel-diff.mjs`, AA on) — **PASS**
- **1440 = 0.39%** (mask: digit values `428,382,662,130` + i18n labels `428,524,662,58`) → PASS ≤ 1%. Raw unmask = 1.43% (chỉ viền AA quanh digit/title + art phải).
- **1280 = 0.69%** → PASS. Không overflow / vỡ layout.
- Mask hợp lệ: (a) **digit values** 00/05/20 = dynamic countdown; (b) **labels** NGÀY/GIỜ/PHÚT vs sample EN DAYS/HOURS/MINUTES = i18n (app default VN đúng spec). Digit **style 7-segment** đã verify bằng mắt TRƯỚC khi mask (diff chỉ viền AA, không fill đỏ → box glassy + font khớp).
- diff images: `_gate-ref/countdown-1440-diff.png` (raw), `countdown-1440-diff-masked.png`.

## B. Behavior (mock data) — **PASS**
- [x] `?ui_state=full|done|loading` toggle hoạt động — 3 state render phân biệt (full: title + 6 digit 7-seg; done/loading: không digit, shell riêng).
- [x] DSEG7Classic font **load=true** ở state có digit (trước đây `error`).
- [x] **0 console error + 0 warning** ở cả 3 state.
- [x] Không interactive element (màn hiển thị thụ động) — N/A form/click. Navigation vào màn do pre-launch gate ở `proxy.ts` (ngoài phạm vi screen).

## Root cause đã fix (2 điểm)
1. **Font 7-segment không load** — `proxy.ts` matcher loại trừ `_next/static` + ảnh nhưng **KHÔNG loại font** → request `/fonts/DSEG7Classic-Regular.woff2` (không mang `?ui_state`) lọt auth guard → **307 redirect `/login`** → font `error` → digit fallback monospace (số thường). Fix: thêm `woff|woff2|ttf|otf|eot` vào negative-lookahead của matcher. Font giờ serve **HTTP 200 font/woff2**.
2. **Vị trí dọc lệch ~90px** — app center dọc 50vh; Figma "Countdown time" frame (node 2268:35136) y=314–577/1077 → tâm khối **41.4%**. Fix: `translateY(-8.6vh)` trên content block (proportional, giữ responsive). Horizontal center (`items-center`) đã đúng theo node 2268:35138 (Time row center=755.5/1512=50%).

## Files changed
- `src/proxy.ts` — matcher exclude font extensions.
- `src/features/countdown/components/countdown-screen.tsx` — translateY vertical bias + comment node refs.
- (uncommitted trước đó: countdown-display justify-center, ui_state mock wiring — giữ nguyên, đúng.)

## Verdict: **PASS** — visual 1440=0.39% · 1280=0.69% (≤1%) + behavior 3 state clean. → đủ điều kiện integration (wire real event_config) → test → review.
