// capture-ui-fix-evidence.mjs — after screenshots for A1–A4 UI fixes.
// Authed via e2e/.auth/user.json. Desktop 1440.
// Output → plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots/ui-fix/
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots/ui-fix')
const BASE = 'http://localhost:3001'
const USER = path.join(__dirname, '.auth/user.json')
const U3 = '11111111-0000-0000-0000-000000000003'

const shots = []
async function shot(page, name, note) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  shots.push({ name, note, file })
  console.log(`  ✓ ${name} — ${note}`)
}
const settle = (page, ms = 3000) => page.waitForTimeout(ms)

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({
    storageState: USER,
    viewport: { width: 1440, height: 900 },
    baseURL: BASE,
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  // ── A1: Homepage — dark bg edge-to-edge, no white gap below footer ───────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await settle(page, 2500)
  await shot(page, 'homepage-after', 'A1 — homepage root has #00101A bg, no white gap at bottom')

  // ── A2: Board — sparse cards fit content, carousel taller ────────────────
  await page.goto(`${BASE}/board`, { waitUntil: 'networkidle' })
  await settle(page, 4000)
  await shot(page, 'board-full-after', 'A2 — sparse cards short (no 749px floor), carousel 424px, load-more button')

  // Scroll down to show load-more button area
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await settle(page, 1000)
  await shot(page, 'board-feed-scroll-after', 'A2c — all-kudos bounded scroll + load-more button visible')

  // ── A3: Kudos compose — image uploader not blocked ────────────────────────
  await page.goto(`${BASE}/kudos?modal=compose`, { waitUntil: 'networkidle' })
  await settle(page, 4000)
  await shot(page, 'kudos-compose-after', 'A3 — compose modal open, image uploader enabled (resolvedUserId wired)')

  // Verify the + Image button is not disabled
  const imgBtn = page.locator('button[aria-label*="Thêm ảnh"]')
  const isDisabled = await imgBtn.getAttribute('disabled')
  console.log(`  [A3 check] "+ Image" button disabled=${isDisabled} (null = enabled)`)

  // ── Profile self ──────────────────────────────────────────────────────────
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' })
  await settle(page, 3000)
  await shot(page, 'profile-self-after', 'A4 — profile self uses KudoCard (re-exported), unchanged visually')

  // ── Profile other — compose modal from write bar ──────────────────────────
  await page.goto(`${BASE}/profile?id=${U3}`, { waitUntil: 'networkidle' })
  await settle(page, 3000)
  await shot(page, 'profile-other-after', 'A4 — profile other, KudoCard identical to board feed')

  await ctx.close()
} finally {
  await browser.close()
}
console.log(`\nCaptured ${shots.length} screenshots → ${OUT}`)
