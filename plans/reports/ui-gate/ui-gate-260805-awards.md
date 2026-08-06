# UI-First Gate — /awards (Hệ thống giải, zFYDgyj_pD) — **visual FAIL (near) · structure OK** (run 1)

Port: localhost:3001 · ref node 313:8436 · artboard 1440×**6410** · app 1440×5232.

## A. Visual — **14.96% (FAIL)**
- **Cấu trúc khớp mạnh**: hero "ROOT FURTHER" + artwork màu, "Hệ thống giải thưởng", sidebar trái (nav icons), chuỗi card giải (badge tròn vàng + mô tả + "Số lượng giải thưởng" + "Giá trị giải thưởng VND"), footer CTA "Sun* Kudos" + KUDOS wordmark. Style (card tối, badge vàng, layout) đúng.
- **Khác biệt gây diff**:
  1. **Thứ tự card đổi** — app: Top Talent → Top Project → …; ref: TOP PROJECT → Top Talent → … (swap 2 card đầu).
  2. **Chiều cao lệch ~1178px** (app 5232 vs ref 6410) → app compact hơn / thiếu spacing.
  3. Giá trị VND / số lượng theo từng card lệch (do đổi thứ tự + data khác).
  4. Badge text trên vòng tròn cần verify khớp từng card (nghi reuse asset "TOP TALENT").
- Console localhost: **0 error**.

## B. Behavior — chưa chấm đầy đủ (sidebar nav scroll-to-section, hover card).

## Verdict: **FAIL visual (14.96%)** — layout/style đúng bản chất nhưng thứ tự card + chiều cao + giá trị lệch Figma. Cần FE align thứ tự/spacing/badge theo node 313:8436.
