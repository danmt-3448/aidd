/**
 * Diagnostic: verify storageState cookies reach protected routes.
 * Delete this file once auth harness is confirmed working.
 */
import { test, expect } from '@playwright/test'

test('auth-check: /board accessible with storageState', async ({ page, context }) => {
  const cookies = await context.cookies('http://localhost:3000')
  console.log('Cookies in context:', cookies.map(c => `${c.name}@${c.domain}`).join(', '))

  const response = await page.goto('/board')
  console.log('Status:', response?.status(), 'URL:', page.url())

  // If auth cookie is present and valid, /board returns 200
  expect(response?.status()).toBe(200)
  expect(page.url()).toContain('/board')
})
