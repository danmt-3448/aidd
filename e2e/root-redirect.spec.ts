/**
 * E2E — Root path redirect regression (bug: authed `/` showed create-next-app scaffold)
 *
 * Prerequisites (before running npm run test:e2e):
 *   1. Local Next.js server running  → npm run dev
 *   2. Local Supabase running        → supabase start
 *   3. NEXT_PUBLIC_ENABLE_DEV_LOGIN=true in .env.local
 *   4. Seed applied                  → supabase db reset
 */

import { test, expect, type Page } from '@playwright/test'

const SENDER_EMAIL = 'nguyen.van.an@sun-asterisk.com'
const SENDER_PASSWORD = 'TestPass123!'

/**
 * Log in via /dev-login (same pattern as viet-kudo.spec.ts).
 * Waits for redirect to /kudos before returning.
 */
async function devLogin(
  page: Page,
  email = SENDER_EMAIL,
  password = SENDER_PASSWORD,
): Promise<void> {
  await page.goto('/dev-login')
  await page.getByPlaceholder('you@sun-asterisk.com').fill(email)
  await page.getByPlaceholder('password').fill(password)
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await page.waitForURL('/kudos', { timeout: 10_000 })
}

test.describe('Root path redirect', () => {
  /**
   * TC-REDIRECT-01: Unauthenticated user hitting / lands on /login AND the login
   * page actually renders (rules out redirect-loop or blank 404 passing on URL alone).
   * Selector sourced from: src/features/auth/components/login-screen.tsx +
   *   src/features/auth/components/google-login-button.tsx (i18n key login.googleButton
   *   resolves to "LOGIN With Google" — confirmed by e2e/login.spec.ts).
   */
  test('TC-REDIRECT-01: unauthenticated / redirects to /login and renders login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
    // Assert the Google sign-in button is present — proves the login screen rendered,
    // not a redirect loop or a 404.
    await expect(page.getByRole('button', { name: /login with google/i })).toBeVisible()
  })

  /**
   * TC-REDIRECT-02: Authenticated user hitting / lands on /todo AND the todo page
   * actually renders (rules out redirect-loop or 404 passing on URL alone).
   * Selector sourced from: src/app/todo/page.tsx — <h1> "Đăng nhập thành công 🎉".
   */
  test('TC-REDIRECT-02: authenticated / redirects to /todo and renders todo page', async ({ page }) => {
    await devLogin(page)
    await page.goto('/')
    await expect(page).toHaveURL('/todo', { timeout: 10_000 })
    // Assert the stable h1 heading from the todo placeholder page — proves the page
    // rendered real content, not a blank shell or error page.
    await expect(page.getByRole('heading', { name: /đăng nhập thành công/i })).toBeVisible()
  })
})
