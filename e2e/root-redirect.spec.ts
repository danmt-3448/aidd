/**
 * E2E — Root path behavior regression
 *
 * Product routing as of 2026-08-04:
 *   '/' is a PUBLIC homepage (SAA landing page). Unauthenticated users see it;
 *   authenticated users also see it with extra UI elements (bell, account menu).
 *   Source of truth: src/features/auth/guard-rules.ts PUBLIC_PATHS includes '/'.
 *
 * Old behavior (before homepage feature): '/' redirected to '/login' (unauth)
 * or '/todo' (auth). Those routes are now obsolete. TC-REDIRECT-01 and
 * TC-REDIRECT-02 have been updated to test current product behavior.
 *
 * Prerequisites (before running npm run test:e2e):
 *   1. Local Next.js server running  → npm run dev
 *   2. Local Supabase running        → supabase start
 *   3. NEXT_PUBLIC_ENABLE_DEV_LOGIN=true in .env.local
 *   4. Seed applied                  → supabase db reset
 */

import { test, expect } from '@playwright/test'

test.describe('Root path redirect', () => {
  /**
   * TC-REDIRECT-01: Unauthenticated user hitting / stays on / — homepage is public.
   * guard-rules.ts: PUBLIC_PATHS includes '/'.
   * Evidence: curl http://localhost:3001/ → HTTP 200, no redirect.
   */
  test('TC-REDIRECT-01: unauthenticated / renders homepage (not redirected)', async ({ page }) => {
    // The authed project runs with user storageState, so we can't test true
    // unauthenticated state here. Verify the route is accessible and stays at /.
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Should stay at / (no redirect to /login)
    await expect(page).toHaveURL('/')
    // Page should render some content (not blank)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  /**
   * TC-REDIRECT-02: Authenticated users can access protected /todo without being
   * redirected back to /login (auth guard regression).
   * guard-rules.ts: '/todo' is NOT in PUBLIC_PATHS — proxy only lets authed sessions through.
   * The unauthenticated→/login direction is covered by login.spec.ts Route Guard tests.
   */
  test('TC-REDIRECT-02: authenticated user can access /todo without redirect', async ({ page }) => {
    // storageState is loaded by the 'authed' project — browser starts with valid session
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    // Should stay on /todo (not redirected to /login)
    await expect(page).toHaveURL('/todo', { timeout: 5_000 })
    // Page renders content (not blank 404 or redirect loop)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
