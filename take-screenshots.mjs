import { chromium } from '@playwright/test'
import { readFileSync } from 'fs'
import { mkdirSync } from 'fs'

const EVIDENCE_DIR = '/Users/mai.thanh.dan/Desktop/Sun/AI/aidd/plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots/ui-bugs-fix'
const AUTH_STATE = '/Users/mai.thanh.dan/Desktop/Sun/AI/aidd/e2e/.auth/user.json'
const BASE_URL = 'http://localhost:3001'

mkdirSync(EVIDENCE_DIR, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  storageState: AUTH_STATE,
  viewport: { width: 1440, height: 900 },
})
const page = await ctx.newPage()

// 1. Board — general shot
await page.goto(BASE_URL + '/board?ui_state=full', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: EVIDENCE_DIR + '/01-board-1440-general.png', fullPage: true })
console.log('✓ board general shot')

// 2. Hover popup — hover a person block in feed (first card, receiver block)
await page.goto(BASE_URL + '/board?ui_state=full', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// Scroll to the all-kudos feed section
await page.evaluate(() => {
  const section = document.querySelector('[aria-label="All Kudos"]')
  if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' })
})
await page.waitForTimeout(400)

// Hover on the first visible PersonBlock button in the all-kudos feed
const personButtons = page.locator('[aria-label="All Kudos"] button[aria-label^="Xem profile"]')
const count = await personButtons.count()
console.log(`Found ${count} person buttons in all-kudos feed`)

if (count > 0) {
  // Hover the last card's button (bottom of scroll container → tests worst-case clipping)
  const lastBtn = personButtons.last()
  await lastBtn.scrollIntoViewIfNeeded()
  await lastBtn.hover()
  await page.waitForTimeout(400)
  await page.screenshot({ path: EVIDENCE_DIR + '/02-hover-popup-visible.png', fullPage: true })
  console.log('✓ hover popup screenshot')
} else {
  console.log('⚠ No person buttons found — using first card')
  const allButtons = page.locator('button[aria-label^="Xem profile"]').first()
  await allButtons.hover()
  await page.waitForTimeout(400)
  await page.screenshot({ path: EVIDENCE_DIR + '/02-hover-popup-visible.png', fullPage: true })
  console.log('✓ hover popup screenshot (fallback)')
}

// 3. Verify popup is NOT clipped (tooltip role should be in viewport)
const tooltip = page.locator('[role="tooltip"]')
const tooltipVisible = await tooltip.isVisible()
console.log(`✓ Tooltip visible: ${tooltipVisible}`)

if (tooltipVisible) {
  const box = await tooltip.boundingBox()
  const vp = page.viewportSize()
  const notClipped = box
    ? box.x >= 0 && box.y >= 0 && box.x + box.width <= (vp?.width ?? 1440) && box.y + box.height <= (vp?.height ?? 900)
    : false
  console.log(`✓ Tooltip in viewport (not clipped): ${notClipped}`, JSON.stringify(box))
}

await ctx.close()
await browser.close()
console.log('Screenshots saved to', EVIDENCE_DIR)
