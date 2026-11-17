import { defineConfig, devices } from '@playwright/test'

// Locally use the installed Google Chrome so no browser download is needed.
// CI installs Playwright's Chromium (`npx playwright install chromium`) instead.
const channel =
  (process.env.PLAYWRIGHT_CHANNEL as 'chrome' | 'msedge' | undefined) ??
  (process.env.CI ? undefined : 'chrome')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    ...(channel ? { channel } : {}),
  },
  webServer: [
    {
      command: 'npm run start',
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { API_PORT: '3001' },
    },
    {
      command: 'npm run dev:web -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
