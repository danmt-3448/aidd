# Phase 04 — Auth flow + route guard (Track B)

**Track:** B (logic) · **Depends:** 03

## Goal
Luồng đăng nhập Google end-to-end + guard điều hướng theo trạng thái auth.

## Requirements
- **Sign-in (chính, đúng design):** server action gọi `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <callback> }})` — nối vào nút "Login with Google".
- **Dev fallback (magic-link):** đường test KHÔNG có trong UI design. Gated bằng env (vd `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true`) → route riêng `src/app/dev-login/page.tsx` (nhập email → `signInWithOtp`). Prod tắt cờ → route trả 404/redirect. Giữ UI Login production đúng design (chỉ nút Google).
- **Callback:** route `src/app/auth/callback/route.ts` — `exchangeCodeForSession`, rồi redirect `/todo` (dùng chung cho cả Google lẫn magic-link).
- **Success → /todo** · **fail/hủy →** quay lại `/login?error=1`, hiển thị "Đăng nhập không thành công. Vui lòng thử lại."
- **Guard (middleware):** user đã đăng nhập vào `/login` → redirect `/todo`; chưa đăng nhập vào route protected → `/login`.
- Loading state: nút disabled trong lúc chờ.

## Files
- Create: `src/app/auth/callback/route.ts`, `src/app/login/actions.ts` (signInWithGoogle + signInWithOtp), `src/middleware.ts`
- Create (dev-only): `src/app/dev-login/page.tsx` (env-gated magic-link — KHÔNG thuộc design UI)
- Placeholder: `src/app/todo/page.tsx` (đích redirect — tối giản)

## Implementation
1. Server action `signInWithGoogle()`.
2. Callback handler exchange code → set session cookie → redirect `/todo`.
3. `middleware.ts` dùng `src/lib/supabase/middleware.ts` check session, áp guard.
4. `/login?error=1` → truyền cờ error xuống UI.

## Todo
- [ ] signInWithGoogle action (nối nút design)
- [ ] callback route (dùng chung Google + magic-link)
- [ ] dev-login magic-link (env-gated, ngoài design UI)
- [ ] middleware guard
- [ ] /todo placeholder
- [ ] error param → message

## Success
- Login Google → /todo · hủy → thấy error message · đã login vào /login → auto /todo.

## Security
- Validate `next`/redirect param (chống open-redirect) · session cookie httpOnly do @supabase/ssr quản.
