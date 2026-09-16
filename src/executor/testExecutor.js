/**
 * Runs generated specs through the Playwright runner and reports the outcome.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { ErrorCode, PipelineError } from '../errors.js';

const REPORT_PATH = path.join('reports', 'html', 'index.html');

/**
 * `playwright test <file>` treats its arguments as regular expressions matched
 * against test file paths. On Windows path.join() yields backslashes, and a
 * backslash is a regex escape - "generated\\TC-OHRM-001.spec.js" matches
 * nothing and the run dies with "No tests found". Forward slashes match on
 * every platform.
 */
export const asTestFilter = (specFile) => specFile.split(path.sep).join('/');

/**
 * Locates Playwright's CLI entry point inside node_modules.
 *
 * The obvious `spawn('npx', ...)` is a trap on Windows: npx is a .cmd shim, and
 * since the fix for CVE-2024-27980 Node refuses to spawn .bat/.cmd without
 * `shell: true` (EINVAL), while `shell: true` with arguments is itself
 * deprecated (DEP0190). Running the CLI with the current Node binary sidesteps
 * both - no shim, no shell, identical behaviour on every platform.
 *
 * `cli.js` is not listed in either package's "exports", so resolve the package
 * entry point and look next to it rather than importing the path directly.
 */
export function resolvePlaywrightCli(fromUrl = import.meta.url) {
  const require = createRequire(fromUrl);
  for (const pkg of ['playwright', '@playwright/test']) {
    try {
      const cli = path.join(path.dirname(require.resolve(pkg)), 'cli.js');
      if (fs.existsSync(cli)) return cli;
    } catch {
      // Try the next package.
    }
  }
  return null;
}

/**
 * @param {string[]} specFiles paths of generated spec files (empty = whole suite)
 * @param {{ offline?: boolean, headed?: boolean, cwd?: string, testDir?: string }} [options]
 * @returns {Promise<{ exitCode: number, reportPath: string }>}
 */
export function runTests(specFiles = [], options = {}) {
  const args = ['test', ...specFiles.map(asTestFilter)];
  if (options.headed) args.push('--headed');

  const env = { ...process.env };
  if (options.offline) env.YT_MOCK = '1';
  if (options.testDir) env.GENERATED_DIR = options.testDir;

  return new Promise((resolve, reject) => {
    const cli = resolvePlaywrightCli();
    if (!cli) {
      reject(
        new PipelineError(ErrorCode.TEST_EXECUTION_FAILED, 'Could not find the Playwright CLI in node_modules.', {
          hint: 'Run `npm install` and `npx playwright install chromium` first.',
        }),
      );
      return;
    }

    const child = spawn(process.execPath, [cli, ...args], {
      cwd: options.cwd ?? process.cwd(),
      env,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(
        new PipelineError(ErrorCode.TEST_EXECUTION_FAILED, `Could not start Playwright: ${error.message}`, {
          hint: 'Run `npm install` and `npx playwright install chromium` first.',
        }),
      );
    });

    child.on('close', (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, reportPath: REPORT_PATH });
    });
  });
}

/**
 * Opens the HTML report, using the same shim-free invocation as runTests.
 *
 * The report is served over HTTP rather than opened from disk: the reporter
 * writes index.html plus a data/ directory that the page fetches at runtime,
 * and those fetches are blocked under file://.
 *
 * `--host 127.0.0.1` is deliberate. Playwright defaults to "localhost", which
 * on Windows can resolve to ::1 for one process and 127.0.0.1 for another, so
 * the browser reports ERR_CONNECTION_REFUSED against a server that is running
 * perfectly well. Pinning the address makes both ends agree.
 */
export function showReport(reportDir) {
  const cli = resolvePlaywrightCli();
  if (!cli) {
    return Promise.reject(
      new PipelineError(ErrorCode.TEST_EXECUTION_FAILED, 'Could not find the Playwright CLI in node_modules.', {
        hint: 'Run `npm install` first.',
      }),
    );
  }
  const child = spawn(process.execPath, [cli, 'show-report', reportDir, '--host', '127.0.0.1'], {
    stdio: 'inherit',
  });
  return new Promise((resolve) => child.on('close', (code) => resolve(code ?? 0)));
}

export { REPORT_PATH };
