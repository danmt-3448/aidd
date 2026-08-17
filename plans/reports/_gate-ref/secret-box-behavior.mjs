#!/usr/bin/env node
/**
 * secret-box-behavior.mjs — nhóm B behavior walk for screen J3-4YFIpMM on REAL seeded data.
 * Mints a fresh session (no UI login → no dev-hydration flakiness for auth), injects the
 * @supabase/ssr cookie, drives the open flow with real clicks. Single authed context: opens
 * one box (decrement + badge reveal), then opens down to zero to exercise the empty state.
 * Run against a clean seed (npm run db:reset) so tran.thi.binh starts at 5 boxes.
 */
import { chromium } from 'playwright'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const BASE = 'http://localhost:3001'
const USER = 'tran.thi.binh@sun-asterisk.com'

async function mintCookie(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!' }),
  })
  if (!res.ok) throw new Error(`grant failed ${res.status}`)
  const s = await res.json()
  const session = { access_token: s.access_token, token_type: s.token_type, expires_in: s.expires_in, expires_at: s.expires_at, refresh_token: s.refresh_token, user: s.user }
  return 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64')
}

const sel = { counterNum: "[data-fig-key='counterNum']", guidance: "[data-fig-key='guidance']", box: "button[aria-label='Open secret box']", boxImg: "[data-fig-key='boxAsset']", close: "button[aria-label='Close']" }
const readState = (page) => page.evaluate((sel) => {
  const q = (s) => document.querySelector(s)
  const vis = (el) => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
  const b = q(sel.box), c = q(sel.counterNum), i = q(sel.boxImg)
  return { modalPresent: !!q("[data-fig-key='modal']"), counter: c ? c.textContent.trim() : null, guidanceVisible: vis(q(sel.guidance)), boxDisabled: b ? b.disabled : null, boxSrc: i ? (i.currentSrc || i.getAttribute('src')) : null }
}, sel)

const result = {}
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
await ctx.addCookies([{ name: 'sb-127-auth-token', value: await mintCookie(USER), domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }])
const page = await ctx.newPage()
const secretBoxErrors = []
page.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !t.includes('/homepage/')) secretBoxErrors.push(`[${m.type()}] ${t}`) })
page.on('pageerror', (e) => secretBoxErrors.push(`[pageerror] ${e.message}`))

await page.goto(`${BASE}/secret-box`, { waitUntil: 'networkidle' })
await page.waitForSelector("[data-fig-key='modal']", { timeout: 20000 })
await page.evaluate(() => document.fonts.ready)

const s0 = await readState(page)
// open ONE box → decrement + badge reveal
await page.evaluate((sel) => document.querySelector(sel.box)?.click(), sel)
let s1 = s0
for (let i = 0; i < 50; i++) { await page.waitForTimeout(200); s1 = await readState(page); if (s1.counter !== s0.counter) break }
result.fullAndOpen = {
  initialCounter: s0.counter, guidanceVisibleWhenNonZero: s0.guidanceVisible, boxEnabledWhenNonZero: s0.boxDisabled === false,
  afterOpenCounter: s1.counter, decrementedByOne: Number(s1.counter) === Number(s0.counter) - 1,
  badgeRevealed: s0.boxSrc !== s1.boxSrc, badgeSrc: s1.boxSrc,
}
// keep opening until zero → empty state
let sN = s1
for (let guard = 0; guard < 10 && Number(sN.counter) > 0; guard++) {
  await page.evaluate((sel) => { const b = document.querySelector(sel.box); if (b && !b.disabled) b.click() }, sel)
  const prev = sN.counter
  for (let i = 0; i < 50; i++) { await page.waitForTimeout(200); sN = await readState(page); if (sN.counter !== prev) break }
}
await page.screenshot({ path: 'plans/reports/_gate-ref/secret-box-empty.png', fullPage: true })
result.emptyState = { counter: sN.counter, guidanceHiddenWhenZero: !sN.guidanceVisible, boxDisabledWhenZero: sN.boxDisabled === true }

// close → /board
await page.evaluate((sel) => document.querySelector(sel.close)?.click(), sel)
await page.waitForTimeout(1000)
result.closeLanding = page.url()
result.secretBoxConsoleErrors = secretBoxErrors

// unauth → /login
const anon = await browser.newContext()
const ap = await anon.newPage()
await ap.goto(`${BASE}/secret-box`, { waitUntil: 'networkidle' })
result.unauthRedirect = ap.url()

console.log(JSON.stringify(result, null, 2))
await browser.close()
