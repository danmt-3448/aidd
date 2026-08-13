# Phase 05 — i18n setup (next-intl) (Track B)

**Track:** B (i18n) · **Depends:** none (parallel với auth chain)

## Goal
Cấu hình next-intl cho VN/EN, cookie `NEXT_LOCALE`, sẵn sàng cho Language selector đổi ngôn ngữ toàn trang.

## Requirements
- Locale: `vi` (default) + `en`. Lưu lựa chọn vào cookie `NEXT_LOCALE`.
- Message catalog cho Login: title/subtitle/tagline, nút "LOGIN With Google", footer, error message — cả VN + EN.
- Provider bọc app; helper đọc/ghi locale.

## Files
- Create: `src/i18n/request.ts` (next-intl config), `messages/vi.json`, `messages/en.json`
- Modify: `src/app/layout.tsx` (NextIntlClientProvider), `next.config.ts` (plugin next-intl)
- Create: `src/components/language-switcher.tsx` (đổi cookie + refresh)
- Dep: `next-intl`

## Implementation
1. `npm i next-intl`
2. Cấu hình cookie-based locale (không route prefix — giữ URL sạch).
3. Trích text VN từ Figma spec; dịch EN.
4. LanguageSwitcher set cookie `NEXT_LOCALE` + `router.refresh()`.

## Todo
- [ ] Cài next-intl
- [ ] request.ts + provider
- [ ] messages vi/en
- [ ] language-switcher

## Success
- Đổi VN↔EN → toàn bộ text Login đổi · cookie `NEXT_LOCALE` set · reload giữ ngôn ngữ.
