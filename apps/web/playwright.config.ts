import { defineConfig, devices } from '@playwright/test'

/**
 * E2E smoke tests (LAUNCH_REHEARSAL.md §1 subset automatable without
 * credentials). Run against a locally built production server:
 *
 *   npm run build && npm run start     # terminal 1
 *   npx playwright test                # terminal 2
 *
 * Or point BASE_URL at a deployed environment.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  // Auto-start the production server when none is running at baseURL.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
