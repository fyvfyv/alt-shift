import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  // A journey whose checks do not depend on the viewport runs once, on desktop (@desktop); a
  // check of the stacked phone layout runs only on the phone (@phone).
  projects: [
    { name: 'setup', testMatch: /\.setup\.ts$/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grepInvert: /@phone/,
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, hasTouch: true },
      grepInvert: /@desktop/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    // Faster than the dev defaults: holdGeneration keeps the loading state for as long as a check
    // needs, and a letter of about 250 deltas still streams for over two seconds, long enough to
    // see it grow.
    command: `GENERATION_PROVIDER=mock MOCK_DELAY_MS=10 MOCK_FIRST_DELTA_MS=300 pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
