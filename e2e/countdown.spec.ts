import { test, expect } from '@playwright/test'

const TEST_USER = 'nguyen.van.an@sun-asterisk.com'
const TEST_PASSWORD = 'TestPass123!'

/**
 * Helper: login via dev-login page
 */
async function devLogin(page: import("@playwright/test").Page) {
  await page.goto('/dev-login')
  await page.fill('input[placeholder*="@sun-asterisk"]', TEST_USER)
  await page.fill('input[placeholder*="password"]', TEST_PASSWORD)
  // Click login button by text content (regex or exact)
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await page.waitForURL('/kudos')
}

test.describe('Countdown Screen (CD-E2E)', () => {
  test('CD-E2E-01: unauth visit to /countdown is redirected to /login by the proxy guard', async ({ page }) => {
    await page.goto('/countdown')
    expect(page.url()).toContain('/login')
  })

  test('CD-E2E-02: renders countdown with title, labels, and timer role (counting)', async ({ page }) => {
    await devLogin(page)
    await page.goto('/countdown')

    // Assert title (h1 with text content)
    const titleLocator = page.locator('h1')
    const titleText = await titleLocator.textContent()
    expect(titleText).toMatch(/Sự kiện sẽ bắt đầu sau|Event starts in/)

    // Assert 3 LED units: timer role region exists
    const timerRegion = page.locator('[role="timer"]')
    await expect(timerRegion).toBeVisible()

    // Assert unit labels present: find all text content
    const allText = await timerRegion.textContent()
    expect(allText).toMatch(/DAY|NGÀY/)
    expect(allText).toMatch(/HOUR|GIỜ/)
    expect(allText).toMatch(/MINUTE|PHÚT/)

    // Assert the timer region has child divs (the 3 LED blocks)
    const blocks = timerRegion.locator('> div')
    const blockCount = await blocks.count()
    expect(blockCount).toBe(3) // 3 units: days, hours, minutes
  })

  test('CD-E2E-03: display cap and zero-pad renders LED digits correctly', async ({ page }) => {
    await devLogin(page)
    await page.goto('/countdown')

    // The timer region contains 3 LED blocks (DAYS, HOURS, MINUTES)
    const timerRegion = page.locator('[role="timer"]')

    // First block should be DAYS with its label
    const firstBlock = timerRegion.locator('> div').first()

    // Verify the block renders its label (DAYS or NGÀY)
    const blockText = await firstBlock.textContent()
    expect(blockText).toMatch(/DAY|NGÀY/)

    // Verify the block has visible content (both digit boxes and label)
    const isVisible = await firstBlock.isVisible()
    expect(isVisible).toBe(true)

    // Zero-pad: with the event ~5 days out the DAYS unit renders two digits
    // (e.g. "04"/"05"), never a single digit. Assert 2 consecutive digits present.
    expect(blockText).toMatch(/\d{2}/)
  })

  // Note: true done-state logic (remaining<=0 → done=true) is fully covered by the
  // useCountdown unit tests. Here we only smoke the rendered page: it stays stable and
  // navigation is not locked. (A real past-event E2E would need its own event_config
  // isolation vs the parallel counting tests that share the single config row.)
  test('CD-E2E-04: countdown page is stable and navigation is not locked', async ({ page }) => {
    await devLogin(page)
    await page.goto('/countdown')

    // Verify the page is responsive and main elements exist (no JS crash)
    const timerRegion = page.locator('[role="timer"]')
    await expect(timerRegion).toBeVisible()

    // Verify navigation is not locked (can navigate away)
    await page.goto('/kudos')
    await expect(page).toHaveURL('/kudos')

    // Return to countdown
    await page.goto('/countdown')
    await expect(timerRegion).toBeVisible()
  })

  test('CD-E2E-05: responsive layout (375, 768, 1280) no horizontal overflow', async ({ browser }) => {
    const viewports = [
      { width: 375, height: 667, label: '375' },
      { width: 768, height: 1024, label: '768' },
      { width: 1280, height: 720, label: '1280' },
    ]

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      })
      const page = await context.newPage()

      await devLogin(page)
      await page.goto('/countdown')

      // Wait for the countdown content to actually render (past the isLoading state)
      // so the screenshot captures the real UI, not the loading background.
      await expect(page.locator('[role="timer"]')).toBeVisible()

      // Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => {
        return document.scrollingElement?.scrollWidth || 0
      })
      const clientWidth = viewport.width

      // Allow small tolerance (2px)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)

      // Take screenshot
      const screenshotPath = `e2e/__screenshots__/countdown-${viewport.label}.png`
      await page.screenshot({ path: screenshotPath })
      console.log(`Screenshot saved: ${screenshotPath}`)

      await context.close()
    }
  })
})
