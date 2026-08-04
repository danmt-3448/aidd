import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup: authenticate test users and save their session state.
 * This runs once before all tests in the worker process.
 *
 * Saves storageState for:
 * - Regular user: e2e/.auth/user.json (authenticated, non-admin)
 * - Admin user: e2e/.auth/admin.json (authenticated, is_admin=true)
 *
 * IMPORTANT: Use localhost (not 127.0.0.1) to ensure cookies match the domain
 * that Playwright config uses for baseURL.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = 'http://localhost:3000'

  // Create auth dir
  await import('fs').then((fs) =>
    fs.promises.mkdir('e2e/.auth', { recursive: true }),
  )

  // Regular user credentials
  const regularUserEmail = 'tran.thi.binh@sun-asterisk.com'
  const adminEmail = 'nguyen.van.an@sun-asterisk.com'
  const password = 'TestPass123!'

  // === Authenticate regular user ===
  const userBrowser = await chromium.launch()
  const userContext = await userBrowser.newContext()
  const userPage = await userContext.newPage()

  await authenticateUser(userPage, baseURL, regularUserEmail, password)
  await userContext.storageState({ path: 'e2e/.auth/user.json' })
  await userBrowser.close()

  // === Authenticate admin user ===
  const adminBrowser = await chromium.launch()
  const adminContext = await adminBrowser.newContext()
  const adminPage = await adminContext.newPage()

  await authenticateUser(adminPage, baseURL, adminEmail, password)
  await adminContext.storageState({ path: 'e2e/.auth/admin.json' })
  await adminBrowser.close()

  console.log('Global setup: authenticated regular user and admin user')
}

/**
 * Log in via /dev-login route (test-only, no Google OAuth needed).
 * Polls for session establishment, ensuring the login is complete before returning.
 */
async function authenticateUser(
  page: Awaited<ReturnType<typeof chromium.launch>>['newPage'],
  baseURL: string,
  email: string,
  password: string,
) {
  await page.goto(`${baseURL}/dev-login`)

  // Fill email and password (password already pre-filled in the form)
  const emailInput = page.locator('input[placeholder*="you@"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button:has-text("Đăng nhập")')

  await emailInput.fill(email)
  // Password field already has TestPass123! as default
  // await passwordInput.fill(password)
  await submitButton.click()

  // Wait for redirect to /kudos (or another protected route) to confirm session
  await page.waitForURL(/^.*\/(kudos|board|profile|awards).*$/, { timeout: 10000 })

  // Extra safety: wait for network idle
  await page.waitForLoadState('networkidle')
}

export default globalSetup
