/**
 * E2E — Awards, Rules, and Secret Box screens.
 *
 * Prerequisites (before running npm run test:e2e):
 *   1. Local Next.js server running  → npm run dev
 *   2. Local Supabase running        → supabase start
 *   3. NEXT_PUBLIC_ENABLE_DEV_LOGIN=true in .env.local
 *   4. Seed applied                  → supabase db reset
 *
 * Auth strategy:
 *   - TC-xx-01 tests (unauthenticated redirect) run with empty storageState
 *     via test.use() override, so they work correctly in the 'authed' project.
 *   - TC-xx-02 tests (authenticated content) use the project-level storageState
 *     (regular user session from global-setup).
 *
 * Guard rules: /awards, /rules, /secret-box are NOT in PUBLIC_PATHS → proxy
 * redirects unauthenticated requests to /login.
 */

import { test, expect } from '@playwright/test'

// ── /awards ──────────────────────────────────────────────────────────────────

test.describe('/awards — unauthenticated', () => {
  // Override the project-level storageState for this describe block.
  // This makes the browser start with no session, so the proxy guard redirects.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('TC-AWARDS-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})

test.describe('/awards — authenticated', () => {
  test('TC-AWARDS-02: authenticated user sees all 6 award titles', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('networkidle')

    const expectedTitles = [
      'Top Talent',
      'Top Project',
      'Top Project Leader',
      'Best Manager',
      'Signature 2025 Creator',
      'MVP',
    ]

    for (const title of expectedTitles) {
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 })
    }
  })
})

// ── /rules ───────────────────────────────────────────────────────────────────

test.describe('/rules — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('TC-RULES-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/rules')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})

test.describe('/rules — authenticated', () => {
  test('TC-RULES-02: authenticated user sees rules headings and Viết KUDOS button', async ({ page }) => {
    await page.goto('/rules')
    await page.waitForLoadState('networkidle')

    // Rules panel headings from rules-content.ts
    await expect(
      page.getByText('NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC'),
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByText('NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN'),
    ).toBeVisible({ timeout: 10_000 })

    // "Viết KUDOS" button opens the compose modal
    const writeBtn = page.getByRole('button', { name: /viết kudos/i })
    await expect(writeBtn).toBeVisible({ timeout: 10_000 })
    await writeBtn.click()

    // After click the compose modal should appear
    await expect(page.getByRole('dialog', { name: 'Viết Kudo' })).toBeVisible({
      timeout: 5_000,
    })
  })
})

// ── /secret-box ───────────────────────────────────────────────────────────────

test.describe('/secret-box — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('TC-SECRETBOX-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})

test.describe('/secret-box — authenticated', () => {
  test('TC-SECRETBOX-02: authenticated user sees the secret box UI', async ({ page }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('networkidle')

    // The modal title from SecretBoxModal (Figma copy)
    await expect(
      page.getByText('KHÁM PHÁ SECRET BOX CỦA BẠN'),
    ).toBeVisible({ timeout: 10_000 })

    // The counter label
    await expect(page.getByText('Secretbox chưa mở')).toBeVisible({ timeout: 10_000 })
  })
})
