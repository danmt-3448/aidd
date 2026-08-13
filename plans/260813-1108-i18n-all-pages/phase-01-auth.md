# Phase 01 — auth i18n

**blockedBy:** [00] · parallel · Role: fe-developer · subagent: implementer
**Owns JSON:** `messages/{vi,en}/auth.json` · namespace `auth` (nav/common → dùng `common`, không tự thêm)

## Goal
Trích chuỗi hardcode VN của auth flow ra `auth` namespace; thay bằng `useTranslations('auth')`.

## Files (chỉ chạm những file này)
- `src/features/auth/components/*.tsx` (5 file có VN text — gồm `login-screen.tsx` đã dùng key cũ `login.*` → đổi sang `auth.*` khớp Phase 00)
- `src/app/login/page.tsx`
- `src/app/dev-login/page.tsx`, `src/app/dev-login/dev-login-form.tsx`

## Rules
- VN **verbatim** (giữ UI + test pass). EN **dịch chuẩn nghĩa**.
- Client component → `useTranslations`; server component/page → `getTranslations`.
- Chuỗi dùng chung (nút, "Bản quyền…") → dùng `common`, KHÔNG lặp vào `auth`.
- Điền **cả** `vi/auth.json` và `en/auth.json` cùng bộ key.

## Out of scope
Không chạm file feature khác, không sửa request.ts, không đụng `common.json` (chỉ đọc key có sẵn).

## Success
0 hardcode VN trong file sở hữu; vi/en auth.json cùng key; `npx tsc --noEmit` PASS cho vùng sửa.
