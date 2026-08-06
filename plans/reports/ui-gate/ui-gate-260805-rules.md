# UI-First Gate — /rules (Thể lệ UPDATE, b1Filzi9i6) — **FAIL / needs investigation** (run 1)

Port: localhost:3001 · ref node 3204:6051 · artboard **1440×1796** (trang dài).

## A. Visual — chưa diff được (lệch cấu trúc)
- **App render "Thể lệ" như MODAL chiều cao cố định** (~1024px, footer nút "Đóng"/"Viết KUDOS" ở giữa viewport, scroll nội bộ). **Figma artboard là trang dài 1440×1796** (content trải hết, footer ở đáy).
- → không pixel-diff trực tiếp được (1024 vs 1796). Cần xác định Figma "Thể lệ" là modal hay full-page; nếu modal thì app đúng hướng nhưng chiều cao/scroll khác Figma.
- Nội dung có mặt: "Thể lệ", HUY HIỆU HERO (tier badges), 6 ICON (REVIVAL/TOUCH OF LIGHT/STAY COOL/.../ROOT FURTHER), KUDOS QUỐC DÂN, footer Đóng + Viết KUDOS (vàng).
- Console localhost: **0 error**.

## B. Behavior — chưa chấm đầy đủ (modal open/close, Viết KUDOS nav).

## Verdict: **FAIL / cần điều tra** — modal-vs-fullpage. Deferred để tiếp tục sweep các màn khác.
