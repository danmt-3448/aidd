#!/usr/bin/env node
/**
 * gate-auth-check.mjs — verify auth cookie works at localhost:3001
 * and confirm /board renders (not redirect to /login).
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = '/Users/mai.thanh.dan/Desktop/Sun/AI/aidd'
// Use localhost not 127.0.0.1 — cookie domain is 'localhost'
const BASE_URL = 'http://localhost:3001'
const STORAGE_STATE = path.join(ROOT, 'e2e/.auth/user.json')
const SS_DIR = path.join(ROOT, 'plans/260812-1355-spotlight-board/reports/evidence/screenshots')

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
  })

  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  const consoleMsgs = []
  page.on('console', msg => {
    if (['error','warning'].includes(msg.type())) consoleMsgs.push({ type: msg.type(), text: msg.text() })
  })
  page.on('pageerror', err => consoleMsgs.push({ type: 'pageerror', text: err.message }))

  console.log('Navigating to', BASE_URL + '/board ...')
  await page.goto(BASE_URL + '/board', { waitUntil: 'networkidle', timeout: 30000 })
  console.log('Final URL:', page.url())
  console.log('Is login:', page.url().includes('/login'))

  // Wait for hydration
  await page.waitForTimeout(3000)

  const allDataFig = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-fig]')).map(el => ({
      val: el.getAttribute('data-fig'),
      tag: el.tagName,
      txt: el.textContent?.slice(0,40).replace(/\n/g,' '),
    }))
  })
  console.log('\ndata-fig elements:', allDataFig.length)
  allDataFig.forEach(e => console.log(' ', e.val, '|', e.tag, '|', e.txt))

  // Spotlight specific
  const spotlightFrame = await page.locator("[data-fig='2940:14174']").count()
  const searchPill = await page.locator("[data-fig='2940:14833']").count()
  const kudosCount = await page.locator("[data-fig='3007:17482']").count()
  console.log('\nspotlight-frame:', spotlightFrame)
  console.log('search-pill:', searchPill)
  console.log('kudos-count:', kudosCount)

  // Check h2s
  const h2texts = await page.locator('h2').allTextContents()
  console.log('\nh2 elements:', h2texts.map(t => t.slice(0,60)))

  await page.screenshot({ path: path.join(SS_DIR, 'board-auth-check-1440.png'), fullPage: true })
  console.log('Screenshot saved')

  console.log('\nConsole errors:', consoleMsgs.length)
  consoleMsgs.forEach(m => console.log(' ', m.type, ':', m.text?.slice(0,100)))

  await browser.close()
}

run().catch(e => { console.error('FAILED:', e); process.exit(1) })
