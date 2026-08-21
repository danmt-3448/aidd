/**
 * /notifications ("Tất cả thông báo") smoke — authed session, real seeded data.
 *
 * Gap-fill for the AIDD Readiness Hardening plan (P3): the /notifications route
 * had no e2e coverage. Scope is a smoke check — the auth-guarded page renders,
 * the heading is present, and the content resolves (list OR empty-state), with no
 * redirect to /login or /countdown.
 *
 * Setup: authed project (e2e/.auth/user.json). Event forced LIVE so the pre-launch
 * gate does not bounce authed users to /countdown.
 */

import { test, expect } from '@playwright/test'
import { setEventStart, pastEventDate } from './support/event-config'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await setEventStart(pastEventDate(1))
})

test.describe('Notifications — authed', () => {
  test.setTimeout(60_000)

  test('renders the notifications page under auth with its heading', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('domcontentloaded')

    // Auth-guarded route must NOT bounce to /login or the pre-launch /countdown gate.
    await expect(page).toHaveURL(/\/notifications/)

    // Heading present — data-fig selector is i18n-independent (VN/EN both pass).
    await expect(page.locator('h1[data-fig="589:9132-heading"]')).toBeVisible()

    // Content resolves to either the list or the empty-state (no infinite skeleton).
    await page.waitForLoadState('networkidle')
    const list = page.getByRole('list')
    const emptyState = page.getByText('Chưa có thông báo nào')
    await expect(list.or(emptyState).first()).toBeVisible()
  })
})
