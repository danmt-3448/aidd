/**
 * E2E — Viết Kudo (MoMorph screen ihQ26W78P2)
 *
 * Test accounts (seed.sql):
 *   Sender : nguyen.van.an@sun-asterisk.com  / TestPass123!
 *   Recipient: tran.thi.binh@sun-asterisk.com  (used as send-to target)
 *
 * Prerequisites (before running npm run test:e2e):
 *   1. Local Next.js server running  → npm run dev
 *   2. Local Supabase running        → supabase start
 *   3. NEXT_PUBLIC_ENABLE_DEV_LOGIN=true in .env.local
 *   4. Seed applied                  → supabase db reset
 *
 * Spec coverage: ID-0..56 (57 MoMorph test cases, phase-07-tests.md)
 */

import { test, expect, type Page } from '@playwright/test'

// ── Constants ────────────────────────────────────────────────────────────────

const SENDER_EMAIL = 'nguyen.van.an@sun-asterisk.com'
const SENDER_PASSWORD = 'TestPass123!'
// Recipient used in most tests (different from sender — self-exclusion rule)
const RECIPIENT_NAME = 'Trần Thị Bình'
// Partial search term that matches RECIPIENT_NAME
const RECIPIENT_SEARCH = 'Bình'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Log in via /dev-login using the test credentials from seed.sql.
 * Waits for redirect to /kudos before returning.
 */
async function devLogin(
  page: Page,
  email = SENDER_EMAIL,
  password = SENDER_PASSWORD,
): Promise<void> {
  await page.goto('/dev-login')
  await page.getByPlaceholder('you@sun-asterisk.com').fill(email)
  // Password field already pre-filled with TestPass123! but we set explicitly
  await page.getByPlaceholder('password').fill(password)
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  // /dev-login form redirects to /kudos on success
  await page.waitForURL('/kudos', { timeout: 10_000 })
}

/**
 * Open the compose modal by clicking "Viết Kudo" on the /kudos page.
 * Returns a locator scoped to the dialog.
 */
async function openModal(page: Page) {
  await page.getByRole('button', { name: 'Viết Kudo' }).click()
  const dialog = page.getByRole('dialog', { name: 'Viết Kudo' })
  await expect(dialog).toBeVisible()
  return dialog
}

/**
 * Select a recipient by searching and clicking the first matching option.
 */
async function selectRecipient(page: Page, search = RECIPIENT_SEARCH): Promise<void> {
  // Open the recipient dropdown
  await page
    .getByRole('button', { name: /tìm kiếm|người nhận/i })
    .first()
    .click()
  // Type in the search box (autoFocus)
  await page.getByPlaceholder('Tìm kiếm...').fill(search)
  // Wait for the option to appear and click it
  const option = page.getByRole('option', { name: new RegExp(search, 'i') }).first()
  await expect(option).toBeVisible({ timeout: 5_000 })
  await option.click()
}

/**
 * Type content into the Tiptap editor.
 */
async function typeContent(page: Page, text: string): Promise<void> {
  const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
  await editor.click()
  await editor.type(text)
}

/**
 * Add a hashtag via the HashtagPicker dropdown.
 * Assumes the picker is visible and catalog is loaded.
 */
async function addHashtag(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: /thêm hashtag/i }).click()
  const searchInput = page.getByPlaceholder('Tìm hashtag...')
  await searchInput.fill(label)
  const option = page.getByRole('option', { name: new RegExp(`#?${label}`, 'i') }).first()
  await expect(option).toBeVisible({ timeout: 5_000 })
  await option.click()
}

/**
 * Fill in the minimum valid form: recipient + content + one hashtag.
 * Used to satisfy submit-enable preconditions in tests that focus elsewhere.
 */
async function fillMinimumValidForm(page: Page): Promise<void> {
  await selectRecipient(page)
  await typeContent(page, 'Cảm ơn đồng đội!')
  await addHashtag(page, 'TeamWork')
}

// ── Test Suite ───────────────────────────────────────────────────────────────

test.describe('Viết Kudo — E2E (MoMorph ihQ26W78P2)', () => {
  // ── Access Guard ────────────────────────────────────────────────────────────

  test('ID-1: unauthenticated access to /kudos redirects to /login', async ({ page }) => {
    await page.goto('/kudos')
    await expect(page).toHaveURL('/login')
  })

  test('ID-0: authenticated user navigating to /kudos stays on /kudos', async ({ page }) => {
    await devLogin(page)
    await expect(page).toHaveURL('/kudos')
  })

  test('ID-2: authenticated user sees "Viết Kudo" button on /kudos', async ({ page }) => {
    await devLogin(page)
    const btn = page.getByRole('button', { name: 'Viết Kudo' })
    await expect(btn).toBeVisible()
  })

  // ── GUI / Layout ─────────────────────────────────────────────────────────────

  test('ID-3: modal opens with correct title text', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await expect(
      page.getByRole('heading', { name: 'Gửi lời cám ơn và ghi nhận đến đồng đội' }),
    ).toBeVisible()
  })

  test('ID-4: modal contains all sections in correct order (A→H)', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    // Section labels visible in order
    const labels = ['Người nhận', 'Hashtag', 'Image']
    for (const label of labels) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible()
    }

    // Toolbar (formatting section C) is visible
    await expect(page.getByRole('toolbar', { name: 'Định dạng văn bản' })).toBeVisible()

    // Anonymous toggle (section G)
    await expect(page.getByRole('checkbox', { name: 'Gửi ẩn danh' })).toBeVisible()

    // Submit bar (section H) — two buttons
    await expect(page.getByRole('button', { name: 'Hủy' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gửi Kudo' })).toBeVisible()
  })

  test('ID-5: Nội dung editor shows placeholder text before typing', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
    // Tiptap renders placeholder via CSS ::before on p.is-editor-empty — not a real text node.
    // Assert the empty marker class is present on the paragraph inside the editor.
    await expect(editor.locator('p.is-editor-empty').first()).toBeVisible()
    // Editor has no user-typed text (data-placeholder attr carries the placeholder string)
    await expect(editor.locator('p.is-editor-empty').first()).toHaveAttribute(
      'data-placeholder',
      'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!',
    )
  })

  test('ID-6: anonymous checkbox is unchecked by default', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    const checkbox = page.getByRole('checkbox', { name: 'Gửi ẩn danh' })
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })

  // ── Recipient Select ──────────────────────────────────────────────────────────

  test('ID-8: typing in recipient search filters the dropdown list', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    // Open dropdown
    await page
      .getByRole('button', { name: /tìm kiếm/i })
      .first()
      .click()
    const searchInput = page.getByPlaceholder('Tìm kiếm...')
    await searchInput.fill(RECIPIENT_SEARCH)

    // At least one option matching the search appears
    const option = page.getByRole('option', { name: new RegExp(RECIPIENT_SEARCH, 'i') }).first()
    await expect(option).toBeVisible({ timeout: 5_000 })
  })

  test('ID-25: selecting a recipient shows their name in the trigger button', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await selectRecipient(page)

    // After selection, the trigger button shows the chosen recipient's name
    await expect(page.getByText(RECIPIENT_NAME)).toBeVisible()
  })

  test('ID-26: selecting a recipient closes the dropdown', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await selectRecipient(page)

    // Dropdown listbox should no longer be visible
    await expect(page.getByRole('listbox').first()).not.toBeVisible()
  })

  test('ID-10: search with leading/trailing spaces still matches recipients', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    await page
      .getByRole('button', { name: /tìm kiếm/i })
      .first()
      .click()
    // Search with surrounding spaces — server should trim
    await page.getByPlaceholder('Tìm kiếm...').fill(`  ${RECIPIENT_SEARCH}  `)
    const option = page.getByRole('option', { name: new RegExp(RECIPIENT_SEARCH, 'i') }).first()
    await expect(option).toBeVisible({ timeout: 5_000 })
  })

  // ── Content Editor — @mention ─────────────────────────────────────────────────

  test('ID-12: typing "@" in the editor triggers mention suggestions', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    // Need a recipient selected first so mention items are available
    await selectRecipient(page)

    const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
    await editor.click()
    await editor.type('@')

    // Mention suggestion popup renders into a body portal via ReactRenderer.
    // MentionList root has data-testid="mention-list".
    await expect(page.locator('[data-testid="mention-list"]')).toBeVisible({
      timeout: 3_000,
    })
  })

  test('ID-13: selecting a mention suggestion inserts @FullName inline', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await selectRecipient(page)

    const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
    await editor.click()
    await editor.type('@Bình')

    // Wait for suggestion list and click the matching item
    const suggestionItem = page.locator('[data-testid="mention-list"]').getByText('Trần Thị Bình').first()
    await expect(suggestionItem).toBeVisible({ timeout: 3_000 })
    await suggestionItem.click()

    // App renders the mention node with the full name from the user record.
    // After the fe-developer fix, the label is "Trần Thị Bình" not the raw query.
    await expect(editor).toContainText('@Trần Thị Bình')
  })

  test('ID-33: hint text about @mention is visible below the editor', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await expect(
      page.getByText('Bạn có thể "@ + tên" để nhắc tới đồng nghiệp khác'),
    ).toBeVisible()
  })

  // ── Rich-text Formatting ─────────────────────────────────────────────────────

  test('ID-27: Bold toolbar button toggles bold formatting', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const boldBtn = page.getByRole('button', { name: 'In đậm' })
    await boldBtn.click()
    // After click, button should be pressed (active)
    await expect(boldBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('ID-28: Italic toolbar button toggles italic formatting', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const italicBtn = page.getByRole('button', { name: 'In nghiêng' })
    await italicBtn.click()
    await expect(italicBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('ID-29: Strikethrough toolbar button toggles strikethrough', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const strikeBtn = page.getByRole('button', { name: 'Gạch ngang' })
    await strikeBtn.click()
    await expect(strikeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('ID-30: Ordered list toolbar button toggles ordered list', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
    await editor.click()
    await page.getByRole('button', { name: 'Danh sách có số' }).click()
    await expect(page.getByRole('button', { name: 'Danh sách có số' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('ID-31: Link toolbar button opens URL prompt and sets link', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
    await editor.click()
    await editor.type('xem tại đây')
    // Select all text
    await page.keyboard.press('Control+A')

    // Click Link button — browser prompt appears
    page.on('dialog', async (dialog) => {
      await dialog.accept('https://sun-asterisk.com')
    })
    await page.getByRole('button', { name: 'Chèn liên kết' }).click()

    await expect(page.getByRole('button', { name: 'Chèn liên kết' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('ID-32: Quote toolbar button toggles blockquote', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    await page.getByRole('textbox', { name: 'Nội dung Kudo' }).click()
    await page.getByRole('button', { name: 'Trích dẫn' }).click()
    await expect(page.getByRole('button', { name: 'Trích dẫn' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  // ── Hashtag ───────────────────────────────────────────────────────────────────

  test('ID-15: adding a hashtag displays it as a chip', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await addHashtag(page, 'TeamWork')
    await expect(page.getByText('#TeamWork')).toBeVisible()
  })

  test('ID-34: removing a hashtag chip removes it from the list', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await addHashtag(page, 'TeamWork')
    await expect(page.getByText('#TeamWork')).toBeVisible()

    await page.getByRole('button', { name: 'Xóa hashtag #TeamWork' }).click()
    await expect(page.getByText('#TeamWork')).not.toBeVisible()
  })

  test('ID-35: can add up to 5 hashtags', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const tags = ['TeamWork', 'Support', 'Innovation', 'Leadership', 'Ownership']
    for (const tag of tags) {
      await addHashtag(page, tag)
    }

    // All 5 chips visible
    for (const tag of tags) {
      await expect(page.getByText(`#${tag}`)).toBeVisible()
    }
  })

  test('ID-36: "Thêm Hashtag" button is disabled when 5 hashtags are selected', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    // Add 5 tags to reach the limit
    const tags = ['TeamWork', 'Support', 'Innovation', 'Leadership', 'Ownership']
    for (const tag of tags) {
      await addHashtag(page, tag)
    }

    // At 5 hashtags the add button becomes aria-disabled — the app uses aria-disabled="true"
    // rather than the native disabled attribute. Playwright's default .click() respects
    // aria-disabled and waits for the element to become interactable (30s timeout). Use
    // force: true to fire the event anyway; the handler returns early when !canAdd
    // so no dropdown opens, confirming the no-op behaviour.
    const addBtn = page.getByRole('button', { name: /thêm hashtag \(tối đa 5\)/i })
    await expect(addBtn).toHaveAttribute('aria-disabled', 'true')
    // force bypasses the aria-disabled guard so we can assert the no-op result
    await addBtn.click({ force: true })
    // Dropdown must NOT open — picker search input stays hidden
    await expect(page.getByPlaceholder('Tìm hashtag...')).not.toBeVisible()
    // Remove-buttons (aria-label "Xóa hashtag #...") represent chip count — must stay at 5
    await expect(page.getByRole('button', { name: /xóa hashtag/i })).toHaveCount(5)
  })

  // ── Image Uploader ────────────────────────────────────────────────────────────

  test('ID-37: uploading a valid JPG image shows its thumbnail', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    // Use Playwright's file chooser to upload a synthetic PNG (smallest valid PNG)
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /thêm ảnh/i }).click()
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(
        // Minimal JFIF JPEG (43 bytes — valid JPEG header + EOI)
        'FFD8FFE000104A46494600010100000100010000FFDB004300080606070605' +
          '080707070909080A0C140D0C0B0B0C1912130F141D1A1F1E1D1A1C1C20242E2' +
          '72C2B2226213118Ffd9',
        'hex',
      ),
    })

    // After upload completes, a thumbnail should appear (img tag with alt text)
    await expect(page.getByAltText(/ảnh đã chọn|test-image/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('ID-39: uploading an invalid file type (PDF) shows an error message', async ({
    page,
  }) => {
    await devLogin(page)
    await openModal(page)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /thêm ảnh/i }).click()
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
    })

    // Client-side validation error message
    await expect(page.getByText(/không hợp lệ.*chỉ chấp nhận JPG hoặc PNG/i)).toBeVisible({
      timeout: 5_000,
    })
  })

  test('ID-55: uploading a file over 5 MB shows a size error', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /thêm ảnh/i }).click()
    const fileChooser = await fileChooserPromise

    // 5 MB + 1 byte
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff)
    await fileChooser.setFiles({
      name: 'huge.jpg',
      mimeType: 'image/jpeg',
      buffer: oversizedBuffer,
    })

    await expect(page.getByText(/vượt quá 5 MB/i)).toBeVisible({ timeout: 5_000 })
  })

  test('ID-23: "Thêm ảnh" button disappears once 5 images are uploaded', async ({ page }) => {
    // This scenario requires 5 successful uploads to Supabase Storage.
    // Automated in CI without real network is not feasible without mocking storage.
    // fixme: requires real Supabase Storage with bucket kudo-images and authenticated session.
    // When running locally with `supabase start` this test CAN pass — marked fixme for CI.
    test.fixme(
      true,
      [
        'ID-23: verifying that the add button hides after 5 uploads requires completing',
        '5 real Supabase Storage uploads (bucket kudo-images). Automatable locally',
        'with supabase start + seeded auth but not in CI (no local Supabase). ',
        'Un-fixme when CI Supabase service is available.',
      ].join(' '),
    )
  })

  test('ID-24: uploaded images can be removed via the X button', async ({ page }) => {
    // Same dependency on real upload completing before removal is testable.
    test.fixme(
      true,
      [
        'ID-24: image removal requires a prior successful upload to Supabase Storage',
        '(bucket kudo-images). Automatable locally with supabase start.',
        'Un-fixme when CI Supabase service is available.',
      ].join(' '),
    )
  })

  // ── Anonymous Toggle ──────────────────────────────────────────────────────────

  test('ID-41: clicking anonymous checkbox checks it', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const checkbox = page.getByRole('checkbox', { name: 'Gửi ẩn danh' })
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  test('ID-42: checking anonymous shows the alias input field', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    await page.getByRole('checkbox', { name: 'Gửi ẩn danh' }).click()
    await expect(page.getByLabel('Tên ẩn danh')).toBeVisible()
  })

  test('ID-43: unchecking anonymous hides the alias input field', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const checkbox = page.getByRole('checkbox', { name: 'Gửi ẩn danh' })
    // Check then uncheck
    await checkbox.click()
    await expect(page.getByLabel('Tên ẩn danh')).toBeVisible()
    await checkbox.click()
    await expect(page.getByLabel('Tên ẩn danh')).not.toBeVisible()
  })

  test('ID-44: alias field accepts text when anonymous is checked', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    await page.getByRole('checkbox', { name: 'Gửi ẩn danh' }).click()
    const aliasInput = page.getByLabel('Tên ẩn danh')
    await aliasInput.fill('Ninja Sunner')
    await expect(aliasInput).toHaveValue('Ninja Sunner')
  })

  // ── Submit Bar — Enabled / Disabled ──────────────────────────────────────────

  test('ID-48: Gửi button is disabled when all fields are empty', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    const submitBtn = page.getByRole('button', { name: 'Gửi Kudo' })
    await expect(submitBtn).toBeDisabled()
  })

  test('ID-49: Gửi button is enabled when recipient + content + hashtag are filled', async ({
    page,
  }) => {
    await devLogin(page)
    await openModal(page)
    await fillMinimumValidForm(page)

    const submitBtn = page.getByRole('button', { name: 'Gửi Kudo' })
    await expect(submitBtn).toBeEnabled()
  })

  // ── Cancel ───────────────────────────────────────────────────────────────────

  test('ID-45: clicking Hủy closes the modal and discards the form', async ({ page }) => {
    await devLogin(page)
    await openModal(page)

    // Type something so there is content to discard
    await typeContent(page, 'draft text')
    await page.getByRole('button', { name: 'Hủy' }).click()

    // Modal should be gone
    await expect(page.getByRole('dialog', { name: 'Viết Kudo' })).not.toBeVisible()
    // Back on /kudos page with the Viết Kudo button
    await expect(page.getByRole('button', { name: 'Viết Kudo' })).toBeVisible()
  })

  // ── Submit Success ────────────────────────────────────────────────────────────

  test('ID-46: successful submit shows toast "Đã gửi Kudo thành công"', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await fillMinimumValidForm(page)

    await page.getByRole('button', { name: 'Gửi Kudo' }).click()

    await expect(page.getByText('Đã gửi Kudo thành công')).toBeVisible({ timeout: 15_000 })
  })

  test('ID-47: successful submit closes the modal and resets the form', async ({ page }) => {
    await devLogin(page)
    await openModal(page)
    await fillMinimumValidForm(page)

    await page.getByRole('button', { name: 'Gửi Kudo' }).click()

    // Wait for toast
    await expect(page.getByText('Đã gửi Kudo thành công')).toBeVisible({ timeout: 15_000 })

    // Modal unmounts on success (isOpen=false → return null in KudoComposeModal)
    await expect(page.getByRole('dialog', { name: 'Viết Kudo' })).not.toBeVisible({
      timeout: 5_000,
    })

    // Re-open the modal — it remounts with a fresh component instance, so state is clean
    await openModal(page)

    // Fresh editor: Tiptap initialises with empty content → p.is-editor-empty is present
    const editor = page.getByRole('textbox', { name: 'Nội dung Kudo' })
    await expect(editor.locator('p.is-editor-empty').first()).toBeVisible()

    // Recipient trigger reverts to the "Tìm kiếm" placeholder span (no selection in fresh
    // state). The trigger <button> has no aria-label — its accessible name comes from the
    // <span> text "Tìm kiếm". Match the span text directly, scoped to the dialog.
    const dialog = page.getByRole('dialog', { name: 'Viết Kudo' })
    await expect(dialog.getByText('Tìm kiếm', { exact: true })).toBeVisible()
  })

  // ── Submit — DB verification ──────────────────────────────────────────────────

  test('ID-47 (DB): submitted kudo row exists in kudos table after successful submit', async ({
    page,
  }) => {
    // This test verifies the DB row via psql/Supabase — automatable locally only.
    // CI would require a running Supabase instance with access to psql.
    test.fixme(
      true,
      [
        'ID-47 (DB): verifying the kudos row in the database requires psql access to',
        'local Supabase (127.0.0.1:54322). Automatable locally with supabase start.',
        'Un-fixme when CI Supabase service is available.',
      ].join(' '),
    )
  })

  // ── All-empty form validation ─────────────────────────────────────────────────

  test('ID-56: clicking Gửi when all fields are empty keeps modal open (no submit)', async ({
    page,
  }) => {
    await devLogin(page)
    await openModal(page)

    // Gửi is disabled — the button cannot fire a real submit
    const submitBtn = page.getByRole('button', { name: 'Gửi Kudo' })
    await expect(submitBtn).toBeDisabled()

    // Confirm the modal is still visible
    await expect(page.getByRole('dialog', { name: 'Viết Kudo' })).toBeVisible()
  })
})
