// capture-evidence.mjs — fullPage screenshots of the 5 dynamic screens with real seed data.
// Authed via global-setup storageState (e2e/.auth/user.json). Desktop 1440.
// Output → plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots/
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'plans/260811-1429-verify-5-dynamic-api-behavior-evidence/evidence/screenshots')
const BASE = 'http://localhost:3001'
const USER = path.join(__dirname, '.auth/user.json')
const U3 = '11111111-0000-0000-0000-000000000003' // profile-other target

const shots = []
async function shot(page, name, note) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  shots.push({ name, note, file })
  console.log(`  ✓ ${name} — ${note}`)
}
const settle = (page, ms = 2500) => page.waitForTimeout(ms)

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({
    storageState: USER,
    viewport: { width: 1440, height: 900 },
    baseURL: BASE,
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  // ── Homepage (authed: bell + account menu) ──────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await settle(page)
  await shot(page, '01-homepage', 'authed homepage — hero, countdown, awards grid, kudos section, footer')

  // ── Board — full feed + highlights + spotlight + sidebar stats ──────────────
  await page.goto(`${BASE}/board`, { waitUntil: 'networkidle' }); await settle(page, 3500)
  await shot(page, '02-board-full', 'live board — banner, highlight carousel, all-kudos feed, spotlight word-cloud, sidebar stats')

  // ── Viết Kudo compose modal (open + fields) ─────────────────────────────────
  await page.goto(`${BASE}/kudos`, { waitUntil: 'networkidle' }); await settle(page, 3000)
  await shot(page, '03-kudos-compose', 'Viết Kudo modal — recipient, textarea, hashtag, image, anonymous, submit')

  // ── Profile self ────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' }); await settle(page, 3000)
  await shot(page, '04-profile-self', 'own profile — hero+tier, badges, stats card (5 counters), kudos feed')

  // ── Profile other (write-bar + received feed; V1/V3 surface) ────────────────
  await page.goto(`${BASE}/profile?id=${U3}`, { waitUntil: 'networkidle' }); await settle(page, 3000)
  await shot(page, '05-profile-other', "other Sunner profile — write-Kudo bar (V1), received feed, receiver nav (V3)")

  // ── Secret box (closed modal) ───────────────────────────────────────────────
  await page.goto(`${BASE}/secret-box`, { waitUntil: 'networkidle' }); await settle(page, 3000)
  await shot(page, '06-secret-box', 'secret box modal — unopened box + counter + open action')

  // ── Notifications (out-of-scope screen but real data) ───────────────────────
  await page.goto(`${BASE}/notifications`, { waitUntil: 'networkidle' }).catch(() => {}); await settle(page, 2000)
  await shot(page, '07-notifications', 'notifications list (pending screen — captured for completeness)').catch(() => {})

  await ctx.close()
} finally {
  await browser.close()
}
console.log(`\nCaptured ${shots.length} screenshots → ${OUT}`)
