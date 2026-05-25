// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Lokalne ziadne retries - chcem vidiet skutocne zlyhanie hned. V CI 2 retries,
  // tam ide o stabilitu bezu a obcasny vypadok demo webu nesmie zhodit pipeline.
  retries: process.env.CI ? 2 : 0,
  // Workers: 1 vsade. Demo web nezvlada paralelnu zataz - pri 2+ workeroch zacne
  // vracat 500/timeouty. Stabilita > rychlost.
  workers: 1,
  timeout: 180_000,
  expect: {
    // Default 5s je na tomto webe niekedy malo.
    timeout: 15_000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://automationteststore.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
