/**
 * Admin session smoke — admin project (e2e/.auth/admin.json, is_admin=true).
 *
 * Gap-fill for the AIDD Readiness Hardening plan (P3): the `admin` Playwright
 * project matched `admin-*.spec.ts` but had ZERO spec files, so it ran nothing and
 * gave false confidence. This first admin spec exercises the admin storageState and
 * asserts admin-only UI a regular user never sees.
 *
 * There is no /admin route yet, so we assert the admin-only entry point instead:
 * the "Admin Dashboard" link (href="/admin") rendered in the account menu only when
 * isAdmin is true (src/components/site-account-menu.tsx).
 *
 * Setup: admin project (e2e/.auth/admin.json). Event forced LIVE.
 */

import { test, expect } from '@playwright/test'
import { setEventStart, pastEventDate } from './support/event-config'

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await setEventStart(pastEventDate(1))
})

test.describe('Admin — session smoke', () => {
  test.setTimeout(60_000)

  test('admin sees the Admin Dashboard link in the account menu', async ({ page }) => {
    await page.goto('/board')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/board/)

    // Open the account menu (aria-label "Account menu for <name>").
    await page.getByRole('button', { name: /Account menu/i }).first().click()

    // Admin-only entry — a regular user would not render this. Note: the link carries
    // an explicit role="menuitem", so it is exposed as a menuitem, not a link.
    const adminLink = page.getByRole('menuitem', { name: /Admin Dashboard/i })
    await expect(adminLink).toBeVisible()
    await expect(adminLink).toHaveAttribute('href', '/admin')
  })
})
