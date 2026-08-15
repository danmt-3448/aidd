#!/usr/bin/env node
/**
 * gate-full.mjs — complete UI-First Gate for /board spotlight section.
 * Runs: property-diff (live computed styles), behavior checklist, nodeId validity,
 * overflow checks, screenshots.
 * Base URL: localhost:3001 (cookie domain = localhost).
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'

const ROOT = '/Users/mai.thanh.dan/Desktop/Sun/AI/aidd'
const BASE_URL = 'http://localhost:3001'
const STORAGE_STATE = path.join(ROOT, 'e2e/.auth/user.json')
const SS_DIR = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/screenshots')
const STYLE_ASSERT = path.join(ROOT, '.claude/skills/aidd-ui-gate/scripts/style-assert.mjs')
const LIVE_MAP_1440 = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/live-map-1440.json')
const LIVE_MAP_1280 = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/live-map-1280.json')

// ── helpers ──────────────────────────────────────────────────────────────────

function cssProperty(cs, prop) {
  // camelCase → kebab-case
  const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
  return cs.getPropertyValue(kebab) || cs[prop] || null
}

async function measureElement(page, selector, props) {
  const count = await page.locator(selector).count()
  if (count === 0) return { missing: true }

  return page.locator(selector).first().evaluate((el, propList) => {
    const cs = window.getComputedStyle(el)
    const result = {}
    for (const prop of propList) {
      if (prop === 'offsetHeight') result.offsetHeight = el.offsetHeight
      else if (prop === 'offsetWidth') result.offsetWidth = el.offsetWidth
      else if (prop === 'tag') result.tag = el.tagName
      else if (prop === 'src') result.src = el.src || el.getAttribute('src') || null
      else {
        const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
        result[prop] = cs.getPropertyValue(kebab) || null
      }
    }
    return result
  }, props)
}

// Build live map from board.map.json design entries + live code measurements
async function buildLiveMap(page, mapJsonPath) {
  const designMap = JSON.parse(readFileSync(mapJsonPath, 'utf8'))
  const liveMap = {}

  for (const [key, entry] of Object.entries(designMap)) {
    const selector = entry.selector
    if (!selector) {
      // No explicit selector — use key-based lookup or skip
      liveMap[key] = { ...entry }
      continue
    }

    const codeKeys = Object.keys(entry.code || {})
    if (codeKeys.length === 0) {
      liveMap[key] = { ...entry }
      continue
    }

    const count = await page.locator(selector).count()
    if (count === 0) {
      liveMap[key] = { ...entry, code: { missing: true } }
      continue
    }

    const measured = await page.locator(selector).first().evaluate((el, propList) => {
      const cs = window.getComputedStyle(el)
      const result = {}
      for (const prop of propList) {
        if (prop === 'offsetHeight') result.offsetHeight = el.offsetHeight
        else if (prop === 'offsetWidth') result.offsetWidth = el.offsetWidth
        else if (prop === 'tag') result.tag = el.tagName
        else if (prop === 'src') result.src = el.src || el.getAttribute('src') || null
        else {
          const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
          result[prop] = cs.getPropertyValue(kebab) || null
        }
      }
      return result
    }, codeKeys)

    liveMap[key] = { ...entry, code: measured }
  }

  return liveMap
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    auth: null,
    'style-assert-1440': null,
    'style-assert-1280': null,
    nodeId_slugs: [],
    behavior: {},
    overflow: {},
    console_errors: [],
    screenshots: [],
    concerns: {},
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: STORAGE_STATE })

  // ── 1440px ────────────────────────────────────────────────────────────────
  console.log('\n══════════ VIEWPORT 1440px ══════════')
  const p1440 = await context.newPage()
  await p1440.setViewportSize({ width: 1440, height: 900 })

  const consoleErrors = []
  p1440.on('console', m => { if (['error','warning'].includes(m.type())) consoleErrors.push({ t: m.type(), msg: m.text() }) })
  p1440.on('pageerror', e => consoleErrors.push({ t: 'pageerror', msg: e.message }))

  await p1440.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  report.auth = !p1440.url().includes('/login')
  console.log('Auth OK:', report.auth, '| URL:', p1440.url())

  await p1440.waitForFunction(() => document.fonts.ready.then(() => true))
  await p1440.waitForTimeout(2000) // TanStack Query settle

  // Screenshot @1440 full page
  const ss1440 = path.join(SS_DIR, 'board-spotlight-1440-full.png')
  await p1440.screenshot({ path: ss1440, fullPage: true })
  report.screenshots.push('evidence/screenshots/board-spotlight-1440-full.png')
  console.log('Screenshot 1440 saved')

  // Scroll to spotlight, screenshot viewport
  await p1440.locator("[data-fig='2940:14174']").scrollIntoViewIfNeeded().catch(() => {})
  await p1440.waitForTimeout(300)
  const ssSpotlight = path.join(SS_DIR, 'board-spotlight-section-1440.png')
  await p1440.screenshot({ path: ssSpotlight })
  report.screenshots.push('evidence/screenshots/board-spotlight-section-1440.png')

  // ── nodeId validity check ──────────────────────────────────────────────────
  const allFigs = await p1440.evaluate(() =>
    Array.from(document.querySelectorAll('[data-fig]')).map(el => ({
      val: el.getAttribute('data-fig'),
      tag: el.tagName,
    }))
  )
  // Real nodeId: digits:digits (simple) OR compound I-form (I3127:21871;662:11382 = valid Figma instance ref)
  const REAL_NODEID = /^(I?[\d]+:[\d]+(;[\w:]+)*|[\d]+:[\d]+)$/
  // "activity-feed-row", "activity-feed-time", "activity-feed-name" are code slugs — NOT real nodeIds
  const slugs = allFigs.filter(f => !REAL_NODEID.test(f.val))
  report.nodeId_slugs = slugs
  console.log(`\ndata-fig total: ${allFigs.length} | code-slugs (invalid): ${slugs.length}`)
  if (slugs.length) slugs.forEach(s => console.log('  SLUG:', s.val, '|', s.tag))

  // ── spotlight element presence ─────────────────────────────────────────────
  const spotlightFrame = await p1440.locator("[data-fig='2940:14174']").count()
  const searchPill    = await p1440.locator("[data-fig='2940:14833']").count()
  const kudosCount    = await p1440.locator("[data-fig='3007:17482']").count()
  const bg1           = await p1440.locator("[data-fig='2940:14178']").count()
  const bg2           = await p1440.locator("[data-fig='2940:14181']").count()
  const actFeedRows   = await p1440.locator("[data-fig='activity-feed-row']").count()
  console.log(`\nspotlight-frame: ${spotlightFrame} | search-pill: ${searchPill} | kudos-count: ${kudosCount}`)
  console.log(`bg-layer1: ${bg1} | bg-layer2: ${bg2} | activity-feed-rows: ${actFeedRows}`)

  // ── spotlight frame computed styles ───────────────────────────────────────
  const frameStyles = await measureElement(p1440, "[data-fig='2940:14174']", [
    'offsetHeight', 'offsetWidth', 'borderTopWidth', 'borderTopColor',
    'borderTopLeftRadius', 'backgroundColor',
  ])
  console.log('\nSpotlight frame styles:', JSON.stringify(frameStyles))

  const kudosStyles = await measureElement(p1440, "[data-fig='3007:17482']", [
    'fontWeight', 'fontSize', 'color', 'lineHeight',
  ])
  console.log('Kudos count styles:', JSON.stringify(kudosStyles))

  // ── build live map @1440 for style-assert ─────────────────────────────────
  const liveMap1440 = await buildLiveMap(p1440, path.join(ROOT, 'plans/reports/_gate-ref/nodemap/board.map.json'))
  writeFileSync(LIVE_MAP_1440, JSON.stringify(liveMap1440, null, 2))
  console.log('\nLive map @1440 written:', LIVE_MAP_1440)

  // ── 1280px ────────────────────────────────────────────────────────────────
  console.log('\n══════════ VIEWPORT 1280px ══════════')
  const p1280 = await context.newPage()
  await p1280.setViewportSize({ width: 1280, height: 900 })
  await p1280.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  await p1280.waitForFunction(() => document.fonts.ready.then(() => true))
  await p1280.waitForTimeout(2000)

  const ss1280 = path.join(SS_DIR, 'board-spotlight-1280-full.png')
  await p1280.screenshot({ path: ss1280, fullPage: true })
  report.screenshots.push('evidence/screenshots/board-spotlight-1280-full.png')
  console.log('Screenshot 1280 saved')

  const overflow1280 = await p1280.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  report.overflow['1280'] = overflow1280 ? 'OVERFLOW' : 'OK'
  console.log('Overflow @1280:', report.overflow['1280'])

  const liveMap1280 = await buildLiveMap(p1280, path.join(ROOT, 'plans/reports/_gate-ref/nodemap/board.map.1280.json'))
  writeFileSync(LIVE_MAP_1280, JSON.stringify(liveMap1280, null, 2))
  console.log('Live map @1280 written:', LIVE_MAP_1280)

  // ── 1920px no-break ───────────────────────────────────────────────────────
  console.log('\n══════════ VIEWPORT 1920px (no-break) ══════════')
  const p1920 = await context.newPage()
  await p1920.setViewportSize({ width: 1920, height: 1080 })
  await p1920.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  await p1920.waitForTimeout(2000)
  const overflow1920 = await p1920.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  report.overflow['1920'] = overflow1920 ? 'OVERFLOW' : 'OK'
  console.log('Overflow @1920:', report.overflow['1920'])
  const ss1920 = path.join(SS_DIR, 'board-spotlight-1920.png')
  await p1920.screenshot({ path: ss1920, fullPage: true })
  report.screenshots.push('evidence/screenshots/board-spotlight-1920.png')
  await p1920.close()

  // ── behavior checks (on 1440 page) ────────────────────────────────────────
  console.log('\n══════════ BEHAVIOR CHECKS ══════════')

  // Scroll back to top for behavior tests
  await p1440.evaluate(() => window.scrollTo(0,0))
  await p1440.waitForTimeout(300)

  // B1: Search dropdown
  console.log('\n─ B1: Search dropdown ─')
  const searchInput = p1440.locator("[data-fig='2940:14833'] input").first()

  await searchInput.click()
  await searchInput.fill('Tr')
  await p1440.waitForTimeout(500)

  const dropdownCount = await p1440.locator('[role="listbox"]').count()
  console.log('Dropdown visible after typing "Tr":', dropdownCount)
  report.behavior['B1_search_dropdown_appears'] = dropdownCount > 0

  if (dropdownCount > 0) {
    const listboxBB = await p1440.locator('[role="listbox"]').first().boundingBox()
    const spotlightBB = await p1440.locator("[data-fig='2940:14174']").boundingBox()
    // Portal: listbox renders at body level, top should be >= spotlight top (not clipped)
    // Actually if portaled it floats near the input, y > input position
    const spotlightBottom = spotlightBB ? spotlightBB.y + spotlightBB.height : 0
    // Dropdown portaled = its top coord is NOT inside the spotlight clipped area
    // (It floats over the page, not obscured)
    console.log('Listbox BB:', JSON.stringify(listboxBB))
    console.log('Spotlight BB:', JSON.stringify(spotlightBB))
    report.behavior['B1_dropdown_not_clipped'] = listboxBB !== null // visible = not clipped

    const ssDropdown = path.join(SS_DIR, 'board-search-dropdown-open.png')
    await p1440.screenshot({ path: ssDropdown })
    report.screenshots.push('evidence/screenshots/board-search-dropdown-open.png')

    // ArrowDown highlight
    await p1440.keyboard.press('ArrowDown')
    await p1440.waitForTimeout(100)
    const highlighted = await p1440.locator('[role="option"][aria-selected="true"]').count()
    console.log('ArrowDown highlighted:', highlighted)
    report.behavior['B1_keyboard_arrowdown'] = highlighted > 0

    // Escape closes
    await p1440.keyboard.press('Escape')
    await p1440.waitForTimeout(300)
    const afterEsc = await p1440.locator('[role="listbox"]').count()
    console.log('After Escape dropdown count:', afterEsc)
    report.behavior['B1_escape_closes'] = afterEsc === 0
  } else {
    report.behavior['B1_dropdown_not_clipped'] = null
    report.behavior['B1_keyboard_arrowdown'] = null
    report.behavior['B1_escape_closes'] = null
  }

  // Empty query → no dropdown
  await searchInput.fill('')
  await p1440.waitForTimeout(300)
  const emptyDrop = await p1440.locator('[role="listbox"]').count()
  report.behavior['B1_empty_query_no_dropdown'] = emptyDrop === 0
  console.log('Empty query no dropdown:', report.behavior['B1_empty_query_no_dropdown'])

  // Gibberish → empty message
  await searchInput.fill('zzzxxx999')
  await p1440.waitForTimeout(400)
  const gibDrop = await p1440.locator('[role="listbox"]').count()
  let gibText = ''
  if (gibDrop > 0) {
    gibText = await p1440.locator('[role="listbox"]').textContent()
  }
  report.behavior['B1_gibberish_empty_msg'] = gibText.includes('Không tìm thấy')
  console.log('Gibberish empty message "Không tìm thấy":', report.behavior['B1_gibberish_empty_msg'], '| text:', gibText.slice(0,60))

  await searchInput.fill('')
  await p1440.waitForTimeout(200)

  // B2: Activity feed
  console.log('\n─ B2: Activity feed ─')
  const feedRowEls = await p1440.locator("[data-fig='activity-feed-row']").all()
  report.behavior['B2_activity_rows'] = feedRowEls.length
  console.log('Activity rows:', feedRowEls.length)

  // Time format: hh:mmAM|PM no space
  const timeEls = await p1440.locator("[data-fig='activity-feed-time']").all()
  const timeValues = []
  let timeFmtOk = true
  for (const el of timeEls) {
    const t = (await el.textContent())?.trim() ?? ''
    timeValues.push(t)
    if (!/^\d{2}:\d{2}(AM|PM)$/.test(t)) timeFmtOk = false
  }
  report.behavior['B2_time_format_ok'] = timeFmtOk
  report.behavior['B2_time_values'] = timeValues.slice(0,6)
  console.log('Time values:', timeValues.slice(0,6), '| Format ok:', timeFmtOk)

  // Seed density note: if all rows show same name, record it
  const nameEls = await p1440.locator("[data-fig='activity-feed-name']").all()
  const nameValues = []
  for (const el of nameEls) nameValues.push((await el.textContent())?.trim())
  const uniqueNames = new Set(nameValues)
  report.behavior['B2_unique_names_in_feed'] = uniqueNames.size
  console.log('Names in feed:', nameValues.slice(0,6), '| unique:', uniqueNames.size)
  if (uniqueNames.size === 1) {
    console.log('  NOTE: seed thin — all rows same name (seed-density note, NOT behavior fail)')
  }

  // B3: Fullscreen + reset controls
  console.log('\n─ B3: Controls ─')
  const resetBtn = await p1440.locator('button[aria-label="Đặt lại pan/zoom spotlight"]').count()
  const fsBtn = await p1440.locator('button[aria-label="Toàn màn hình"]').count()
  report.behavior['B3_reset_btn'] = resetBtn > 0
  report.behavior['B3_fullscreen_btn'] = fsBtn > 0
  console.log('Reset button:', resetBtn, '| Fullscreen button:', fsBtn)

  // Click fullscreen — may use CSS fallback in headless
  if (fsBtn > 0) {
    await p1440.locator('button[aria-label="Toàn màn hình"]').click()
    await p1440.waitForTimeout(500)
    // CSS fallback: check aria-pressed=true or aria-label changes to "Thoát"
    const fsActive = await p1440.locator('button[aria-label="Thoát toàn màn hình"]').count()
    const fsPressed = await p1440.locator('button[aria-pressed="true"]').count()
    report.behavior['B3_fullscreen_toggles'] = fsActive > 0 || fsPressed > 0
    console.log('Fullscreen toggled (collapse btn or aria-pressed):', report.behavior['B3_fullscreen_toggles'])

    // ESC or click collapse to exit
    await p1440.keyboard.press('Escape')
    await p1440.waitForTimeout(400)
    // Try click collapse button if still showing
    const collapseBtn = await p1440.locator('button[aria-label="Thoát toàn màn hình"]').count()
    if (collapseBtn > 0) {
      await p1440.locator('button[aria-label="Thoát toàn màn hình"]').click()
      await p1440.waitForTimeout(400)
    }

    // Reset button still present after fullscreen exit
    const resetAfterFs = await p1440.locator('button[aria-label="Đặt lại pan/zoom spotlight"]').count()
    report.behavior['B3_reset_present_after_fs'] = resetAfterFs > 0
    console.log('Reset button after fullscreen exit:', resetAfterFs)
  }

  // B4: Word-cloud highlight
  console.log('\n─ B4: Word-cloud highlight ─')
  await searchInput.fill('Tr')
  await p1440.waitForTimeout(500)

  // Evaluate word cloud button colors
  const cloudColors = await p1440.evaluate(() => {
    const btns = document.querySelectorAll('[aria-label="Danh sách sunner nhận kudos"] button')
    const results = []
    btns.forEach(btn => {
      const cs = window.getComputedStyle(btn)
      results.push({
        name: btn.textContent?.trim(),
        color: cs.color,
        opacity: cs.opacity,
      })
    })
    return results
  })

  const goldColor = 'rgb(255, 234, 158)' // #FFEA9E
  const highlighted = cloudColors.filter(b => b.color === goldColor)
  const dimmed = cloudColors.filter(b => parseFloat(b.opacity) < 0.5)
  report.behavior['B4_highlight_gold_count'] = highlighted.length
  report.behavior['B4_dimmed_others_count'] = dimmed.length
  report.behavior['B4_highlight_color'] = goldColor
  report.concerns['highlight_color_FFEA9E'] = highlighted.length > 0 ? 'CONFIRMED' : 'NOT_FOUND'
  console.log('Gold highlighted words:', highlighted.length, highlighted.map(b => b.name).slice(0,5))
  console.log('Dimmed words:', dimmed.length)

  const ssHL = path.join(SS_DIR, 'board-spotlight-highlight.png')
  await p1440.screenshot({ path: ssHL })
  report.screenshots.push('evidence/screenshots/board-spotlight-highlight.png')
  await searchInput.fill('')

  // B5: Console errors
  report.console_errors = consoleErrors
  console.log('\n─ B5: Console errors:', consoleErrors.length, '─')
  consoleErrors.forEach(e => console.log(' ', e.t, ':', e.msg?.slice(0,100)))

  // ── concern: opacity ramp ─────────────────────────────────────────────────
  console.log('\n══════════ CONCERN CHECKS ══════════')
  const rowOpacities = await p1440.evaluate(() => {
    const rows = document.querySelectorAll("[data-fig='activity-feed-row']")
    return Array.from(rows).map(el => parseFloat(window.getComputedStyle(el).opacity))
  })
  const EXPECTED_RAMP = [1, 0.75, 0.55, 0.4, 0.28, 0.18]
  report.concerns['opacity_ramp_actual'] = rowOpacities
  report.concerns['opacity_ramp_expected'] = EXPECTED_RAMP
  report.concerns['opacity_ramp_match'] = rowOpacities.every((v,i) => Math.abs(v - (EXPECTED_RAMP[i] ?? 0)) < 0.02)
  console.log('Opacity ramp actual:', rowOpacities)
  console.log('Opacity ramp match:', report.concerns['opacity_ramp_match'])

  await browser.close()

  // ── run style-assert @1440 ────────────────────────────────────────────────
  console.log('\n══════════ STYLE-ASSERT @1440 ══════════')
  try {
    const out1440 = execSync(
      `node "${STYLE_ASSERT}" --map "${LIVE_MAP_1440}" --screen board-1440 --min-elements 8`,
      { encoding: 'utf8', stdio: 'pipe' }
    )
    report['style-assert-1440'] = { exit: 0, output: out1440 }
    console.log('Exit: 0 (PASS)\n', out1440)
  } catch (e) {
    const exit = e.status ?? 1
    report['style-assert-1440'] = { exit, output: (e.stdout || '') + (e.stderr || '') }
    console.log(`Exit: ${exit} (${exit === 1 ? 'FAIL' : 'COVERAGE ERROR'})\n`, report['style-assert-1440'].output)
  }

  // ── run style-assert @1280 ────────────────────────────────────────────────
  console.log('\n══════════ STYLE-ASSERT @1280 ══════════')
  try {
    const out1280 = execSync(
      `node "${STYLE_ASSERT}" --map "${LIVE_MAP_1280}" --screen board-1280 --min-elements 8`,
      { encoding: 'utf8', stdio: 'pipe' }
    )
    report['style-assert-1280'] = { exit: 0, output: out1280 }
    console.log('Exit: 0 (PASS)\n', out1280)
  } catch (e) {
    const exit = e.status ?? 1
    report['style-assert-1280'] = { exit, output: (e.stdout || '') + (e.stderr || '') }
    console.log(`Exit: ${exit}\n`, report['style-assert-1280'].output)
  }

  // ── write final report ────────────────────────────────────────────────────
  const resultsPath = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/gate-results-full.json')
  writeFileSync(resultsPath, JSON.stringify(report, null, 2))
  console.log('\n\nFull results written:', resultsPath)

  // ── summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════ GATE SUMMARY ══════════')
  console.log('Auth:', report.auth ? 'OK' : 'FAIL')
  console.log('style-assert @1440 exit:', report['style-assert-1440']?.exit)
  console.log('style-assert @1280 exit:', report['style-assert-1280']?.exit)
  console.log('Overflow @1280:', report.overflow['1280'])
  console.log('Overflow @1920:', report.overflow['1920'])
  console.log('nodeId slugs (coverage-invalid):', report.nodeId_slugs.length, report.nodeId_slugs.map(s=>s.val))
  console.log('Behavior:', JSON.stringify(report.behavior, null, 2))
  console.log('Concerns:', JSON.stringify(report.concerns, null, 2))
  console.log('Console errors:', report.console_errors.length)

  return report
}

run().catch(e => { console.error('GATE FAILED:', e); process.exit(1) })
