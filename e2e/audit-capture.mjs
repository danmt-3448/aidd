import { chromium } from '@playwright/test'
import * as fs from 'fs/promises'

// UI-parity audit — 1440px wide capture for all built screens.
const OUT = 'plans/reports/ui-audit/shots'
const BASE = 'http://localhost:3000'
const W = 1440
const userState = 'e2e/.auth/user.json'

const ROUTES = [
  { name: 'homepage', path: '/', auth: true },
  { name: 'countdown', path: '/countdown', auth: true },
  { name: 'login', path: '/login', auth: false },
  { name: 'board', path: '/board', auth: true },
  { name: 'profile', path: '/profile', auth: true },
  { name: 'rules', path: '/rules', auth: true },
  { name: 'awards', path: '/awards', auth: true },
  { name: 'secret-box', path: '/secret-box', auth: true },
  { name: 'kudos-modal', path: '/kudos', auth: true, openModal: true },
]

await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()

for (const r of ROUTES) {
  const context = await browser.newContext({
    baseURL: BASE,
    viewport: { width: W, height: 900 },
    deviceScaleFactor: 1,
    ...(r.auth ? { storageState: userState } : {}),
  })
  const page = await context.newPage()
  try {
    await page.goto(r.path, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1000)
    if (r.openModal) {
      const btn = page.getByRole('button', { name: /Viết Kudo|Gửi lời chúc|Kudo/i }).first()
      if (await btn.count()) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(1200)
      }
    }
    await page.screenshot({ path: `${OUT}/${r.name}-1440.png`, fullPage: true })
    console.log(`OK  ${r.name} @1440`)
  } catch (e) {
    console.log(`ERR ${r.name} @1440: ${e.message.split('\n')[0]}`)
  }
  await context.close()
}
await browser.close()
console.log('done')
