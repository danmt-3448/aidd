// capture-carousel-crop.mjs — precise crop of highlight carousel cards at 1440 to verify uniform 525px height.
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots/carousel-fix')
const BASE = 'http://localhost:3001'
const USER = path.join(__dirname, '.auth/user.json')

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({
    storageState: USER,
    viewport: { width: 1440, height: 900 },
    baseURL: BASE,
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/board`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)

  // Locate the highlight carousel section and get its bounding box
  const section = page.locator('[aria-label="Highlight Kudos"]')
  const sectionBox = await section.boundingBox()
  console.log('Carousel section bounding box:', sectionBox)

  if (sectionBox) {
    // Scroll section into view
    await section.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Screenshot the carousel section area
    await page.screenshot({
      path: path.join(OUT, 'carousel-section.png'),
      clip: {
        x: Math.max(0, sectionBox.x - 20),
        y: Math.max(0, sectionBox.y - 20),
        width: Math.min(1440, sectionBox.width + 40),
        height: Math.min(900, sectionBox.height + 40),
      },
    })
    console.log('  ✓ carousel-section.png — full carousel section clipped')
  }

  // Also get the hl-slide element height via evaluate
  const slideHeight = await page.evaluate(() => {
    const slide = document.querySelector('.hl-slide')
    if (!slide) return null
    const rect = slide.getBoundingClientRect()
    return { height: rect.height, width: rect.width }
  })
  console.log('hl-slide computed size:', slideHeight)

  // Scroll to carousel and take viewport screenshot
  await section.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(OUT, 'carousel-viewport.png'),
    fullPage: false,
  })
  console.log('  ✓ carousel-viewport.png — viewport with carousel visible')

  // Now scroll to ALL KUDOS section and capture
  const allKudos = page.locator('[aria-label="All Kudos"]')
  const akBox = await allKudos.boundingBox()
  console.log('All Kudos section bounding box:', akBox)

  await allKudos.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  // Measure scroll container height
  const containerHeight = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="All Kudos"] .overflow-y-auto')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const styles = getComputedStyle(el)
    return {
      height: rect.height,
      maxHeight: styles.maxHeight,
      scrollHeight: el.scrollHeight,
      visibleCards: el.querySelectorAll('article').length,
    }
  })
  console.log('All Kudos scroll container info:', containerHeight)

  await page.screenshot({
    path: path.join(OUT, 'all-kudos-viewport.png'),
    fullPage: false,
  })
  console.log('  ✓ all-kudos-viewport.png — viewport with all-kudos visible')

  console.log('\nDone.')
} finally {
  await browser.close()
}
