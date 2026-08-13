#!/usr/bin/env node
/**
 * gate-dom-inspect.mjs — DOM inspection pass for /board spotlight gate.
 * Checks what's actually rendered (page structure, data-fig presence,
 * scroll position to spotlight section).
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = '/Users/mai.thanh.dan/Desktop/Sun/AI/aidd'
const BASE_URL = 'http://127.0.0.1:3001'
const STORAGE_STATE = path.join(ROOT, 'e2e/.auth/user.json')
const SS_DIR = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/screenshots')

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    colorScheme: 'light',
  })

  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  // Collect console messages
  const consoleMsgs = []
  page.on('console', msg => consoleMsgs.push({ type: msg.type(), text: msg.text() }))
  page.on('pageerror', err => consoleMsgs.push({ type: 'pageerror', text: err.message }))

  console.log('Navigating to /board...')
  const response = await page.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  console.log('Final URL:', page.url())
  console.log('Response status:', response?.status())

  // Wait longer for hydration + TanStack Query
  await page.waitForTimeout(3000)

  // Check page title and basic structure
  const title = await page.title()
  console.log('Page title:', title)

  // Get all data-fig attributes in DOM
  const allDataFig = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-fig]')
    return Array.from(els).map(el => ({
      value: el.getAttribute('data-fig'),
      tag: el.tagName,
      id: el.id,
      classSnippet: (el.className || '').slice(0, 80),
      text: el.textContent?.slice(0, 40),
    }))
  })
  console.log('\nAll data-fig in DOM:', allDataFig.length)
  allDataFig.forEach(e => console.log('  ', e.value, '|', e.tag, '|', e.text?.replace(/\n/g, ' ')))

  // Check if the spotlight section is in the DOM at all (without data-fig)
  const spotlightByAriaLabel = await page.locator('[aria-label*="Spotlight"]').count()
  console.log('\nSpotlight by aria-label*=Spotlight:', spotlightByAriaLabel)

  const spotlightSection = await page.locator('section').all()
  console.log('Total <section> elements:', spotlightSection.length)
  for (const s of spotlightSection) {
    const label = await s.getAttribute('aria-label')
    const text = (await s.textContent())?.slice(0, 60)
    console.log(' section aria-label:', label, '| text snippet:', text?.replace(/\n/g, ' '))
  }

  // Check if board-spotlight component actually rendered
  const spotlightWordCloud = await page.locator('[aria-label="Word cloud — nhận nhiều kudos"]').count()
  console.log('\nWord cloud container:', spotlightWordCloud)

  const activityLog = await page.locator('[aria-label="Hoạt động gần đây"]').count()
  console.log('Activity log container:', activityLog)

  // Check the h2 "SPOTLIGHT BOARD" heading
  const h2s = await page.locator('h2').all()
  console.log('\nh2 elements:')
  for (const h of h2s) {
    const text = await h.textContent()
    console.log(' ', text?.replace(/\n/g, ' '))
  }

  // Check for auth-related redirect
  const isLogin = page.url().includes('/login')
  console.log('\nIs on login page:', isLogin)

  // Check page body snippet
  const bodySnippet = await page.evaluate(() => document.body.innerHTML.slice(0, 500))
  console.log('\nBody HTML snippet (first 500 chars):\n', bodySnippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))

  // Check for any error states
  const errorText = await page.locator('text=/error|Error|không tìm thấy/i').count()
  console.log('\nError text elements:', errorText)

  // Get the full page height and scroll width
  const pageMetrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
  }))
  console.log('\nPage metrics:', pageMetrics)

  // Screenshot full page to see what's actually rendered
  await page.screenshot({ path: path.join(SS_DIR, 'board-dom-inspect.png'), fullPage: true })
  console.log('\nDOM inspect screenshot saved')

  // Try scrolling to spotlight area and taking another screenshot
  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SS_DIR, 'board-scrolled-to-spotlight.png') })
  console.log('Scrolled screenshot saved')

  // Check console messages
  console.log('\nConsole messages:', consoleMsgs.length)
  consoleMsgs.slice(0, 10).forEach(m => console.log(' ', m.type, ':', m.text?.slice(0, 120)))

  await browser.close()
}

run().catch(e => {
  console.error('INSPECT FAILED:', e)
  process.exit(1)
})
