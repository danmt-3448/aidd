/**
 * E2E — Awards, Rules, and Secret Box screens.
 *
 * Prerequisites (before running npm run test:e2e):
 *   1. Local Next.js server running  → npm run dev
 *   2. Local Supabase running        → supabase start
 *   3. NEXT_PUBLIC_ENABLE_DEV_LOGIN=true in .env.local
 *   4. Seed applied                  → supabase db reset
 *
 * Auth strategy: dev-login helper (same pattern as root-redirect.spec.ts).
 * Unauthenticated redirect assertions run unconditionally.
 * Authenticated flow assertions are skip-gated because Supabase local is not
 * running in the current environment — remove skip when the stack is up.
 */

import { test, expect, type Page } from '@playwright/test'

const SENDER_EMAIL = 'nguyen.van.an@sun-asterisk.com'
const SENDER_PASSWORD = 'TestPass123!'

/** Log in via /dev-login and wait for redirect to /kudos. */
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

// ── /awards ──────────────────────────────────────────────────────────────────

test.describe('/awards', () => {
  test('TC-AWARDS-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/awards')
    await expect(page).toHaveURL('/login')
  })

  test('TC-AWARDS-02: authenticated user sees all 6 award titles', async ({ page }) => {
    // skip: Supabase local is not running in the current environment.
    // Remove this skip when supabase start + seed have been applied.
    test.skip(process.env.E2E_SUPABASE !== '1', 'Set E2E_SUPABASE=1 with Supabase local + seed running to exercise authenticated flows')

    await devLogin(page)
    await page.goto('/awards')

    const expectedTitles = [
      'Top Talent',
      'Top Project',
      'Top Project Leader',
      'Best Manager',
      'Signature 2025 Creator',
      'MVP',
    ]

    for (const title of expectedTitles) {
      await expect(page.getByText(title).first()).toBeVisible()
    }
  })
})

// ── /rules ───────────────────────────────────────────────────────────────────

test.describe('/rules', () => {
  test('TC-RULES-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/rules')
    await expect(page).toHaveURL('/login')
  })

  test('TC-RULES-02: authenticated user sees rules headings and Viết KUDOS button', async ({ page }) => {
    // skip: Supabase local is not running in the current environment.
    // Remove this skip when supabase start + seed have been applied.
    test.skip(process.env.E2E_SUPABASE !== '1', 'Set E2E_SUPABASE=1 with Supabase local + seed running to exercise authenticated flows')

    await devLogin(page)
    await page.goto('/rules')

    // Rules panel headings from rules-content.ts
    await expect(
      page.getByText('NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC'),
    ).toBeVisible()
    await expect(
      page.getByText('NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN'),
    ).toBeVisible()

    // "Viết KUDOS" button opens the compose modal
    const writeBtn = page.getByRole('button', { name: /viết kudos/i })
    await expect(writeBtn).toBeVisible()
    await writeBtn.click()

    // After click the compose modal should appear (distinct from the rules panel,
    // which is itself role="dialog") — target the compose modal by its aria-label.
    await expect(page.getByRole('dialog', { name: 'Viết Kudo' })).toBeVisible({
      timeout: 5_000,
    })
  })
})

// ── /secret-box ───────────────────────────────────────────────────────────────

test.describe('/secret-box', () => {
  test('TC-SECRETBOX-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/secret-box')
    await expect(page).toHaveURL('/login')
  })

  test('TC-SECRETBOX-02: authenticated user sees the secret box UI', async ({ page }) => {
    // skip: Supabase local is not running in the current environment.
    // Remove this skip when supabase start + seed have been applied.
    test.skip(process.env.E2E_SUPABASE !== '1', 'Set E2E_SUPABASE=1 with Supabase local + seed running to exercise authenticated flows')

    await devLogin(page)
    await page.goto('/secret-box')

    // The modal title from SecretBoxModal (Figma copy)
    await expect(
      page.getByText('KHÁM PHÁ SECRET BOX CỦA BẠN'),
    ).toBeVisible()

    // The counter label
    await expect(page.getByText('Secretbox chưa mở')).toBeVisible()
  })
})
