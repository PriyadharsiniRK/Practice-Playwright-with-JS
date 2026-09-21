import { defineConfig, devices } from '@playwright/test';

import { loadProjectEnv } from './src/util/loadEnv.js';

// Honour .env here too, so `npx playwright test` behaves like the CLI.
loadProjectEnv();

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

/**
 * Which browser build to launch.
 *
 * The default, 'chromium', is the full Chromium that Playwright downloads -
 * deliberately not the separate chromium-headless-shell artifact, so the suite
 * depends on one download rather than two.
 *
 * Set PW_CHANNEL to use a browser already installed on the machine instead:
 *
 *   PW_CHANNEL=chrome   Google Chrome
 *   PW_CHANNEL=msedge   Microsoft Edge
 *
 * That path needs no `playwright install` at all, which is the way out when the
 * download cannot complete on a given machine (proxy, or antivirus removing the
 * extracted binary).
 */
const channel = process.env.PW_CHANNEL || 'chromium';

/**
 * Video capture is the one artifact that needs Playwright's ffmpeg binary, and
 * ffmpeg arrives with the browser download. A machine that cannot complete that
 * download would otherwise fail at `browserContext.newPage` before running a
 * single step, even when the browser itself is fine (see PW_CHANNEL above).
 *
 * Traces and screenshots need no extra binary and stay on, so the HTML report
 * still explains every failure. Set PW_VIDEO=1 to record video as well.
 */
const video = process.env.PW_VIDEO === '1' ? 'retain-on-failure' : 'off';

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
    // Step-by-step view for cross-checking against the manual test case. Single
    // file with the screenshots embedded, so it opens without a server.
    ['./src/report/stepReporter.js', { outputFile: 'reports/step-report.html' }],
  ],

  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel,
      },
    },
  ],

  // One stand-in per application under test.
  ...(offline
    ? {
        webServer: [
          {
            command: 'node mock/server.js',
            url: 'http://127.0.0.1:4173/',
            reuseExistingServer: true,
            timeout: 30_000,
          },
          {
            command: 'node mock/orangehrm.js',
            url: 'http://127.0.0.1:4174/web/index.php/auth/login',
            reuseExistingServer: true,
            timeout: 30_000,
          },
        ],
      }
    : {}),
});
