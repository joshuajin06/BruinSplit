import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for BruinSplit E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory containing test files
  testDir: './e2e/tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'e2e/playwright-report' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for the frontend
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'cd backend && npm run dev',
      url: 'http://localhost:8080/api/docs',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'cd frontend/bruinsplit && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],

  // Output folder for test artifacts
  outputDir: 'e2e/test-results',

  // Global timeout for each test (240 seconds for complex multi-user tests)
  timeout: 240 * 1000,

  // Timeout for each expect() assertion
  expect: {
    timeout: 10000,
  },
});
