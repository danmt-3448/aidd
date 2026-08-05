import { test, expect, chromium } from '@playwright/test'

test('cookie-diagnostic: verify storageState cookie reaches /board', async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    baseURL: 'http://localhost:3001',
    storageState: 'e2e/.auth/user.json',
  })
  const page = await context.newPage()

  const cookies = await context.cookies('http://localhost:3001')
  console.log('Cookie count:', cookies.length)
  for (const c of cookies) {
    console.log(`  ${c.name} | domain:${c.domain} | path:${c.path}`)
  }

  const response = await page.goto('/board')
  console.log('Status:', response?.status(), '| URL:', page.url())

  expect(response?.status()).toBe(200)
  expect(page.url()).toContain('/board')

  await browser.close()
})
