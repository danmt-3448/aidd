# Phase 02 — Dedupe auth (React cache + getClaims)

**Priority:** P0 · **Risk:** Thấp · **Status:** ✅ DONE (260816)

> **Kết quả:** `getCurrentUser` (React `cache()`) + `toHeaderUser` (gỡ mapping lặp 6 page). Đo prod: 1 render `/awards` = **1 getUser** (trước là 2: page + getIsAdmin) → cache() dedupe qua ranh giới server-action OK. tsc+lint+581 unit xanh. Tầng 2 getClaims: KHÔNG áp cho page (giữ getUser full — an toàn; đòn getClaims đã ở Phase 06 cho middleware).

> **Scope (red-team F2/F3):** phase này chỉ dedupe getUser **trong 1 render page** (page + getIsAdmin → 1). KHÔNG chạm getUser của middleware (đó là Phase 06 — process khác, không share được). Tầng 2 getClaims ở đây = optional; đòn getClaims chính nằm ở Phase 06 (middleware). Ưu tiên làm tầng 1 (cache) cho chắc.

## Context
1 lần render `/board` gọi `getUser()` mạng **3 lần**:
- `proxy.ts:23` `updateSession()` → `middleware.ts` `supabase.auth.getUser()` (network, riêng process middleware).
- `board/page.tsx:19` `await supabase.auth.getUser()` (network).
- `get-is-admin.ts:18` `getIsAdmin()` gọi `getUser()` lần nữa (network) + query `profiles`.

`getUser()` verify token với Auth server (round-trip). Trong **1 lần render server component**, page + getIsAdmin là 2 getUser tách rời có thể gộp. `getClaims()` verify JWT cục bộ (không mạng) nếu Supabase project bật asymmetric signing keys.

Các page cùng pattern: `page.tsx`, `board`, `profile`, `awards`, `kudos`, `notifications` (đều `getUser` + `getIsAdmin`).

## Goal
Giảm số getUser round-trip mỗi navigation. Trong 1 render: gộp về **1** getUser (thay vì 2). Nếu getClaims local hoạt động → còn ~0 mạng cho identity.

## Requirements (2 tầng, tầng 1 an toàn tuyệt đối)
- **Tầng 1 (BẮT BUỘC, rủi ro thấp):** Bọc auth resolve trong React `cache()` để dedupe trong 1 request render. `getIsAdmin` KHÔNG gọi getUser lại — nhận user từ cached resolver hoặc từ caller truyền xuống. → board: page-render getUser 2→1.
- **Tầng 2 (optional, verify trước):** Thử `supabase.auth.getClaims()` cho identity-only path. Lưu ý (F7): getClaims fetch JWKS **1 lần** rồi cache → không phải "0 mạng" tuyệt đối lúc cold, nhưng các call sau ~0 mạng, vẫn rẻ hơn getUser nhiều. Nếu getClaims không verify được local với config hiện tại → **giữ tầng 1**. Đòn getClaims chính ở Phase 06.

## Related Code Files
- **Create:** `src/features/auth/get-current-user.ts` — cached auth resolver (`import { cache } from 'react'`), single source cho identity trong 1 render.
- **Modify:** `src/features/auth/get-is-admin.ts` — dùng cached resolver, bỏ getUser trùng.
- **Modify:** `page.tsx`, `board/page.tsx`, `profile/page.tsx`, `awards/page.tsx`, `kudos/page.tsx`, `notifications/page.tsx` — dùng cached resolver.
- **Read:** `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`.

## Steps
1. Viết `get-current-user.ts`: `export const getCurrentUser = cache(async () => { ... getUser() ... })`.
2. Refactor `getIsAdmin` → gọi `getCurrentUser()` (cached), bỏ getUser riêng; giữ query profiles.
3. Đổi các page sang `getCurrentUser()`. Xác nhận cache() gộp getUser của page + getIsAdmin thành 1 network call/render.
4. **Tầng 2 (điều kiện):** POC `getClaims()` local verify — đo có request mạng không (Network tab). PASS → áp cho identity path; FAIL → dừng, note lý do.
5. `tsc --noEmit`; chạy unit auth-liên-quan.

## Success Criteria
- board render: getUser mạng 2→1 (đo Network). Auth/redirect/isAdmin behavior không đổi.
- Unit tests auth xanh; e2e `authed` (board/profile/awards/notifications) + root-redirect xanh.
- Tầng 2: verdict rõ ràng (áp dụng / không, kèm lý do đo được).

## Risk & Mitigation
- getClaims đổi ngữ nghĩa xác thực → chỉ dùng khi verify local OK; mặc định giữ getUser (đã an toàn) + chỉ dedupe.
- `cache()` chỉ scope trong 1 request render — không rò rỉ giữa user. An toàn.

## Out of scope
Không gộp getUser của middleware với page (khác process/invocation — không share được). Không đổi RLS.
