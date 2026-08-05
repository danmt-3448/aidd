import { chromium } from '@playwright/test'
import * as fs from 'fs/promises'
import path from 'path'

const BASE = 'http://localhost:3001'
const OUT = 'plans/260804-1713-notifications-ui'
const AUTH = 'e2e/.auth/user.json'

await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()

// Screenshot 1: homepage with bell panel open
const ctx1 = await browser.newContext({
  storageState: AUTH,
  viewport: { width: 1280, height: 800 },
})
const page1 = await ctx1.newPage()
await page1.goto(BASE + '/', { waitUntil: 'networkidle' })
const bell = page1.locator('button[aria-haspopup="dialog"]').first()
const bellVisible = await bell.isVisible().catch(() => false)
if (bellVisible) {
  await bell.click()
  await page1.waitForTimeout(700)
  await page1.screenshot({ path: path.join(OUT, 'bell-panel-open.png'), fullPage: false })
  console.log('captured: bell-panel-open.png')
} else {
  await page1.screenshot({ path: path.join(OUT, 'homepage-no-bell.png') })
  console.log('bell not visible — captured homepage fallback')
}
await ctx1.close()

// Screenshot 2: /notifications page
const ctx2 = await browser.newContext({
  storageState: AUTH,
  viewport: { width: 1280, height: 900 },
})
const page2 = await ctx2.newPage()
await page2.goto(BASE + '/notifications', { waitUntil: 'networkidle' })
await page2.screenshot({ path: path.join(OUT, 'notifications-page.png'), fullPage: true })
console.log('captured: notifications-page.png')
await ctx2.close()

await browser.close()
console.log('done')
