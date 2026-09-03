import { defineConfig, devices } from '@playwright/test';

/**
 * The suite under test is the `generated/` directory - those files are produced
 * by `npm run generate`, never hand written.
 *
 * When YT_MOCK=1 (set by `--offline`) a tiny local stand-in for YouTube is
 * started first, so the whole pipeline can be demonstrated and run in CI
 * without depending on youtube.com being reachable.
 */
const offline = process.env.YT_MOCK === '1';

/** The CLI's --out directory, so generated specs are runnable wherever they land. */
const testDir = process.env.GENERATED_DIR || './generated';

export default defineConfig({
  testDir,
  testMatch: '**/*.spec.js',
  outputDir: './reports/artifacts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
  ],

  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  ...(offline
    ? {
        webServer: {
          command: 'node mock/server.js',
          url: 'http://127.0.0.1:4173/',
          reuseExistingServer: true,
          timeout: 30_000,
        },
      }
    : {}),
});
