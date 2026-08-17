#!/usr/bin/env node
/**
 * style-assert.mjs — structured property-diff HARD GATE for the UI-First Gate.
 *
 * Compares CODE values (getComputedStyle, gathered by Playwright) against DESIGN
 * values (MoMorph get_node) per element and prints a deterministic PASS/FAIL.
 * This catches the class of bug whole-page pixel-diff + eyeballing miss: wrong
 * color, wrong font-weight, wrong size/spacing, asset rebuilt as text, wrong icon fill.
 *
 * Design decisions (from plan 260806-0711 phase-01b, red-team-hardened):
 *  - Color compares as rgba INCLUDING alpha (never drop-alpha-to-hex).            [RT-5]
 *  - Parent opacity folds into effective alpha before color compare.             [RT-7]
 *  - Empty / under-covered / missing-element map → exit 2 (never a silent PASS). [RT-1]
 *  - Asset elements must be <img>/<svg>/<picture> with src, else FAIL.
 *  - Icon fill must be resolvable and match; unresolvable → FAIL (not WARN).      [RT-10]
 *  - Section height compares offsetHeight vs node height (±2px) — absorbs band.  [RT-11]
 *
 * Input map JSON: { "<key>": { kind, code:{...}, design:{...} }, ... }
 *   kind ∈ 'style' | 'section' | 'asset' | 'icon'
 *   code entry may carry { missing:true } when the selector matched nothing.
 *
 * Usage:
 *   node style-assert.mjs --map map.json [--min-elements N] [--screen name]
 * Exit: 0 all PASS · 1 has FAIL · 2 input/coverage error.
 */

import { existsSync, readFileSync } from 'node:fs'

const PX_TOL = 1 // px tolerance for size/spacing/radius
const H_TOL = 2 // px tolerance for section height

function parseArgs(argv) {
  const a = { minElements: 1 }
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i]
    if (k === '--map') a.map = argv[++i]
    else if (k === '--min-elements') a.minElements = parseInt(argv[++i], 10) || 1
    else if (k === '--screen') a.screen = argv[++i]
    else if (k === '--help' || k === '-h') a.help = true
  }
  return a
}

const HELP = `style-assert.mjs — structured property-diff hard gate

  --map <file>          JSON { key: { kind, code, design } }
  --min-elements <N>    fail (exit 2) if map has fewer than N entries (default 1)
  --screen <name>       label for the report

kind: style | section | asset | icon
color: compared as rgba incl. alpha (parent opacity folded); NOT drop-to-hex.
size/spacing/radius: ±${PX_TOL}px · fontWeight: exact · section height: ±${H_TOL}px.
Exit 0 = all PASS, 1 = FAIL, 2 = input/coverage error (incl. empty map / missing element).`

/** Parse any CSS color into {r,g,b,a} 0-255 / 0-1, or null. */
function parseColor(v) {
  if (v == null) return null
  const s = String(v).trim().toLowerCase()
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  let m = s.match(/^#([0-9a-f]{3,8})$/)
  if (m) {
    let h = m[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    if (h.length === 6) h += 'ff'
    if (h.length !== 8) return null
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: parseInt(h.slice(6, 8), 16) / 255 }
  }
  m = s.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    // Support both comma form `rgb(228, 0, 43)` and modern space form `rgb(228 0 43 / 0.5)`.
    const p = m[1].replace('/', ' ').split(/[\s,]+/).filter(Boolean)
    if (p.length < 3) return null
    const nums = p.map((x) => +x)
    if (nums.slice(0, 3).some((n) => !Number.isFinite(n))) return null
    return { r: nums[0], g: nums[1], b: nums[2], a: nums[3] != null && Number.isFinite(nums[3]) ? nums[3] : 1 }
  }
  return null
}

/** Fold an optional opacity (0-1) into a color's alpha. */
function withOpacity(color, opacity) {
  if (!color) return color
  const o = opacity == null || opacity === '' ? 1 : Number(opacity)
  return { ...color, a: +(color.a * (Number.isFinite(o) ? o : 1)).toFixed(3) }
}

function colorKey(c) {
  return c ? `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a.toFixed(2)}` : 'none'
}

function px(v) {
  if (v == null) return null
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

const WEIGHT_NAMES = { normal: 400, bold: 700, lighter: 300, bolder: 700 }
function weight(v) {
  if (v == null) return null
  const s = String(v).trim().toLowerCase()
  return WEIGHT_NAMES[s] ?? (Number.isFinite(+s) ? +s : null)
}

const COLOR_PROPS = new Set([
  'color', 'bg', 'backgroundColor', 'iconFill', 'fill', 'stroke',
  // border colors: getComputedStyle serializes per-side (borderTopColor…) as rgb();
  // compare them as colors (rgb vs rgba parse-equal) instead of raw string-compare.
  'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
])
const PX_PROPS = new Set([
  'fontSize', 'lineHeight', 'letterSpacing',
  'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom',
  'rowGap', 'columnGap',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'borderTopWidth', 'width', 'height',
])

/** Compare one property. Returns {prop, code, design, ok}. */
function cmpProp(prop, codeV, designV, codeOpacity, designOpacity) {
  if (COLOR_PROPS.has(prop)) {
    const c = withOpacity(parseColor(codeV), prop === 'color' || prop === 'bg' || prop === 'backgroundColor' ? codeOpacity : null)
    const d = withOpacity(parseColor(designV), prop === 'color' || prop === 'bg' || prop === 'backgroundColor' ? designOpacity : null)
    return { prop, code: colorKey(c), design: colorKey(d), ok: !!c && !!d && colorKey(c) === colorKey(d) }
  }
  if (prop === 'fontWeight') {
    const c = weight(codeV)
    const d = weight(designV)
    return { prop, code: c, design: d, ok: c != null && c === d }
  }
  if (PX_PROPS.has(prop)) {
    // `letter-spacing: normal` computes to 0 for spacing purposes; getComputedStyle
    // serializes an explicit 0px back to `normal`. Treat them as equal (avoids false-FAIL).
    const norm = (v) => (prop === 'letterSpacing' && String(v).trim().toLowerCase() === 'normal' ? '0px' : v)
    const c = px(norm(codeV))
    const d = px(norm(designV))
    return { prop, code: c, design: d, ok: c != null && d != null && Math.abs(c - d) <= PX_TOL }
  }
  // string props (border shorthand, tag, src) → exact string compare
  return { prop, code: codeV, design: designV, ok: String(codeV) === String(designV) }
}

function assertEntry(key, entry) {
  const { kind = 'style', code = {}, design = {} } = entry
  const rows = []
  if (code.missing) {
    rows.push({ prop: '(element)', code: 'MISSING', design: '(selector matched nothing)', ok: false, fatal: true })
    return rows
  }
  if (kind === 'asset') {
    const tag = String(code.tag || '').toUpperCase()
    const okTag = ['IMG', 'SVG', 'PICTURE'].includes(tag)
    const okSrc = tag === 'SVG' || (code.src != null && code.src !== '')
    rows.push({ prop: 'asset-tag', code: tag, design: 'IMG|SVG|PICTURE', ok: okTag })
    rows.push({ prop: 'asset-src', code: code.src ?? null, design: '(non-empty)', ok: okSrc })
    return rows
  }
  if (kind === 'icon') {
    const fill = code.iconFill
    if (fill == null) rows.push({ prop: 'icon-fill', code: null, design: design.fill ?? design.iconFill ?? '(node)', ok: false })
    else rows.push(cmpProp('iconFill', fill, design.fill ?? design.iconFill, code.opacity, design.opacity))
    return rows
  }
  if (kind === 'section') {
    const c = px(code.offsetHeight ?? code.height)
    const d = px(design.height)
    rows.push({ prop: 'section-height', code: c, design: d, ok: c != null && d != null && Math.abs(c - d) <= H_TOL })
  }
  // style (and section also gets its style props): compare every design prop present
  for (const prop of Object.keys(design)) {
    if (prop === 'opacity' || (prop === 'height' && kind === 'section')) continue
    // H-1: design specifies a prop but code never measured it → FAIL (never silent-skip).
    if (!(prop in code)) {
      rows.push({ prop, code: '(not measured)', design: design[prop], ok: false })
      continue
    }
    rows.push(cmpProp(prop, code[prop], design[prop], code.opacity, design.opacity))
  }
  return rows
}

function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    console.log(HELP)
    process.exit(0)
  }
  if (!args.map || !existsSync(args.map)) {
    console.error('[style-assert] --map <file> required and must exist')
    process.exit(2)
  }
  let map
  try {
    map = JSON.parse(readFileSync(args.map, 'utf8'))
  } catch (e) {
    console.error('[style-assert] invalid JSON map:', e.message)
    process.exit(2)
  }
  const keys = Object.keys(map)
  if (keys.length < args.minElements) {
    console.error(`[style-assert] COVERAGE FAIL: ${keys.length} element(s) < --min-elements ${args.minElements}. Map rỗng/thiếu tag KHÔNG được coi là PASS.`)
    process.exit(2)
  }

  const report = []
  let failCount = 0
  let coverageError = false
  for (const key of keys) {
    const rows = assertEntry(key, map[key])
    // A tagged element that produced zero comparisons measured nothing — that is a coverage
    // hole, not a PASS. Force exit 2 so an empty/degenerate entry can never be a silent pass.
    if (rows.length === 0) {
      report.push({ key, prop: '(no checks)', code: '—', design: 'entry produced 0 comparisons', ok: false, fatal: true })
      failCount++
      coverageError = true
      continue
    }
    for (const r of rows) {
      if (!r.ok) {
        failCount++
        if (r.fatal) coverageError = true
      }
      report.push({ key, ...r })
    }
  }

  const label = args.screen ? ` [${args.screen}]` : ''
  console.log(`\nUI-First Gate — property-diff${label}\n`)
  console.log('key'.padEnd(26), 'prop'.padEnd(16), 'code'.padEnd(20), 'design'.padEnd(20), 'verdict')
  console.log('-'.repeat(92))
  for (const r of report) {
    console.log(
      String(r.key).slice(0, 25).padEnd(26),
      String(r.prop).slice(0, 15).padEnd(16),
      String(r.code).slice(0, 19).padEnd(20),
      String(r.design).slice(0, 19).padEnd(20),
      r.ok ? 'PASS' : 'FAIL',
    )
  }
  const verdict = coverageError ? 'ERROR' : failCount ? 'FAIL' : 'PASS'
  console.log('-'.repeat(92))
  console.log(JSON.stringify({ screen: args.screen ?? null, elements: keys.length, checks: report.length, failed: failCount, verdict }, null, 2))
  process.exit(coverageError ? 2 : failCount ? 1 : 0)
}

main()
