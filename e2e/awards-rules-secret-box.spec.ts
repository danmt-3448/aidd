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
 *
 * Secret Box DB setup:
 *   Tests that mutate secret_box rows use psql via execSync to set up and
 *   tear down state so reruns are stable.  The test user UUID is derived from
 *   the storageState JWT (11111111-0000-0000-0000-000000000002).
 */

import { execSync } from 'child_process'
import { test, expect } from '@playwright/test'

// The /secret-box tests mutate a shared secret_box row (unopened_box_count) via
// psql in beforeAll/beforeEach. Under fullyParallel these describe blocks race on
// the same row (a count set by one block bleeds into another's assertion). Run the
// whole file serially — same guard the homepage/countdown specs use — so each
// scenario's DB setup is the value its assertion reads.
test.describe.configure({ mode: 'serial' })

// ── DB helpers ────────────────────────────────────────────────────────────────

const TEST_USER_ID = '11111111-0000-0000-0000-000000000002'

function psql(sql: string): void {
  execSync(
    `PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "${sql.replace(/"/g, '\\"')}"`,
    { stdio: 'pipe' },
  )
}

/**
 * Locates the "Secretbox chưa mở" counter span on the /secret-box page.
 * SecretBoxModal renders: <span>Secretbox chưa mở</span><span aria-live="polite">{count}</span>
 * We scope the aria-live span inside the secret-box dialog card to avoid matching
 * the Sonner notification region which also carries aria-live="polite".
 */
import type { Page } from '@playwright/test'
function secretBoxCounter(page: Page) {
  // The card is inside a div[data-testid="secret-box-backdrop"] (from page.tsx)
  return page
    .locator('[data-testid="secret-box-backdrop"]')
    .locator('span[aria-live="polite"]')
}

// ── /awards ──────────────────────────────────────────────────────────────────

test.describe('/awards — unauthenticated', () => {
  // Override the project-level storageState for this describe block.
  // This makes the browser start with no session, so the proxy guard redirects.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('TC-AWARDS-01: unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})

test.describe('/awards — authenticated', () => {
  test('TC-AWARDS-02: authenticated user sees all 6 award titles', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')

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
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})

test.describe('/rules — authenticated', () => {
  test('TC-RULES-02: authenticated user sees rules headings and Viết KUDOS button', async ({ page }) => {
    await page.goto('/rules')
    await page.waitForLoadState('domcontentloaded')

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
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL('/login', { timeout: 5_000 })
  })
})

test.describe('/secret-box — authenticated', () => {
  test('TC-SECRETBOX-02: authenticated user sees the secret box UI', async ({ page }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('domcontentloaded')

    // The modal title from SecretBoxModal (Figma copy)
    await expect(
      page.getByText('KHÁM PHÁ SECRET BOX CỦA BẠN'),
    ).toBeVisible({ timeout: 10_000 })

    // The counter label
    await expect(page.getByText('Secretbox chưa mở')).toBeVisible({ timeout: 10_000 })
  })
})

// ── /awards — additional authenticated TCs ────────────────────────────────────

test.describe('/awards — nav and content', () => {
  // Playwright Desktop Chrome viewport is 1280×720 by default which is ≥ lg (1024px),
  // so the sticky AwardsNav is visible (hidden below lg via Tailwind).

  test('TC-AWARDS-ID5: nav menu shows all 6 items in order', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')

    const nav = page.getByRole('navigation', { name: 'Danh mục giải thưởng' })
    await expect(nav).toBeVisible({ timeout: 10_000 })

    // Collect all links inside the nav and verify order.
    const links = nav.getByRole('link')
    await expect(links).toHaveCount(6, { timeout: 10_000 })

    const expectedOrder = [
      'Top Talent',
      'Top Project',
      'Top Project\nLeader',
      'Best Manager',
      'Signature 2025\nCreator',
      'MVP',
    ]

    for (let i = 0; i < expectedOrder.length; i++) {
      // Each link label may be multiline; use getByText to match the visible text portion.
      const labelText = expectedOrder[i].split('\n')[0] // first line is always unique enough
      await expect(links.nth(i)).toContainText(labelText, { timeout: 5_000 })
    }
  })

  test('TC-AWARDS-ID6: all 6 award info blocks render with title and prize info', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')

    // Each AwardCard renders an h2 with the award title.
    const expectedTitles = [
      'Top Talent',
      'Top Project',
      'Top Project Leader',
      'Best Manager',
      'Signature 2025 Creator',
      'MVP',
    ]
    for (const title of expectedTitles) {
      await expect(page.getByRole('heading', { name: title, level: 2 }).first()).toBeVisible({
        timeout: 10_000,
      })
    }

    // Each card also renders "Giá trị giải thưởng:" — assert at least 6 occurrences.
    const prizeLabels = page.getByText('Giá trị giải thưởng:')
    await expect(prizeLabels).toHaveCount(6, { timeout: 10_000 })
  })

  test('TC-AWARDS-ID8: Sun* Kudos banner is present with title and Chi tiết CTA', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')

    // KudosPromo renders <h2> "Sun* Kudos" inside a <section aria-label="Sun* Kudos — phong trào ghi nhận">
    // and an <a aria-label="Khám phá Sun* Kudos ngay"> with text "Chi tiết".
    const kudosBanner = page.locator('section[aria-label="Sun* Kudos — phong trào ghi nhận"]')
    // Scroll the banner into view — it's below the fold on the default viewport.
    await kudosBanner.scrollIntoViewIfNeeded()
    await expect(page.getByRole('heading', { name: 'Sun* Kudos', level: 2 })).toBeVisible({
      timeout: 10_000,
    })
    // The CTA link is inside the banner — match by aria-label.
    await expect(
      page.getByRole('link', { name: /khám phá sun\* kudos ngay/i }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('TC-AWARDS-ID9-ID11: clicking a nav item scrolls to its section and marks it active', async ({
    page,
  }) => {
    // Use a larger viewport to ensure sticky nav is definitely visible.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')

    const nav = page.getByRole('navigation', { name: 'Danh mục giải thưởng' })
    await expect(nav).toBeVisible({ timeout: 10_000 })

    // Click the "MVP" nav link (last item).
    const mvpLink = nav.getByRole('link').filter({ hasText: 'MVP' })
    await mvpLink.click()

    // After click the URL hash should contain the anchor.
    await expect(page).toHaveURL(/#mvp/, { timeout: 5_000 })

    // The MVP section should be in view — the anchor element id="mvp" should exist.
    const mvpSection = page.locator('#mvp')
    await expect(mvpSection).toBeVisible({ timeout: 5_000 })

    // Active state: AwardNavItem applies borderBottom + yellow color when isActive.
    // The IntersectionObserver may need a moment to fire; wait for the active border.
    // We assert the MVP link acquires the active style (inline border-bottom set by isActive).
    await expect(mvpLink).toHaveCSS('border-bottom-color', 'rgb(255, 234, 158)', { timeout: 5_000 })
  })

  test('TC-AWARDS-ID12: Chi tiết link in Kudos banner is present', async ({ page }) => {
    await page.goto('/awards')
    await page.waitForLoadState('domcontentloaded')

    // kudos-promo.tsx implements the CTA as <a href="#" aria-label="Khám phá Sun* Kudos ngay">.
    // The href is "#" (stub — wired to /board in a future integration step).
    // Assert the link is visible and clicking it stays on /awards (no navigation away).
    const kudosBanner = page.locator('section[aria-label="Sun* Kudos — phong trào ghi nhận"]')
    await kudosBanner.scrollIntoViewIfNeeded()
    const ctaLink = page.getByRole('link', { name: /khám phá sun\* kudos ngay/i })
    await expect(ctaLink).toBeVisible({ timeout: 10_000 })
    await ctaLink.click()
    await expect(page).toHaveURL(/\/awards/, { timeout: 3_000 })
  })
})

// ── /rules — additional authenticated TCs ────────────────────────────────────

test.describe('/rules — panel content and close', () => {
  test('GUI_001: rules panel renders title, body, 6 badge images, Đóng and Viết KUDOS buttons', async ({
    page,
  }) => {
    await page.goto('/rules')
    await page.waitForLoadState('domcontentloaded')

    // The rules panel has role="dialog" with aria-label="Thể lệ SAA 2025"
    const panel = page.getByRole('dialog', { name: 'Thể lệ SAA 2025' })
    await expect(panel).toBeVisible({ timeout: 10_000 })

    // Panel title rendered by RulesPanelHeader
    await expect(panel.getByText('Thể lệ')).toBeVisible({ timeout: 5_000 })

    // Both section headings (mô tả / recipient + sender)
    await expect(
      panel.getByText('NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC'),
    ).toBeVisible({ timeout: 5_000 })
    await expect(
      panel.getByText('NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN'),
    ).toBeVisible({ timeout: 5_000 })

    // 6 secret badge images — SecretBadgeGrid renders 6 <img> elements with alt text
    const badgeAlts = [
      'Badge REVIVAL',
      'Badge TOUCH OF LIGHT',
      'Badge STAY GOLD',
      'Badge FLOW TO HORIZON',
      'Badge BEYOND THE BOUNDARY',
      'Badge ROOT FURTHER',
    ]
    for (const alt of badgeAlts) {
      await expect(panel.getByAltText(alt)).toBeVisible({ timeout: 5_000 })
    }

    // Footer action bar buttons
    await expect(page.getByRole('button', { name: /đóng thể lệ/i })).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByRole('button', { name: /viết kudos/i })).toBeVisible({
      timeout: 5_000,
    })
  })

  test('FUN_003: clicking Đóng closes the rules panel', async ({ page }) => {
    // Navigate directly to /board first so router.back() has a destination.
    await page.goto('/board')
    await page.waitForLoadState('domcontentloaded')
    await page.goto('/rules')
    await page.waitForLoadState('domcontentloaded')

    const panel = page.getByRole('dialog', { name: 'Thể lệ SAA 2025' })
    await expect(panel).toBeVisible({ timeout: 10_000 })

    // Click the "Đóng" (close) button — aria-label="Đóng thể lệ"
    await page.getByRole('button', { name: /đóng thể lệ/i }).click()

    // onClose = router.back() → goes back to /board (previous page in history).
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
  })
})

// ── /secret-box — additional authenticated TCs ────────────────────────────────

test.describe('/secret-box — counter display (ce44f5/96fb45)', () => {
  test.beforeAll(() => {
    // Set a known count (3) for the test user so we can assert the rendered value.
    // UPSERT to handle both fresh and re-run states.
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 3)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 3, updated_at = now();`,
    )
  })

  test.afterAll(() => {
    // Restore original seeded count (5) so other tests are unaffected.
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 5)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 5, updated_at = now();`,
    )
  })

  test('ce44f5/96fb45: counter displays the backend unopened_box_count', async ({ page }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('domcontentloaded')

    // counterDisplay = String(unopened).padStart(2, '0') → "03"
    // Scoped to the secret-box backdrop to avoid matching Sonner's aria-live region.
    const counter = secretBoxCounter(page)
    await expect(counter).toBeVisible({ timeout: 10_000 })
    await expect(counter).toHaveText('03', { timeout: 10_000 })
  })
})

test.describe('/secret-box — open box when count > 0 (7c3c)', () => {
  test.beforeEach(() => {
    // Ensure the user has exactly 1 unopened box and no prior badges.
    psql(`DELETE FROM secret_box_badges WHERE user_id = '${TEST_USER_ID}';`)
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 1)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 1, updated_at = now();`,
    )
  })

  test.afterEach(() => {
    // Clean up badges inserted by the RPC; restore count to 5 for other tests.
    psql(`DELETE FROM secret_box_badges WHERE user_id = '${TEST_USER_ID}';`)
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 5)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 5, updated_at = now();`,
    )
  })

  test('7c3c: clicking the box when unopened > 0 assigns a badge and decrements counter', async ({
    page,
  }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('domcontentloaded')

    // Confirm initial counter shows "01"
    const counter = secretBoxCounter(page)
    await expect(counter).toHaveText('01', { timeout: 10_000 })

    // Guidance text "Click vào box để mở" is only visible when unopened > 0
    await expect(page.getByText('Click vào box để mở')).toBeVisible({ timeout: 5_000 })

    // Click the box button
    const boxBtn = page.getByRole('button', { name: /open secret box/i })
    await expect(boxBtn).toBeEnabled({ timeout: 5_000 })
    await boxBtn.click()

    // After the RPC succeeds the counter should decrement: 01 → 00.
    // The mutation uses optimistic update so the count updates without a full refetch.
    await expect(counter).toHaveText('00', { timeout: 15_000 })

    // Guidance text disappears when count reaches 0
    await expect(page.getByText('Click vào box để mở')).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe('/secret-box — box disabled when count = 0 (2a8a)', () => {
  test.beforeEach(() => {
    psql(`DELETE FROM secret_box_badges WHERE user_id = '${TEST_USER_ID}';`)
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 0)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 0, updated_at = now();`,
    )
  })

  test.afterEach(() => {
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 5)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 5, updated_at = now();`,
    )
  })

  test('2a8a: when unopened_box_count = 0 the box button is disabled and counter stays 0', async ({
    page,
  }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('domcontentloaded')

    // Counter should show "00"
    const counter = secretBoxCounter(page)
    await expect(counter).toHaveText('00', { timeout: 10_000 })

    // The box button is disabled (isDisabled = unopened === 0)
    const boxBtn = page.getByRole('button', { name: /open secret box/i })
    await expect(boxBtn).toBeDisabled({ timeout: 5_000 })

    // Guidance text "Click vào box để mở" is NOT shown when count is 0
    await expect(page.getByText('Click vào box để mở')).not.toBeVisible({ timeout: 5_000 })

    // Dispatch a click event directly on the disabled button to verify no side effect.
    await boxBtn.dispatchEvent('click')
    // Counter must still be "00" — the guarded open() no-ops when unopened === 0.
    await expect(counter).toHaveText('00', { timeout: 5_000 })
  })
})

test.describe('/secret-box — close button navigates to /board (982a)', () => {
  test.beforeAll(() => {
    psql(
      `INSERT INTO secret_box (user_id, unopened_box_count) VALUES ('${TEST_USER_ID}', 5)
       ON CONFLICT (user_id) DO UPDATE SET unopened_box_count = 5, updated_at = now();`,
    )
  })

  test('982a: clicking the X (Close) button navigates to /board', async ({ page }) => {
    await page.goto('/secret-box')
    await page.waitForLoadState('domcontentloaded')

    // SecretBoxModal renders a button aria-label="Close" for the X icon
    const closeBtn = page.getByRole('button', { name: /^close$/i })
    await expect(closeBtn).toBeVisible({ timeout: 10_000 })
    await closeBtn.click()

    // handleClose in SecretBoxConnected calls router.push('/board')
    await expect(page).toHaveURL(/\/board/, { timeout: 8_000 })
  })
})
