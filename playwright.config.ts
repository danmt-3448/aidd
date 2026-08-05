import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const authFile = 'e2e/.auth/user.json'
const adminFile = 'e2e/.auth/admin.json'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry locally catches transient Chromium renderer crashes under dev-server load.
  retries: process.env.CI ? 2 : 1,
  // Local: 2 workers avoids Chromium renderer crashes from dev-server overload.
  // CI: 1 worker for determinism.
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  globalSetup: path.resolve(__dirname, './e2e/global-setup.ts'),
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    // ── Public project: NO storageState ──────────────────────────────────────
    // Runs specs that test unauthenticated behavior.
    // Specs: countdown, login.
    {
      name: 'public',
      testMatch: [
        '**/countdown.spec.ts',
        '**/login.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        // explicitly no storageState — browser starts with empty session
      },
    },

    // ── Authed project: regular user storageState ─────────────────────────────
    // Runs specs that require an authenticated session.
    // Specs: board, profile, homepage (authed+admin describe blocks),
    //        root-redirect, awards/rules/secret-box, viet-kudo.
    {
      name: 'authed',
      testMatch: [
        '**/board.spec.ts',
        '**/profile.spec.ts',
        '**/homepage.spec.ts',
        '**/root-redirect.spec.ts',
        '**/awards-rules-secret-box.spec.ts',
        '**/viet-kudo.spec.ts',
        '**/auth-check.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },

    // ── Admin project: admin user storageState ────────────────────────────────
    // Reserved for admin-only specs. Extend testMatch when dedicated files exist.
    {
      name: 'admin',
      testMatch: ['**/admin-*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: adminFile,
      },
    },
  ],

  webServer: undefined, // Tests run against a manually started dev server
})
