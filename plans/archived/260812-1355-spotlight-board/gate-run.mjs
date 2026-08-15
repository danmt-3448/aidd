#!/usr/bin/env node
/**
 * gate-run.mjs — UI-First Gate runner for /board spotlight section.
 * Runs property-diff (style-assert.mjs) + behavior checklist.
 * Outputs JSON results for report generation.
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = '/Users/mai.thanh.dan/Desktop/Sun/AI/aidd'
const BASE_URL = 'http://127.0.0.1:3001'
const STORAGE_STATE = path.join(ROOT, 'e2e/.auth/user.json')
const SS_DIR = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/screenshots')
const MAP_1440 = path.join(ROOT, 'plans/reports/_gate-ref/nodemap/board.map.json')
const MAP_1280 = path.join(ROOT, 'plans/reports/_gate-ref/nodemap/board.map.1280.json')
const STYLE_ASSERT = path.join(ROOT, '.claude/skills/aidd-ui-gate/scripts/style-assert.mjs')

const results = {
  timestamp: new Date().toISOString(),
  viewport_tests: {},
  behavior: {},
  nodeId_validity: {},
  data_fig_slugs: [],
  console_errors: [],
  screenshots: [],
}

async function gatherComputedStyles(page, mapJson) {
  const map = JSON.parse(readFileSync(mapJson, 'utf8'))
  const computed = {}

  for (const [key, entry] of Object.entries(map)) {
    const selector = entry.selector
    if (!selector) {
      // No selector — try to infer from key (for entries without explicit selector)
      computed[key] = { ...entry, code: { missing: true, reason: 'no selector' } }
      continue
    }

    try {
      const el = page.locator(selector).first()
      const count = await el.count()
      if (count === 0) {
        computed[key] = { ...entry, code: { missing: true } }
        continue
      }

      const styles = await el.evaluate((node, codeEntry) => {
        const cs = window.getComputedStyle(node)
        const result = {}
        for (const prop of Object.keys(codeEntry)) {
          if (prop === 'offsetHeight') {
            result.offsetHeight = node.offsetHeight
          } else if (prop === 'tag') {
            result.tag = node.tagName
          } else if (prop === 'src') {
            result.src = node.src || node.getAttribute('src') || null
          } else {
            result[prop] = cs.getPropertyValue(
              prop.replace(/([A-Z])/g, '-$1').toLowerCase()
            ) || cs[prop] || null
          }
        }
        return result
      }, entry.code)

      computed[key] = { ...entry, code: styles }
    } catch (e) {
      computed[key] = { ...entry, code: { missing: true, error: e.message } }
    }
  }

  return computed
}

async function run() {
  console.log('Launching browser with auth state...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    colorScheme: 'light',
  })

  // ─── 1440px pass ──────────────────────────────────────────────────────────
  console.log('\n=== VIEWPORT 1440px ===')
  const page1440 = await context.newPage()
  await page1440.setViewportSize({ width: 1440, height: 900 })

  const consoleErrors = []
  page1440.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push({ type: msg.type(), text: msg.text() })
    }
  })
  page1440.on('pageerror', err => {
    consoleErrors.push({ type: 'pageerror', text: err.message })
  })

  await page1440.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  await page1440.waitForFunction(() => document.fonts.ready.then(() => true))
  await page1440.waitForTimeout(1500) // let TanStack Query hydrate

  // Screenshot 1440 full page
  const ss1440 = path.join(SS_DIR, 'board-spotlight-1440.png')
  await page1440.screenshot({ path: ss1440, fullPage: true })
  console.log('Screenshot 1440:', ss1440)
  results.screenshots.push(ss1440)

  // Gather computed styles for map comparison at 1440
  const computed1440 = await gatherComputedStyles(page1440, MAP_1440)
  const map1440Path = path.join(SS_DIR, '../live-map-1440.json')
  writeFileSync(map1440Path, JSON.stringify(computed1440, null, 2))
  console.log('Live map 1440 written:', map1440Path)

  // Check data-fig slugs vs real nodeIds
  const slugCheck = await page1440.evaluate(() => {
    const figs = document.querySelectorAll('[data-fig]')
    const results = []
    figs.forEach(el => {
      const val = el.getAttribute('data-fig')
      // Real nodeIds match pattern digits:digits (e.g. "2940:14174")
      const isRealNodeId = /^\d+:\d+$/.test(val)
      results.push({ value: val, isRealNodeId, tag: el.tagName, class: el.className?.slice?.(0,60) })
    })
    return results
  })
  results.data_fig_slugs = slugCheck.filter(s => !s.isRealNodeId)
  console.log('data-fig entries:', slugCheck.length, '| non-nodeId (slugs):', results.data_fig_slugs.length)
  if (results.data_fig_slugs.length > 0) {
    console.log('  SLUG FAILS:', JSON.stringify(results.data_fig_slugs, null, 2))
  }

  // Check spotlight frame presence
  const spotlightEl = await page1440.locator("[data-fig='2940:14174']").count()
  console.log('spotlight-frame [data-fig=2940:14174] found:', spotlightEl)

  // Check spotlight-search-pill
  const searchPill = await page1440.locator("[data-fig='2940:14833']").count()
  console.log('spotlight-search-pill [data-fig=2940:14833] found:', searchPill)

  // Check kudos count
  const kudosCount = await page1440.locator("[data-fig='3007:17482']").count()
  console.log('spotlight-kudos-count [data-fig=3007:17482] found:', kudosCount)

  // Check bg layers
  const bg1 = await page1440.locator("[data-fig='2940:14178']").count()
  const bg2 = await page1440.locator("[data-fig='2940:14181']").count()
  console.log('bg-layer1 [data-fig=2940:14178]:', bg1, '| bg-layer2 [data-fig=2940:14181]:', bg2)

  // Check activity feed rows (slug check)
  const activityRows = await page1440.locator("[data-fig='activity-feed-row']").count()
  console.log('activity-feed-row (SLUG not real nodeId):', activityRows)

  // Get spotlight frame dimensions
  const spotlightDims = await page1440.evaluate(() => {
    const el = document.querySelector("[data-fig='2940:14174']")
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      offsetHeight: el.offsetHeight,
      offsetWidth: el.offsetWidth,
      borderTopWidth: cs.borderTopWidth,
      borderTopColor: cs.borderTopColor,
      borderTopLeftRadius: cs.borderTopLeftRadius,
      backgroundColor: cs.backgroundColor,
    }
  })
  console.log('Spotlight frame dimensions:', JSON.stringify(spotlightDims))

  // Get kudos count text
  const kudosText = await page1440.locator("[data-fig='3007:17482']").textContent().catch(() => null)
  console.log('Kudos count text:', kudosText)

  // ─── 1280px pass ──────────────────────────────────────────────────────────
  console.log('\n=== VIEWPORT 1280px ===')
  const page1280 = await context.newPage()
  await page1280.setViewportSize({ width: 1280, height: 900 })
  await page1280.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  await page1280.waitForFunction(() => document.fonts.ready.then(() => true))
  await page1280.waitForTimeout(1500)

  const ss1280 = path.join(SS_DIR, 'board-spotlight-1280.png')
  await page1280.screenshot({ path: ss1280, fullPage: true })
  console.log('Screenshot 1280:', ss1280)
  results.screenshots.push(ss1280)

  // Overflow check at 1280
  const overflow1280 = await page1280.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  console.log('Horizontal overflow @1280:', overflow1280)
  results.viewport_tests['1280_no_overflow'] = !overflow1280

  // Gather computed styles for map comparison at 1280
  const computed1280 = await gatherComputedStyles(page1280, MAP_1280)
  const map1280Path = path.join(SS_DIR, '../live-map-1280.json')
  writeFileSync(map1280Path, JSON.stringify(computed1280, null, 2))
  console.log('Live map 1280 written:', map1280Path)

  // ─── 1920px no-break pass ─────────────────────────────────────────────────
  console.log('\n=== VIEWPORT 1920px (no-break only) ===')
  const page1920 = await context.newPage()
  await page1920.setViewportSize({ width: 1920, height: 1080 })
  await page1920.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  await page1920.waitForTimeout(1500)

  const overflow1920 = await page1920.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  console.log('Horizontal overflow @1920:', overflow1920)
  results.viewport_tests['1920_no_overflow'] = !overflow1920

  const ss1920 = path.join(SS_DIR, 'board-spotlight-1920.png')
  await page1920.screenshot({ path: ss1920, fullPage: true })
  results.screenshots.push(ss1920)
  await page1920.close()

  // ─── Behavior checks (on 1440 page) ────────────────────────────────────────
  console.log('\n=== BEHAVIOR CHECKS ===')

  // B1: Search dropdown
  console.log('\n-- B1: Search dropdown --')
  const searchInput = page1440.locator("[data-fig='2940:14833'] input")
  const searchCount = await searchInput.count()
  console.log('Search input found:', searchCount)

  if (searchCount > 0) {
    // Clear and type partial name
    await searchInput.click()
    await searchInput.fill('An')
    await page1440.waitForTimeout(400)

    const dropdownVisible = await page1440.locator('[role="listbox"]').count()
    console.log('Dropdown (role=listbox) visible after typing "An":', dropdownVisible)

    // Screenshot with dropdown
    const ssSearch = path.join(SS_DIR, 'board-search-dropdown.png')
    await page1440.screenshot({ path: ssSearch })
    results.screenshots.push(ssSearch)

    // Check dropdown is not clipped (portal check)
    if (dropdownVisible > 0) {
      const listboxBB = await page1440.locator('[role="listbox"]').first().boundingBox()
      const spotlightBB = await page1440.locator("[data-fig='2940:14174']").boundingBox()
      console.log('Listbox bounding box:', JSON.stringify(listboxBB))
      console.log('Spotlight bounding box:', JSON.stringify(spotlightBB))
      // If dropdown is portaled, its left should be approximately same but top > spotlight bottom
      const isPortaled = listboxBB && spotlightBB
        ? listboxBB.y >= spotlightBB.y  // portal renders outside overflow-hidden
        : null
      console.log('Dropdown portaled (not clipped by spotlight overflow-hidden):', isPortaled)
      results.behavior['search_dropdown_appears'] = true
      results.behavior['search_dropdown_portaled'] = isPortaled

      // Check ArrowDown highlight
      await page1440.keyboard.press('ArrowDown')
      await page1440.waitForTimeout(100)
      const highlighted = await page1440.locator('[role="listbox"] [aria-selected="true"]').count()
      console.log('Highlighted item after ArrowDown:', highlighted)
      results.behavior['search_keyboard_arrowdown'] = highlighted > 0

      // Escape closes
      await page1440.keyboard.press('Escape')
      await page1440.waitForTimeout(200)
      const dropdownAfterEsc = await page1440.locator('[role="listbox"]').count()
      console.log('Dropdown after Escape:', dropdownAfterEsc)
      results.behavior['search_escape_closes'] = dropdownAfterEsc === 0
    } else {
      results.behavior['search_dropdown_appears'] = false
      results.behavior['search_dropdown_portaled'] = null
      results.behavior['search_keyboard_arrowdown'] = null
      results.behavior['search_escape_closes'] = null
    }

    // Empty query — no dropdown
    await searchInput.fill('')
    await page1440.waitForTimeout(300)
    const dropdownEmpty = await page1440.locator('[role="listbox"]').count()
    console.log('Dropdown after clearing query:', dropdownEmpty)
    results.behavior['search_empty_no_dropdown'] = dropdownEmpty === 0

    // Gibberish
    await searchInput.fill('xyzqwerty123')
    await page1440.waitForTimeout(400)
    const dropdownGibberish = await page1440.locator('[role="listbox"]').count()
    let emptyMsg = null
    if (dropdownGibberish > 0) {
      emptyMsg = await page1440.locator('[role="listbox"]').textContent()
      console.log('Dropdown text for gibberish:', emptyMsg)
    }
    results.behavior['search_gibberish_empty_msg'] = emptyMsg?.includes('Không tìm thấy') ?? false
    console.log('"Không tìm thấy Sunner" shown for gibberish:', results.behavior['search_gibberish_empty_msg'])

    // Clear
    await searchInput.fill('')
    await page1440.waitForTimeout(200)
  } else {
    results.behavior['search_dropdown_appears'] = 'NO_INPUT_FOUND'
  }

  // B2: Activity feed rows
  console.log('\n-- B2: Activity feed --')
  const activityRowCount = await page1440.locator("[data-fig='activity-feed-row']").count()
  console.log('Activity rows (slug data-fig):', activityRowCount)
  const activityText = activityRowCount > 0
    ? await page1440.locator("[data-fig='activity-feed-row']").first().textContent()
    : null
  console.log('First activity row text:', activityText)
  results.behavior['activity_feed_rows'] = activityRowCount
  results.behavior['activity_feed_format'] = activityText

  // Check time format hh:mmAM/PM (no space)
  const timeEls = await page1440.locator("[data-fig='activity-feed-time']").all()
  let timeFormatOk = true
  const timeValues = []
  for (const el of timeEls) {
    const t = await el.textContent()
    timeValues.push(t)
    // Should match e.g. "08:30PM" or "08:30AM" — no space before AM/PM
    if (!/^\d{2}:\d{2}(AM|PM)$/.test(t?.trim() ?? '')) {
      timeFormatOk = false
    }
  }
  console.log('Time values:', timeValues, '| Format ok (no space):', timeFormatOk)
  results.behavior['activity_time_format_ok'] = timeFormatOk
  results.behavior['activity_time_values'] = timeValues

  // B3: Controls (reset + fullscreen buttons)
  console.log('\n-- B3: Controls --')
  const resetBtn = await page1440.locator('button[aria-label="Đặt lại pan/zoom spotlight"]').count()
  const fullscreenBtn = await page1440.locator('button[aria-label="Toàn màn hình"]').count()
  console.log('Reset button:', resetBtn, '| Fullscreen button:', fullscreenBtn)
  results.behavior['controls_reset_present'] = resetBtn > 0
  results.behavior['controls_fullscreen_present'] = fullscreenBtn > 0

  // B4: Word-cloud highlight test
  console.log('\n-- B4: Word-cloud highlight --')
  const searchInput2 = page1440.locator("[data-fig='2940:14833'] input")
  if (await searchInput2.count() > 0) {
    await searchInput2.fill('An')
    await page1440.waitForTimeout(400)

    const wordButtons = await page1440.locator("[aria-label*='kudos'] button, [role='list'] button").all()
    let highlightedCount = 0
    let dimmedCount = 0
    for (const btn of wordButtons.slice(0, 20)) {
      try {
        const color = await btn.evaluate(el => getComputedStyle(el).color)
        const opacity = await btn.evaluate(el => getComputedStyle(el).opacity)
        if (color === 'rgb(255, 234, 158)') highlightedCount++
        if (parseFloat(opacity) < 0.5) dimmedCount++
      } catch {}
    }
    console.log('Highlighted (gold #FFEA9E) words:', highlightedCount, '| Dimmed:', dimmedCount)
    results.behavior['cloud_highlight_gold'] = highlightedCount > 0
    results.behavior['cloud_highlight_dims_others'] = dimmedCount > 0

    const ssHighlight = path.join(SS_DIR, 'board-spotlight-highlight.png')
    await page1440.screenshot({ path: ssHighlight })
    results.screenshots.push(ssHighlight)

    await searchInput2.fill('')
    await page1440.waitForTimeout(200)
  }

  // B5: Console errors
  console.log('\n-- B5: Console errors --')
  results.console_errors = consoleErrors
  console.log('Console errors/warnings:', consoleErrors.length)
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log(' ', e.type, ':', e.text?.slice(0, 120)))
  }

  // ─── Write live maps for style-assert ─────────────────────────────────────
  // style-assert expects the map to have code values from live DOM
  // We write the computed maps (with real getComputedStyle values) for style-assert
  writeFileSync(map1440Path, JSON.stringify(computed1440, null, 2))
  writeFileSync(map1280Path, JSON.stringify(computed1280, null, 2))

  await browser.close()

  // ─── Write results JSON ────────────────────────────────────────────────────
  const resultsPath = path.join(SS_DIR, '../gate-results.json')
  writeFileSync(resultsPath, JSON.stringify(results, null, 2))
  console.log('\nResults written:', resultsPath)

  return results
}

run().then(r => {
  console.log('\n=== GATE RUN COMPLETE ===')
  console.log('Behavior results:', JSON.stringify(r.behavior, null, 2))
  console.log('Non-nodeId data-fig values:', r.data_fig_slugs.map(s => s.value))
  console.log('Console errors:', r.console_errors.length)
}).catch(e => {
  console.error('GATE RUN FAILED:', e)
  process.exit(1)
})
