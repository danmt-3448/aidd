# Phase 00 — Baseline measurement (prod) — GATE

**Priority:** P0 · **Risk:** — · **Status:** pending · **Chạy TRƯỚC mọi phase khác**

## Context
Red-team (F4): số trên Turbopack dev vô nghĩa (không prefetch, compile per-request). F2/F3 chỉ đáng làm nếu proxy/middleware thực sự chiếm phần lớn thời gian 1 nav. **Đo trước, đừng đoán.**

## Goal
Có số baseline trên **prod build** để (a) quyết Phase 1/5 có đáng không, (b) so sánh after mỗi phase.

## Steps
1. `npm run build && npm run start` (prod, KHÔNG dev). Authed session thật (`e2e/.auth/user.json`), real seeded data (`npm run db:reset`).
2. DevTools Network (Disable cache) → điều hướng vào `/board`, `/profile`, `/notifications`. Ghi mỗi nav:
   - Số request `getUser` (Auth `/auth/v1/user`) + tổng thời gian tới byte RSC đầu tiên (`?_rsc`).
   - Thời gian "dead" từ click → bắt đầu có response (≈ proxy/middleware cost).
3. Lighthouse mobile `/board`: TTFB + TBT.
4. Server timing nếu có: log thời gian trong `updateSession` vs page render (tạm thêm `console.time` local, gỡ sau).
5. Ghi tất cả vào `reports/baseline-260816-prod-nav.md`: bảng route × (dead-time, #getUser, TTFB, TBT).

## Success Criteria (gate)
- Có bảng số baseline prod.
- Kết luận rõ: **proxy chiếm ~X% thời gian nav**. X lớn → Phase 1 (getClaims proxy) + Phase 5 ưu tiên cao. X nhỏ → hạ chúng, dồn Phase 2/3.

## Out of scope
Không sửa code sản phẩm ở phase này (trừ `console.time` tạm, gỡ ngay).
