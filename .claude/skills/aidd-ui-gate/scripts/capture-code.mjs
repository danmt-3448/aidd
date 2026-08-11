#!/usr/bin/env node
/**
 * capture-code.mjs — refresh the CODE half of a property-diff map from the LIVE DOM.
 *
 * The committed maps in plans/reports/_gate-ref/nodemap/{screen}.map[.1280].json carry
 * both `code` (captured last gate run) and `design` (authoritative, from MoMorph get_node).
 * Design never changes; to re-gate on a new HEAD we only need to re-measure `code`.
 *
 * This reads the nodemap (selectors) + the map (per-key design prop set), navigates the
 * live dev server with --force-color-profile=srgb, waits fonts.ready, measures
 * getComputedStyle for exactly the props `design` specifies per key, and writes a fresh
 * map. style-assert.mjs is then run on the output = deterministic PASS/FAIL.
 *
 * Also records no-overflow (scrollWidth vs clientWidth) at the given viewport.
 *
 * Usage:
 *   node capture-code.mjs --screen board --route /board \
 *     --map <map.json> --nodemap <nodemap.json> --viewport 1440 \
 *     --out <out.json> [--base http://127.0.0.1:3001]
 * Exit: 0 ok (map written) · 3 route/render error.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

function arg(name, def) {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : def
}

const screen = arg('--screen')
const route = arg('--route')
const mapPath = arg('--map')
const nodemapPath = arg('--nodemap')
const viewport = parseInt(arg('--viewport', '1440'), 10)
const vh = parseInt(arg('--vh', '1024'), 10) // viewport height; match artboard for full-bleed (min-h-screen) roots
const out = arg('--out')
const base = arg('--base', 'http://127.0.0.1:3001')

const map = JSON.parse(readFileSync(mapPath, 'utf8'))
const nodemap = JSON.parse(readFileSync(nodemapPath, 'utf8'))
// Nodemaps were hand-authored with 3 different array names across screens.
const items = nodemap.elements || nodemap.nodes || nodemap.entries || []
const selByKey = Object.fromEntries(items.map((e) => [e.key ?? e.label ?? e.name, e.selector]))
// Key→selector override for screens whose map keys diverge from nodemap labels, or whose
// nodeIds are reused (needs a scoped selector). Defaults to the committed sibling
// {nodemap-dir}/{screen}.selmap.json so a direct call is push-button; --selmap overrides.
const selmapPath = arg('--selmap') || (screen && join(dirname(nodemapPath), `${screen}.selmap.json`))
if (selmapPath && existsSync(selmapPath)) Object.assign(selByKey, JSON.parse(readFileSync(selmapPath, 'utf8')))

// Build the measurement plan: key → { selector, kind, props[] } from design's own prop set.
const plan = Object.entries(map).map(([key, entry]) => ({
  key,
  selector: selByKey[key] || `[data-fig-key='${key}']`,
  kind: entry.kind || 'style',
  props: Object.keys(entry.design || {}),
}))

const browser = await chromium.launch({
  args: ['--force-color-profile=srgb', '--disable-lcd-text'],
})
const page = await browser.newPage({ viewport: { width: viewport, height: vh }, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`[${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`))

const url = `${base}${route}${route.includes('?') ? '&' : '?'}ui_state=full`
let status
try {
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  status = resp?.status()
} catch (e) {
  console.error(JSON.stringify({ screen, viewport, error: `navigate failed: ${e.message}` }))
  await browser.close()
  process.exit(3)
}
await page.evaluate(() => document.fonts.ready)
const fontsLoaded = await page.evaluate(() => document.fonts.status === 'loaded')

const measured = await page.evaluate((plan) => {
  const readOpacityChain = (el) => {
    let o = 1
    let n = el
    while (n && n.nodeType === 1) {
      const v = parseFloat(getComputedStyle(n).opacity)
      if (Number.isFinite(v)) o *= v
      n = n.parentElement
    }
    return String(o)
  }
  const result = {}
  for (const { key, selector, kind, props } of plan) {
    const el = document.querySelector(selector)
    if (!el) {
      result[key] = { missing: true }
      continue
    }
    const cs = getComputedStyle(el)
    const code = {}
    for (const p of props) {
      if (p === 'offsetHeight') code.offsetHeight = el.offsetHeight
      else if (p === 'src' || p === 'tag') continue // handled below for assets
      else code[p] = cs[p]
    }
    code.opacity = readOpacityChain(el)
    if (kind === 'section') code.offsetHeight = el.offsetHeight
    if (kind === 'asset') {
      code.tag = el.tagName
      code.src = el.currentSrc || el.getAttribute('src') || el.getAttribute('xlink:href') || (el.tagName.toUpperCase() === 'SVG' ? 'inline-svg' : '')
    }
    result[key] = code
  }
  return result
}, plan)

const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

// Merge fresh code into a new map, keeping authoritative design.
const outMap = {}
for (const [key, entry] of Object.entries(map)) {
  outMap[key] = { kind: entry.kind || 'style', code: measured[key] || { missing: true }, design: entry.design }
}
writeFileSync(out, JSON.stringify(outMap, null, 2))

console.error(JSON.stringify({
  screen, viewport, status, fontsLoaded,
  overflow: overflow.scrollWidth <= overflow.clientWidth ? 'ok' : `OVERFLOW ${overflow.scrollWidth}>${overflow.clientWidth}`,
  consoleErrors: consoleErrors.slice(0, 8),
  measured: Object.keys(outMap).length,
}))

await browser.close()
process.exit(0)
