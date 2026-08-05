import { chromium } from '@playwright/test'
import * as fs from 'fs/promises'
import path from 'path'

const BASE = 'http://localhost:3001'
const OUT = 'plans/260804-1713-notifications-ui'

await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()

// Authenticate via dev-login first (no stored session — cookie expired).
const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page1 = await ctx1.newPage()

// Login via dev-login form (no aria labels — uses placeholder only)
await page1.goto(BASE + '/dev-login', { waitUntil: 'networkidle' })
await page1.locator('input[type="email"]').fill('nguyen.van.an@sun-asterisk.com')
await page1.locator('input[type="password"]').fill('TestPass123!')
await page1.locator('button[type="submit"]').click()
await page1.waitForTimeout(3000)
console.log('post-login URL:', page1.url())

// Navigate to /board
await page1.goto(BASE + '/board', { waitUntil: 'networkidle' })

// Check if we landed on board or were redirected
const url1 = page1.url()
console.log('board URL:', url1)
await page1.screenshot({ path: path.join(OUT, 'board-page.png') })

if (url1.includes('/board')) {
  const bell = page1.locator('button[aria-haspopup="dialog"]').first()
  const bellVisible = await bell.isVisible().catch(() => false)
  console.log('bell visible:', bellVisible)
  if (bellVisible) {
    await bell.click()
    await page1.waitForTimeout(800)
    await page1.screenshot({ path: path.join(OUT, 'bell-panel-open.png') })
    console.log('captured: bell-panel-open.png')
  }
}

// Screenshot /notifications — same authenticated page, close panel first
await page1.keyboard.press('Escape')
await page1.goto(BASE + '/notifications', { waitUntil: 'networkidle' })
const url2 = page1.url()
console.log('notifications URL:', url2)
await page1.screenshot({ path: path.join(OUT, 'notifications-page.png'), fullPage: true })
console.log('captured: notifications-page.png')

await ctx1.close()
await browser.close()
console.log('done')
