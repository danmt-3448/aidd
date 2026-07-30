# Phase 07 — Tests: Vitest + Playwright (TDD)

**Track:** test · **Depends:** 06

## Goal
Unit + E2E phủ luồng Login theo test case MoMorph + DoD.

## Requirements
- **Setup:** Vitest + React Testing Library; Playwright (config, browser).
- **Unit (Vitest):**
  - Guard logic: đã login → redirect /todo; chưa → cho vào /login.
  - Redirect param an toàn (chống open-redirect).
  - i18n: đổi locale → message đổi; cookie NEXT_LOCALE set.
  - Login component: click gọi handler, `loading` → nút disabled, error prop → hiển thị message.
- **E2E (Playwright):**
  - Render Login: logo trái, language phải, nút Google, footer (theo test case GUI).
  - Language dropdown mở; đổi VN→EN đổi text.
  - Click Google → bắt đầu OAuth (mock/stub provider ở local).
  - Error state hiển thị message khi `?error=1`.
  - Unauthenticated thấy /login; authenticated /login → /todo.

## Files
- Create: `vitest.config.ts`, `playwright.config.ts`, `src/**/*.test.ts(x)`, `e2e/login.spec.ts`
- Deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`

## Todo
- [ ] Vitest + Playwright config
- [ ] Unit: guard, redirect, i18n, component
- [ ] E2E: layout, language, login, error, guard
- [ ] Tất cả pass (không skip, không fake)

## Success
- `npm run test` + `npm run test:e2e` xanh · phủ các test case GUI/FUNCTION của screen GzbNeVGJHz.
