// capture.mjs — multi-state screenshot evidence for AIDD screens (real seeded data, authed session).
// Usage (from repo root): node .claude/skills/aidd-screenshot-report/scripts/capture.mjs <outDir> [screenNameFilter]
// Reads screens.json (manifest), captures each screen × state, writes screenshot-report.md + manifest.json.
// Requires: dev server on :3001, Supabase local seeded (npm run db:reset), e2e/.auth/*.json (authed storageState).
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '../../../..')
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screens.json'), 'utf8'))

const outDir = process.argv[2]
if (!outDir) { console.error('ERROR: outDir arg required'); process.exit(1) }
const filter = process.argv[3] || null
const absOut = path.isAbsolute(outDir) ? outDir : path.join(REPO, outDir)
fs.mkdirSync(absOut, { recursive: true })

const { baseURL, viewport, authFiles } = manifest
const screens = manifest.screens.filter((s) => !filter || s.name === filter)

const results = [] // {screen, state, file, status, note}

const browser = await chromium.launch()
try {
  for (const s of screens) {
    const authFile = s.auth && s.auth !== 'none' ? path.join(REPO, authFiles[s.auth]) : undefined
    const ctx = await browser.newContext({
      baseURL,
      viewport,
      ...(authFile && fs.existsSync(authFile) ? { storageState: authFile } : {}),
    })
    const page = await ctx.newPage()
    for (const state of s.states) {
      const label = `${s.name}-${state}`
      const file = path.join(absOut, `${label}.png`)
      const url = s.route
      try {
        await page.goto(baseURL + url, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(s.waitMs ?? 2500)
        if (s.mode === 'element') {
          const el = page.locator(s.element).first()
          await el.waitFor({ state: 'visible', timeout: 10000 })
          await el.screenshot({ path: file })
        } else {
          await page.screenshot({ path: file, fullPage: s.fullPage !== false })
        }
        const bytes = fs.statSync(file).size
        results.push({ screen: s.name, state, file: path.basename(file), status: 'ok', bytes, note: s.note || '' })
        console.log(`  ✓ ${label} (${Math.round(bytes / 1024)}KB) ${url}`)
      } catch (e) {
        results.push({ screen: s.name, state, file: null, status: 'FAIL', note: (e.message || '').split('\n')[0] })
        console.log(`  �’ ${label} FAILED: ${(e.message || '').split('\n')[0]}`)
      }
    }
    await ctx.close()
  }
} finally {
  await browser.close()
}

// ── Write report ──────────────────────────────────────────────────────────────
const byScreen = {}
for (const r of results) (byScreen[r.screen] ??= []).push(r)
const stamp = process.argv[4] || '' // optional date label passed by caller
let md = `# Screenshot Report — AIDD dynamic screens ${stamp}\n\n`
md += `Captured at desktop ${viewport.width}px, authed session, real seed data. Rule: \`.claude/rules/screenshot-report.md\`.\n\n`
md += `## Coverage (screen × state)\n\n| Screen | State | Status | File | Note |\n|---|---|---|---|---|\n`
for (const r of results) {
  md += `| ${r.screen} | ${r.state} | ${r.status === 'ok' ? '✅' : '❌ ' + r.note} | ${r.file ? '`' + r.file + '`' : '—'} | ${r.status === 'ok' ? (r.note || '') : ''} |\n`
}
md += `\n## Screenshots\n\n`
for (const [screen, rs] of Object.entries(byScreen)) {
  md += `### ${screen}\n\n`
  for (const r of rs) {
    if (r.status === 'ok') md += `**${r.state}**\n\n![${screen}-${r.state}](./${r.file})\n\n`
    else md += `**${r.state}** — ❌ ${r.note}\n\n`
  }
}
const okCount = results.filter((r) => r.status === 'ok').length
md += `\n---\n${okCount}/${results.length} states captured.\n`
fs.writeFileSync(path.join(absOut, 'screenshot-report.md'), md)
fs.writeFileSync(path.join(absOut, 'manifest.json'), JSON.stringify({ capturedAt: stamp, results }, null, 2))
console.log(`\nReport: ${path.join(absOut, 'screenshot-report.md')} — ${okCount}/${results.length} states OK`)
