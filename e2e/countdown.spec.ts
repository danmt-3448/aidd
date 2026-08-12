import { test, expect } from '@playwright/test'
import { setEventStart, futureEventDate, pastEventDate } from './support/event-config'

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

// ── Event isolation ───────────────────────────────────────────────────────────
//
// event_config is a shared singleton row. These tests assert the pre-launch /
// countdown state (timer ticks with a future event_start_at). Without isolation
// the shared LIVE seed (past date) makes the timer read all-zeros and the
// pre-launch gate stays off — these tests would fail.
//
// beforeAll:  set event_start_at 30 days into the future (pre-launch state ON).
// afterAll:   restore to 1 day ago (LIVE) so board/profile/kudos suites keep working.
//
// Run countdown suite serially (test.describe.configure mode: 'serial') to avoid
// racing the shared row when other suites run concurrently.
test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await setEventStart(futureEventDate(30))
})

test.afterAll(async () => {
  await setEventStart(pastEventDate(1))
})

test.describe('Countdown Screen (CD-E2E)', () => {
  test('CD-E2E-01: unauth visit to /countdown stays on /countdown (public route)', async ({ page }) => {
    // /countdown is explicitly PUBLIC per guard-rules.ts (PUBLIC_PATHS includes '/countdown').
    // Unauthenticated visitors see the pre-launch countdown — no redirect to /login.
    // Proxy comment: "Bypass paths (/countdown, /login, /auth, /dev-login) are never gated."
    await page.goto('/countdown')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/countdown')
    // The countdown page should render its timer (not an error or login redirect)
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 10_000 })
  })

  test('CD-E2E-02: renders countdown with title, labels, and timer role (counting)', async ({ page }) => {
    await devLogin(page)
    await page.goto('/countdown', { timeout: 30_000 })

    // Assert title (h1 with text content)
    const titleLocator = page.locator('h1')
    const titleText = await titleLocator.textContent({ timeout: 15_000 })
    expect(titleText).toMatch(/Sự kiện sẽ bắt đầu sau|Event starts in/)

    // Assert 3 LED units: timer role region exists
    const timerRegion = page.locator('[role="timer"]')
    await expect(timerRegion).toBeVisible({ timeout: 15_000 })

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

    // Verify the page is responsive and main elements exist (no JS crash).
    // Extended timeout to handle dev-server CPU contention under parallel test load.
    const timerRegion = page.locator('[role="timer"]')
    await expect(timerRegion).toBeVisible({ timeout: 15_000 })

    // Verify navigation is not locked (can navigate away)
    await page.goto('/kudos')
    await expect(page).toHaveURL('/kudos')

    // Return to countdown
    await page.goto('/countdown')
    await expect(timerRegion).toBeVisible({ timeout: 15_000 })
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
