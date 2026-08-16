# Phase 06 — updateSession getUser → getClaims (lever chính)

**Priority:** P0 · **Risk:** TB (auth/route-guard) · **Status:** ✅ DONE (260816) · **Depends:** Phase 00

> **Kết quả (đo prod):** MW getUser network 24–134ms/nav → getClaims **local 1–6ms** (27/28 call local, 1 fallback đúng ở /dev-login pre-auth). Fix reviewer H1: thêm guard `exp > now` (token hết hạn → fallback getUser refresh). Test: `src/lib/supabase/middleware.test.ts` 5/5. E2E public+authed pass, session-longevity OK. Reviewer APPROVED_WITH_CONDITIONS → conditions resolved.

## Context (red-team F3)
`middleware.ts` `updateSession()` gọi `supabase.auth.getUser()` — **1 round-trip mạng tới Auth server trên MỖI navigation** (matcher `proxy.ts:104` phủ mọi route non-asset). Đây là cost per-nav lặp nhiều nhất và **ROI cắt latency cao nhất** — cao hơn Phase 3/4/5 cộng lại (nghi ngờ, xác nhận bằng số Phase 00).

`getUser()` verify token với Auth server (network). `getClaims()` (supabase-js 2.111 ✓) verify JWT **cục bộ** bằng JWKS (fetch JWKS 1 lần rồi cache → các nav sau ~0 mạng cho verify).

## Goal
Thay round-trip `getUser()` per-nav trong updateSession bằng verify cục bộ (`getClaims`), GIỮ NGUYÊN: refresh cookie session + giá trị `user` mà route guard dùng (`proxy.ts` đọc `user.id`, `pathname`).

## Requirements
- **Verify bảo mật TRƯỚC (blocking):** getClaims local verification có hợp lệ với config Supabase project này không? (asymmetric signing keys bật? JWKS endpoint reachable?). Supabase SSR guidance mặc định khuyên getUser trong middleware — phải hiểu rõ trade-off. Nếu KHÔNG chắc an toàn → **DỪNG, giữ getUser**, ghi lý do; plan vẫn còn Phase 2/3 win.
- Cookie refresh KHÔNG được mất — `updateSession` phải tiếp tục set cookie đã refresh (logic `setAll` giữ nguyên). getClaims không tự refresh token → cần đảm bảo session refresh vẫn xảy ra (có thể vẫn cần 1 getSession/refresh path; đo kỹ).
- `user` trả về cho `proxy.ts` phải có đủ field guard dùng: `id` (cho profiles query pre-launch), truthy-check (auth fast-path). Map từ claims (`sub` → id).
- Fallback getUser khi getClaims fail (token lạ, JWKS lỗi) — fail-safe về hành vi hiện tại.

## Related Code Files
- **Modify:** `src/lib/supabase/middleware.ts` (`updateSession`).
- **Read:** `src/proxy.ts` (xem `user` được dùng thế nào — `.id`, truthy), `src/lib/supabase/server.ts`.
- Có thể cần helper: map JWT claims → shape `{ id }` guard cần.

## Steps
1. Verify getClaims local (POC ngoài luồng): gọi trong middleware, đo Network — có request `/auth/v1/user` không? JWKS fetch mấy lần? Ghi vào report.
2. PASS → refactor updateSession: getClaims cho identity, giữ cookie refresh; fallback getUser on error.
3. FAIL/không chắc → dừng, note, đóng phase (không phải regression — chỉ là không áp dụng được).
4. `tsc --noEmit`.

## Success Criteria
- Nav vào route protected: **KHÔNG còn request `/auth/v1/user` từ middleware** (đo Network, so Phase 00). Cookie session vẫn refresh (login không rớt qua nhiều nav).
- **e2e `public` countdown + `authed` (board/profile/root-redirect/auth-check) xanh** — auth guard + gate behavior không đổi.
- Session không rớt sau nhiều lần điều hướng (test: nav qua lại 10+ lần, vẫn authed).

## Risk & Mitigation
- **Bảo mật:** getClaims verify cục bộ — nếu signing key rotate/không đúng cấu hình có thể chấp nhận token sai. → chỉ áp khi verify đúng + fallback getUser; phủ e2e auth kỹ.
- **Token refresh:** getUser side-effect refresh; getClaims không → phải giữ đường refresh riêng, test session-longevity.
- Không chắc → **giữ getUser** (an toàn tuyệt đối), plan vẫn có Phase 2/3.

## Out of scope
Không đổi RLS, không đổi auth fast-path logic của proxy (chỉ đổi cách lấy `user`).
