# Phase 06 — Integration (Track A + B)

**Track:** A+B · **Depends:** 01, 04, 05

## Goal
Ghép UI Login (Track A) với auth flow (04) + i18n (05): thay mock bằng thật.

## Requirements
- Nút "LOGIN With Google" → gọi `signInWithGoogle()`; `loading` prop nối trạng thái pending.
- Error param `/login?error=1` → hiển thị message qua i18n key.
- LanguageSelector (UI) → wire vào `language-switcher` thật (cookie NEXT_LOCALE).
- Toàn bộ text Login đọc từ next-intl messages (thay text hardcode/mock).
- `/login` là Server Component check session (đã login → redirect /todo qua middleware/guard).

## Files
- Modify: `src/app/login/page.tsx` (+ component Login từ phase 01), wire actions + i18n
- Modify: Login UI components → nhận props thật thay mock

## Implementation
1. Nối `onLoginClick` → server action; disable nút khi pending.
2. Đọc error từ searchParams → message.
3. Thay text tĩnh bằng `useTranslations`/`getTranslations`.
4. LanguageSelector dùng component thật.

## Todo
- [ ] Wire login action + loading
- [ ] Error message hiển thị
- [ ] i18n text thay mock
- [ ] LanguageSelector thật
- [ ] Guard redirect hoạt động

## Success
- Bấm Google → OAuth → /todo · hủy → error VN/EN đúng · đổi ngôn ngữ toàn màn · compile + lint pass.
