import { chromium } from '@playwright/test'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'

const OUT = '/tmp/ui-audit-fresh'
const BASE = 'http://localhost:3000'
const userState = 'e2e/.auth/user.json'

await fs.mkdir(OUT, { recursive: true })

const VIEWPORTS = [
  { name: '1280', width: 1280, height: 900 },
  { name: '768', width: 768, height: 900 },
  { name: '375', width: 375, height: 812 },
]

const ROUTES = [
  { name: 'homepage', path: '/', auth: true },
  { name: 'login', path: '/login', auth: false },
  { name: 'countdown', path: '/countdown', auth: true },
  { name: 'board', path: '/board', auth: true },
  { name: 'profile', path: '/profile', auth: true },
  { name: 'awards', path: '/awards', auth: true },
  { name: 'rules', path: '/rules', auth: true },
  { name: 'secret-box', path: '/secret-box', auth: true },
  { name: 'kudos-modal', path: '/kudos', auth: true, openModal: true },
]

const browser = await chromium.launch({ headless: true })

for (const r of ROUTES) {
  for (const vp of VIEWPORTS) {
    const storageState = r.auth && existsSync(userState) ? userState : undefined
    const ctx = await browser.newContext({
      baseURL: BASE,
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      storageState,
    })
    const page = await ctx.newPage()
    try {
      await page.goto(r.path, { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1000)
      if (r.openModal) {
        const btn = page.getByRole('button', { name: /Viết Kudo|Gửi|Kudo/i }).first()
        if (await btn.count()) {
          await btn.click().catch(() => {})
          await page.waitForTimeout(1500)
        }
      }
      await page.screenshot({ path: `${OUT}/${r.name}-${vp.name}.png`, fullPage: false })
      await page.screenshot({ path: `${OUT}/${r.name}-${vp.name}-full.png`, fullPage: true })
      console.log(`OK  ${r.name} @${vp.name}`)
    } catch (e) {
      console.log(`ERR ${r.name} @${vp.name}: ${e.message.split('\n')[0]}`)
    }
    await ctx.close()
  }
}

await browser.close()
console.log('Done. All screenshots in', OUT)
