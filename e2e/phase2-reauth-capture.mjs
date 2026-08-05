import { chromium } from '@playwright/test'
import * as fs from 'fs'

const BASE = 'http://localhost:3000'
const OUT = '/tmp/phase2-audit'
fs.mkdirSync(OUT, { recursive: true })

async function login(page, email, pass) {
  await page.goto('/dev-login', { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.fill('input[placeholder*="you@"]', email)
  await page.fill('input[type="password"]', pass)
  await page.click('button:has-text("Đăng nhập")')
  await page.waitForTimeout(3000)
  console.log(`  logged in as ${email}, now at: ${page.url().replace(BASE,'')}`)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await login(page, 'nguyen.van.an@sun-asterisk.com', 'TestPass123!')

const shots = [
  ['board-1280', '/board'],
  ['notifications-page-1280', '/notifications'],
  ['rules-1280', '/rules'],
  ['secret-box-1280', '/secret-box'],
  ['homepage-full-1280', '/'],
  ['not-found-1280', '/nonexistent-xyz'],
]

for (const [name, path] of shots) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`OK ${name} (${page.url().replace(BASE,'')})`)
}

// Homepage footer
await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(2500)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/homepage-footer-1280.png` })
console.log('OK homepage-footer-1280')

// Notification panel from board
await page.goto('/board', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(2000)
const bell = await page.$('[aria-haspopup="dialog"]')
if (bell) { await bell.click(); await page.waitForTimeout(1500) }
await page.screenshot({ path: `${OUT}/notifications-panel-1280.png` })
console.log('OK notifications-panel-1280')

// Language switch
await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(2000)
const langBtn = await page.$('button[aria-label*="Chuyển sang"]')
if (langBtn) { await langBtn.click(); await page.waitForTimeout(2000) }
await page.screenshot({ path: `${OUT}/lang-switched-1280.png` })
console.log('OK lang-switched-1280')

await ctx.close()

// 375px - FAB test
const ctx375 = await browser.newContext({ baseURL: BASE, viewport: { width: 375, height: 812 } })
const page375 = await ctx375.newPage()
await login(page375, 'nguyen.van.an@sun-asterisk.com', 'TestPass123!')
await page375.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page375.waitForTimeout(2500)
const fab = await page375.$('[aria-haspopup="menu"]')
if (fab) { await fab.click(); await page375.waitForTimeout(800) }
await page375.screenshot({ path: `${OUT}/homepage-fab-open-375.png` })
console.log('OK homepage-fab-open-375')

await page375.goto('/board', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page375.waitForTimeout(2500)
await page375.screenshot({ path: `${OUT}/board-375.png` })
console.log('OK board-375')
await ctx375.close()

// Non-admin user -> board redirect
const ctxUser = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 } })
const pageUser = await ctxUser.newPage()
await login(pageUser, 'tran.thi.binh@sun-asterisk.com', 'TestPass123!')
await pageUser.goto('/board', { waitUntil: 'domcontentloaded', timeout: 20000 })
await pageUser.waitForTimeout(2000)
await pageUser.screenshot({ path: `${OUT}/board-as-user-1280.png` })
console.log(`OK board-as-user-1280 (${pageUser.url().replace(BASE,'')})`)
await ctxUser.close()

await browser.close()
console.log('All done.')
