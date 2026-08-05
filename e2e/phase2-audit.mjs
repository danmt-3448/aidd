import { chromium } from '@playwright/test'
import * as fs from 'fs'

const OUT = '/tmp/phase2-audit'
const BASE = 'http://localhost:3000'
const adminState = './e2e/.auth/admin.json'
const userState = './e2e/.auth/user.json'

const SHOTS = [
  { name: 'board-1280', path: '/board', auth: adminState, w: 1280, h: 900, wait: 2500 },
  { name: 'notifications-panel-1280', path: '/board', auth: adminState, w: 1280, h: 900, wait: 2000, action: 'click-bell' },
  { name: 'notifications-page-1280', path: '/notifications', auth: adminState, w: 1280, h: 900, wait: 2500 },
  { name: 'rules-1280', path: '/rules', auth: adminState, w: 1280, h: 900, wait: 2000 },
  { name: 'secret-box-1280', path: '/secret-box', auth: adminState, w: 1280, h: 900, wait: 2000 },
  { name: 'homepage-footer-1280', path: '/', auth: adminState, w: 1280, h: 900, wait: 2500, scroll: 'bottom' },
  { name: 'homepage-full-1280', path: '/', auth: adminState, w: 1280, h: 900, wait: 2500 },
  { name: 'board-as-user-1280', path: '/board', auth: userState, w: 1280, h: 900, wait: 2500 },
  { name: 'not-found-1280', path: '/nonexistent-xyz', auth: adminState, w: 1280, h: 900, wait: 1500 },
  { name: 'board-375', path: '/board', auth: adminState, w: 375, h: 812, wait: 2500 },
  { name: 'homepage-fab-375', path: '/', auth: adminState, w: 375, h: 812, wait: 2000, action: 'click-fab' },
]

fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()

for (const s of SHOTS) {
  const ctx = await browser.newContext({
    baseURL: BASE,
    viewport: { width: s.w, height: s.h },
    storageState: s.auth,
  })
  const page = await ctx.newPage()
  try {
    await page.goto(s.path, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(s.wait || 2000)
    
    if (s.action === 'click-bell') {
      const bell = await page.$('[aria-label*="thông báo"], [aria-label*="Thông báo"], [aria-haspopup="dialog"]')
      if (bell) {
        await bell.click()
        await page.waitForTimeout(1200)
      }
    }
    if (s.action === 'click-fab') {
      const fab = await page.$('[aria-haspopup="menu"]')
      if (fab) {
        await fab.click()
        await page.waitForTimeout(800)
      }
    }
    if (s.scroll === 'bottom') {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(600)
    }
    
    const finalUrl = page.url()
    await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: false })
    console.log(`OK  ${s.name} (url: ${finalUrl.replace('http://localhost:3000','')})`)
  } catch (e) {
    console.log(`ERR ${s.name}: ${e.message.split('\n')[0]}`)
  }
  await ctx.close()
}

await browser.close()
console.log('Done.')
