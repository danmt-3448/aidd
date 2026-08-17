#!/usr/bin/env node
/**
 * secret-box-capture.mjs — one-off authed property-diff capture for screen J3-4YFIpMM.
 *
 * Why standalone (not capture-code.mjs): the shared harness launches chromium WITHOUT a
 * session, so it can't reach authed routes; and dev Turbopack won't reliably hydrate the
 * dev-login form headless. This mints a FRESH session via GoTrue password-grant and injects
 * the @supabase/ssr cookie directly (base64- JSON, single cookie), so no UI login / hydration
 * is needed — property-diff is pure getComputedStyle, valid on Turbopack dev.
 *
 * Emits per-viewport map JSON {key:{kind,code,design}} for style-assert.mjs + landing URL,
 * overflow, console errors, and the DOM tag/src for the box asset.
 */
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const EMAIL = process.argv[2] || 'tran.thi.binh@sun-asterisk.com'
const PASSWORD = 'TestPass123!'
const BASE = 'http://localhost:3001' // cookie domain is localhost
const ROUTE = '/secret-box'

// Authoritative DESIGN values (MoMorph get_node, screen J3-4YFIpMM). Do NOT guess.
const DESIGN = {
  modal: { kind: 'style', design: { backgroundColor: 'rgba(0,16,26,1)', borderTopLeftRadius: '12.729px', paddingTop: '23.866px', paddingLeft: '12.729px', rowGap: '22.275px', opacity: '1' } },
  title: { kind: 'style', design: { color: 'rgba(255,234,158,1)', fontWeight: '700', fontSize: '25.457px', lineHeight: '31.822px', letterSpacing: '0px', opacity: '1' } },
  guidance: { kind: 'style', design: { color: 'rgba(255,255,255,1)', fontWeight: '700', fontSize: '12.729px', lineHeight: '19.093px', letterSpacing: '0.398px', opacity: '1' } },
  counterLabel: { kind: 'style', design: { color: 'rgba(255,255,255,1)', fontWeight: '700', fontSize: '12.729px', lineHeight: '19.093px', letterSpacing: '0.398px', opacity: '1' } },
  counterNum: { kind: 'style', design: { color: 'rgba(255,234,158,1)', fontWeight: '700', fontSize: '28.639px', lineHeight: '35.004px', letterSpacing: '0px', opacity: '1' } },
  boxAsset: { kind: 'asset', design: {} },
}

async function mintCookie() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`token grant failed ${res.status}: ${await res.text()}`)
  const s = await res.json()
  const session = { access_token: s.access_token, token_type: s.token_type, expires_in: s.expires_in, expires_at: s.expires_at, refresh_token: s.refresh_token, user: s.user }
  return 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64')
}

const cookieValue = await mintCookie()
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text'] })
const ctx = await browser.newContext({ deviceScaleFactor: 1 })
await ctx.addCookies([{ name: 'sb-127-auth-token', value: cookieValue, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }])
const page = await ctx.newPage()

const report = { user: EMAIL, viewports: {} }
for (const vw of [1440, 1280]) {
  await page.setViewportSize({ width: vw, height: 1024 })
  const consoleMsgs = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(`[${m.type()}] ${m.text()}`) })
  const resp = await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  const fontsLoaded = await page.evaluate(() => document.fonts.status === 'loaded' && document.fonts.check('700 16px Montserrat'))
  const landing = page.url()

  const measured = await page.evaluate((design) => {
    const opChain = (el) => { let o = 1, n = el; while (n && n.nodeType === 1) { const v = parseFloat(getComputedStyle(n).opacity); if (Number.isFinite(v)) o *= v; n = n.parentElement } return String(o) }
    const out = {}
    for (const [key, { kind, design: d }] of Object.entries(design)) {
      const el = document.querySelector(`[data-fig-key='${key}']`)
      if (!el) { out[key] = { missing: true }; continue }
      const cs = getComputedStyle(el)
      const code = {}
      for (const p of Object.keys(d)) { if (p === 'opacity') continue; code[p] = cs[p] }
      code.opacity = opChain(el)
      if (kind === 'asset') { code.tag = el.tagName; code.src = el.currentSrc || el.getAttribute('src') || (el.tagName.toUpperCase() === 'SVG' ? 'inline-svg' : '') }
      out[key] = code
    }
    return out
  }, DESIGN)

  const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  const outMap = {}
  for (const [key, entry] of Object.entries(DESIGN)) outMap[key] = { kind: entry.kind, code: measured[key] || { missing: true }, design: entry.design }
  const mapPath = `plans/reports/_gate-ref/secret-box.${vw}.map.json`
  writeFileSync(mapPath, JSON.stringify(outMap, null, 2))
  await page.screenshot({ path: `plans/reports/_gate-ref/secret-box-${vw}.png`, fullPage: true })
  report.viewports[vw] = { landing, fontsLoaded, status: resp?.status(), overflow: overflow.sw <= overflow.cw ? 'ok' : `OVERFLOW ${overflow.sw}>${overflow.cw}`, consoleErrors: consoleMsgs.slice(0, 8), mapPath }
}

// 1920 no-break probe
await page.setViewportSize({ width: 1920, height: 1024 })
await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle' })
const of1920 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
await page.screenshot({ path: 'plans/reports/_gate-ref/secret-box-1920.png', fullPage: true })
report.noBreak1920 = of1920.sw <= of1920.cw ? 'ok' : `OVERFLOW ${of1920.sw}>${of1920.cw}`

console.log(JSON.stringify(report, null, 2))
await browser.close()
