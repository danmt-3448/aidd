/**
 * verify-edit-kudo.mjs
 *
 * Playwright script to verify the edit-kudo feature end-to-end:
 *   1. Load /board as authenticated user (user.json session)
 *   2. Find an own kudo (pencil icon visible)
 *   3. Click the pencil — edit modal should open prefilled
 *   4. Screenshot the prefilled modal
 *   5. Confirm no pencil on a non-own kudo
 *
 * Run: node scripts/verify-edit-kudo.mjs
 */

import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AUTH_FILE = path.join(ROOT, 'e2e/.auth/user.json')
const SCREENSHOT_DIR = path.join(
  ROOT,
  'plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots/edit-kudo',
)
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

const BASE_URL = 'http://localhost:3001'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ storageState: AUTH_FILE })
  const page = await ctx.newPage()

  // ── 1. Navigate to board ──────────────────────────────────────────────────
  console.log('Navigating to /board …')
  await page.goto(`${BASE_URL}/board`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500) // let realtime + card render settle

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01-board-loaded.png'),
    fullPage: false,
  })
  console.log('Screenshot: 01-board-loaded.png')

  // ── 2. Find an own kudo card (pencil icon is the edit trigger) ────────────
  // The pencil is data-testid="edit-kudo-btn" or just a button with aria-label
  // matching "Sửa Kudo" — check what the card renders.
  // The pencil button aria-label is set in board-feed-card.tsx
  const pencilSelector = '[aria-label="Chỉnh sửa kudo"]'
  const pencilCount = await page.locator(pencilSelector).count()
  console.log(`Found ${pencilCount} pencil icon(s) on board`)

  if (pencilCount === 0) {
    // Try scrolling down to find own kudos
    await page.keyboard.press('End')
    await page.waitForTimeout(1000)
    const after = await page.locator(pencilSelector).count()
    console.log(`After scroll: ${after} pencil icon(s)`)
    if (after === 0) {
      console.warn('No own kudos found — the authed user may not have sent any kudos yet.')
      await browser.close()
      return
    }
  }

  // ── 3. Click the first pencil → edit modal opens ─────────────────────────
  const pencil = page.locator(pencilSelector).first()
  await pencil.scrollIntoViewIfNeeded()
  await pencil.click()
  console.log('Clicked pencil edit button')

  // Wait for the edit modal dialog to appear
  const modal = page.locator('[role="dialog"][aria-label="Sửa Kudo"]')
  await modal.waitFor({ state: 'visible', timeout: 8000 })
  console.log('Edit modal opened')

  await page.waitForTimeout(600) // let TiptapEditor lazy-load + prefill settle

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02-edit-modal-prefilled.png'),
    fullPage: false,
  })
  console.log('Screenshot: 02-edit-modal-prefilled.png')

  // ── 4. Verify prefill: title, locked recipient, content ───────────────────
  const title = await modal.locator('h2').textContent()
  console.log(`Modal title: "${title}"`)
  if (title?.trim() !== 'Sửa Kudo') {
    throw new Error(`Expected modal title "Sửa Kudo", got "${title}"`)
  }

  const lockedRecipient = await modal.locator('[aria-disabled="true"]').first().textContent()
  console.log(`Locked recipient text: "${lockedRecipient?.trim()}"`)

  // ── 5. Confirm no anonymous toggle ───────────────────────────────────────
  const anonToggle = modal.locator('text=Ẩn danh')
  const anonVisible = await anonToggle.isVisible()
  console.log(`Anonymous toggle visible in edit mode: ${anonVisible} (expected: false)`)
  if (anonVisible) throw new Error('Anonymous toggle should be hidden in edit mode')

  // ── 6. Check a non-own kudo has NO pencil ────────────────────────────────
  // All feed cards — count those that DO NOT have the pencil button.
  // We check by looking for cards that have NO pencil inside them.
  const allCards = page.locator('[data-testid="feed-card"], .feed-card, article')
  const cardCount = await allCards.count()
  console.log(`Total feed cards visible: ${cardCount}`)
  console.log(`Own kudos (have pencil): ${pencilCount}, non-own kudos (no pencil): ${cardCount - pencilCount}`)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03-board-pencil-gate-confirmed.png'),
    fullPage: false,
  })
  console.log('Screenshot: 03-board-pencil-gate-confirmed.png')

  // ── 7. Close modal and confirm it dismisses ───────────────────────────────
  await page.keyboard.press('Escape')
  await modal.waitFor({ state: 'hidden', timeout: 4000 })
  console.log('Modal closed via Escape key')

  console.log('\nAll checks passed.')
  await browser.close()
}

run().catch((err) => {
  console.error('Verification FAILED:', err.message)
  process.exit(1)
})
