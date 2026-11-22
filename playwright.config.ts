import { defineConfig, devices } from '@playwright/test';

const channel = process.env['PLAYWRIGHT_CHANNEL'] as 'chrome' | 'msedge' | undefined;
const browserUse = channel ? { channel } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    locale: 'fr-FR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...browserUse,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...browserUse } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...browserUse } },
  ],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npm run start -- --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
