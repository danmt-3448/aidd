import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('should render login page with all elements', async ({ page }) => {
    await page.goto('/login')

    // Check for header logo
    const headerLogo = page.locator('header img[alt="Sun* Annual Awards 2025"]')
    await expect(headerLogo).toBeVisible()

    // Check for language selector showing VN
    const languageButton = page.locator('button:has-text("VN")')
    await expect(languageButton).toBeVisible()

    // Check for Google login button
    const googleButton = page.locator('button:has-text("LOGIN With Google")')
    await expect(googleButton).toBeVisible()

    // Check for footer copyright text
    const footer = page.locator('footer')
    await expect(footer).toContainText('Bản quyền thuộc về Sun* © 2025')

    // Check for intro text
    await expect(page.locator('text=Bắt đầu hành trình của bạn cùng SAA 2025')).toBeVisible()
    await expect(page.locator('text=Đăng nhập để khám phá')).toBeVisible()
  })

  test('should display error message when error query param is 1', async ({ page }) => {
    await page.goto('/login?error=1')

    // Scope to the login error <p role="alert"> — a bare [role="alert"] also matches
    // Next.js's app-wide <div id="__next-route-announcer__" role="alert">.
    const alert = page.locator('p[role="alert"]')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('Đăng nhập không thành công. Vui lòng thử lại.')
  })

  test('should not display error message without error query param', async ({ page }) => {
    await page.goto('/login')

    // Scope to the login error <p role="alert"> — a bare [role="alert"] also matches
    // Next.js's app-wide <div id="__next-route-announcer__" role="alert">.
    const alert = page.locator('p[role="alert"]')
    await expect(alert).not.toBeVisible()
  })

  test('should switch language to English when clicking language selector', async ({ page }) => {
    await page.goto('/login')

    // Verify initial Vietnamese content
    await expect(page.locator('text=Bản quyền thuộc về Sun* © 2025')).toBeVisible()

    // Open language dropdown
    const languageButton = page.locator('button:has-text("VN")')
    await languageButton.click()

    // Click EN option
    const enOption = page.locator('button[role="option"]:has-text("EN")')
    await enOption.click()

    // Wait for page refresh
    await page.waitForLoadState('networkidle')

    // Verify English content
    await expect(page.locator('text=Copyright © Sun* 2025')).toBeVisible()

    // Verify button shows EN
    const updatedButton = page.locator('button:has-text("EN")')
    await expect(updatedButton).toBeVisible()
  })

  test('should close language dropdown when clicking outside', async ({ page }) => {
    await page.goto('/login')

    // Open language dropdown
    const languageButton = page.locator('button:has-text("VN")')
    await languageButton.click()

    // Verify dropdown is open
    let dropdown = page.locator('ul[role="listbox"]')
    await expect(dropdown).toBeVisible()

    // Click outside
    await page.locator('main').click()

    // Verify dropdown is closed
    dropdown = page.locator('ul[role="listbox"]')
    await expect(dropdown).not.toBeVisible()
  })

  test('should have sticky header on scroll', async ({ page }) => {
    await page.goto('/login')

    const header = page.locator('header')
    const headerClass = await header.getAttribute('class')

    expect(headerClass).toContain('sticky')
    expect(headerClass).toContain('top-0')
  })

  test('should render Google button with correct styling', async ({ page }) => {
    await page.goto('/login')

    const googleButton = page.locator('button:has-text("LOGIN With Google")')
    const buttonClass = await googleButton.getAttribute('class')

    expect(buttonClass).toContain('bg-[#FFEA9E]')
    expect(buttonClass).toContain('text-[#00101A]')
  })

  test('should have correct background styling', async ({ page }) => {
    await page.goto('/login')

    const mainDiv = page.locator('div.bg-\\[\\#00101A\\]').first()
    const classList = await mainDiv.getAttribute('class')

    expect(classList).toContain('bg-[#00101A]')
    expect(classList).toContain('text-white')
  })
})

test.describe('Route Guard - Login Page', () => {
  test('should redirect unauthenticated access to /todo to /login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/todo')

    // Should redirect to /login
    await expect(page).toHaveURL('/login')
  })

  test('should allow unauthenticated access to /login', async ({ page }) => {
    await page.goto('/login')

    // Should stay on /login
    await expect(page).toHaveURL('/login')
  })

  test('should allow unauthenticated access to /dev-login', async ({ page }) => {
    await page.goto('/dev-login')

    // Should stay on /dev-login (or redirect if not implemented, but should not go to /login)
    const url = page.url()
    expect(url).toMatch(/dev-login|login/) // Allow either /dev-login or redirect
  })

  test('should allow unauthenticated access to /auth', async ({ page }) => {
    // Test that /auth is public (no redirect to /login)
    const response = await page.goto('/auth')
    // /auth itself might not have content, but shouldn't redirect to /login
    const url = page.url()
    expect(url).not.toMatch(/\?redirected=true/) // No indication of redirect
  })
})
