import { chromium, type Page } from '@playwright/test'
import * as fs from 'fs/promises'

/**
 * Global setup: authenticate test users and save their session state.
 * Runs once before all tests.
 *
 * Produces:
 *   e2e/.auth/user.json  — regular user (tran.thi.binh@)
 *   e2e/.auth/admin.json — admin user  (nguyen.van.an@, is_admin=true)
 *
 * Cookie note: storageState is captured from the BrowserContext after a real
 * browser login flow through /dev-login. The SSR auth cookie (sb-127-auth-token)
 * is set by the Next.js server on the response and lands in the context's
 * cookie jar with domain=localhost. Capturing from context (not page) ensures
 * httpOnly cookies are included in the saved state.
 */
async function globalSetup() {
  const baseURL = 'http://localhost:3001'
  const authDir = 'e2e/.auth'

  await fs.mkdir(authDir, { recursive: true })

  const regularUserEmail = 'tran.thi.binh@sun-asterisk.com'
  const adminEmail = 'nguyen.van.an@sun-asterisk.com'
  const password = 'TestPass123!'

  // Authenticate regular user
  {
    const browser = await chromium.launch()
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await authenticateUser(page, regularUserEmail, password)
    await context.storageState({ path: `${authDir}/user.json` })
    await browser.close()
  }

  // Authenticate admin user
  {
    const browser = await chromium.launch()
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()
    await authenticateUser(page, adminEmail, password)
    await context.storageState({ path: `${authDir}/admin.json` })
    await browser.close()
  }

  console.log('[global-setup] storageState saved: user.json + admin.json')
}

/**
 * Log in via /dev-login and wait for redirect to /kudos.
 * Fills both email and password explicitly — does not rely on pre-filled defaults.
 */
async function authenticateUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/dev-login')

  await page.locator('input[placeholder*="you@"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button:has-text("Đăng nhập")').click()

  // Wait for post-login redirect to confirm session established
  await page.waitForURL(/\/(kudos|board|profile|awards)/, { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
}

export default globalSetup
