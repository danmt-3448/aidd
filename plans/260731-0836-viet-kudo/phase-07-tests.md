# Phase 07 — Tests (Vitest + Playwright) (test)

**Track:** test · **Depends:** 06 · **Nguồn:** 57 MoMorph test cases (ID-0..ID-56)

## Context
TDD-driven. Reuse hạ tầng test từ Login (vitest.config, playwright.config). Chạy trên FINAL code.

## Unit (Vitest)
- `kudo-schema`: required (receiver/content/hashtag), max 2000 content, hashtag 1–5, image mime jpg/png + ≤5MB, reject pdf/mp4/txt (ID-7,11,14,17,21–24,55,56).
- Hashtag limit logic: chặn tag thứ 6 (ID-16,17,53).
- Image logic: ẩn nút ở 5, hiện lại khi xóa (ID-18–20,38–40,54).
- Anonymous logic: toggle show/hide alias (ID-41–44).
- Hooks: `use-create-kudo` success/error path (mock action).

## E2E (Playwright)
- Access: chưa login → redirect (ID-1); đã login → mở modal (ID-0,2).
- GUI: layout order, placeholder, checkbox default unchecked (ID-3–6).
- Recipient autocomplete + select (ID-8,25,26); trim spaces (ID-10).
- Content @mention (ID-12,13,33); format B/I/S/list/link/quote (ID-27–32).
- Hashtag add/remove/limit (ID-15,34–36).
- Image add/remove/type (ID-37,39; invalid ID-23,24,55).
- Submit success → data vào DB + toast + reset (ID-46,47); Cancel discard (ID-45).
- Gửi disabled/enabled (ID-48,49); all-empty errors (ID-56).

## Success criteria
- Unit + E2E pass 100%; không fake data / không wave qua fail.
- Verify row `kudos` + `kudo_hashtags` + `kudo_images` thật sau submit.

## Todo
- [ ] Unit: schema + limit/anonymous/image logic + hooks
- [ ] E2E: access, GUI, recipient, editor, hashtag, image, submit/cancel/validation
- [ ] Chạy `npm run test` + `npm run test:e2e` xanh
