# UI-First Gate — / (Homepage SAA, i87tDx10uM) — **visual FAIL (near) · structure OK** (run 1)

Port: localhost:3001 · ref node 2167:9026 · artboard 1512×4480 (scaled→1440×4266) · app 1440×4326.

## A. Visual — **22.6% (FAIL)**
- **Cấu trúc + chiều cao khớp** (app 4326 ≈ ref-scaled 4266): hero "ROOT FURTHER" + countdown row + artwork phải + buttons ABOUT/AWARD, section "ROOT FURTHER" mô tả, "Hệ thống giải thưởng" grid, footer "Sun* Kudos" CTA.
- **Gap chính — awards grid card THIẾU badge tròn vàng**: Figma mỗi card có badge vàng lớn (TOP TALENT/TOP PROJECT/TOP PROJECT LEADER/BEST MANAGER/MVP/Signature); app card **tối trống** chỉ text nhỏ → mất mảng vàng lớn = phần lớn 22.6% diff.
- Countdown row: i18n VN "NGÀY/GIỜ/PHÚT" vs Figma EN (hợp lệ) + có thể ở state ended (digits 00).
- Console localhost: **0 error**.

## B. Behavior — chưa chấm đầy đủ (nút ABOUT/AWARD scroll, countdown).

## Verdict: **FAIL visual (22.6%)** — layout đúng nhưng awards grid thiếu badge tròn vàng (asset). Cần FE thêm badge graphics vào grid card khớp node 2167:9026.
