// capture-carousel-fix.mjs — targeted screenshots verifying carousel height fix + all-kudos scroll.
// Authed via storageState. Desktop 1440. Output → carousel-fix/ subfolder.
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

  // 1. Full board page
  await page.screenshot({
    path: path.join(OUT, 'board-full-1440.png'),
    fullPage: true,
  })
  console.log('  ✓ board-full-1440.png')

  // 2. Crop: highlight carousel region (y=0 to ~820 from page top — covers banner+carousel)
  await page.screenshot({
    path: path.join(OUT, 'carousel-crop.png'),
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  })
  console.log('  ✓ carousel-crop.png — viewport crop (carousel visible)')

  // 3. Scroll to all-kudos section and capture ~4 cards + scroll state
  // All-kudos section is in the left column, below the carousel
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(OUT, 'all-kudos-scroll.png'),
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  })
  console.log('  ✓ all-kudos-scroll.png — all-kudos section scrolled view')

  console.log('\nDone. Files written to:', OUT)
} finally {
  await browser.close()
}
